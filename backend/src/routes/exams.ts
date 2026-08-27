import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import Exam from '../models/Exam';
import { examQueue } from '../lib/queue';
import { getPdfPageCount, getOrGeneratePageImage } from '../lib/pdfUtils';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const pageCacheDir = path.join(process.cwd(), uploadDir, '_page_cache');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(pageCacheDir)) fs.mkdirSync(pageCacheDir, { recursive: true });

// ─── Multer — accept two files ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only JPEG, PNG, PDF files are allowed'));
  },
});

const noCache = (res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const CreateExamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  subject: z.string().max(100).optional(),
  grade: z.string().max(50).optional(),
  studentName: z.string().max(100).optional(),
});

// ─── GET /api/v1/exams — List all exams ──────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    noCache(res);
    const exams = await Exam.find()
      .sort({ createdAt: -1 })
      .select('-questions -answers') // exclude heavy fields from list
      .lean();
    res.json({ success: true, data: exams });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/v1/exams/:id — Get single exam with full results ────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    noCache(res);
    const exam = await Exam.findById(req.params.id).lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    res.json({ success: true, data: exam });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/v1/exams — Upload files + create exam + enqueue ───────────────
router.post(
  '/',
  upload.fields([
    { name: 'questionPaper', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const parsed = CreateExamSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: parsed.error.flatten().fieldErrors,
        });
      }

      const files = req.files as Record<string, any[]>;
      const questionPaperFile = files?.['questionPaper']?.[0];
      const answerSheetFile = files?.['answerSheet']?.[0];

      if (!questionPaperFile) {
        return res.status(400).json({ success: false, message: 'Question paper file is required' });
      }
      if (!answerSheetFile) {
        return res.status(400).json({ success: false, message: 'Answer sheet file is required' });
      }

      const { title, subject, grade, studentName } = parsed.data;

      const questionPaperAbsPath = path.join(process.cwd(), uploadDir, questionPaperFile.filename);
      const answerSheetAbsPath = path.join(process.cwd(), uploadDir, answerSheetFile.filename);

      // Get page counts quickly (non-blocking from job)
      let questionPaperPages = 1;
      let answerSheetPages = 1;
      try {
        [questionPaperPages, answerSheetPages] = await Promise.all([
          getPdfPageCount(questionPaperAbsPath),
          getPdfPageCount(answerSheetAbsPath),
        ]);
      } catch {}

      const exam = await Exam.create({
        title: title.trim(),
        subject: subject?.trim(),
        grade: grade?.trim(),
        studentName: studentName?.trim(),
        questionPaperUrl: `/uploads/${questionPaperFile.filename}`,
        answerSheetUrl: `/uploads/${answerSheetFile.filename}`,
        questionPaperFileName: questionPaperFile.originalname,
        answerSheetFileName: answerSheetFile.originalname,
        questionPaperPages,
        answerSheetPages,
        status: 'pending',
        progressStep: 'Queued for processing...',
      });

      const job = await examQueue.add(
        'process-exam',
        {
          examId: exam._id.toString(),
          questionPaperPath: questionPaperAbsPath,
          answerSheetPath: answerSheetAbsPath,
        },
        { priority: 1 }
      );

      await Exam.findByIdAndUpdate(exam._id, { jobId: job.id });

      noCache(res);
      res.status(201).json({
        success: true,
        data: exam.toJSON(),
        jobId: job.id,
      });
    } catch (err: any) {
      console.error('Create exam error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── DELETE /api/v1/exams/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Not found' });

    // Cleanup uploaded files
    for (const url of [exam.questionPaperUrl, exam.answerSheetUrl]) {
      try {
        const filePath = path.join(process.cwd(), url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {}
    }

    res.json({ success: true, message: 'Exam deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/v1/exams/:id/page-image/:sheet/:page ───────────────────────────
// Serves a rendered PNG image of a specific PDF page (cached on disk)
router.get('/:id/page-image/:sheet/:page', async (req: Request, res: Response) => {
  try {
    const { id, sheet, page } = req.params;
    const pageNumber = parseInt(page, 10);

    if (!['question', 'answer'].includes(sheet)) {
      return res.status(400).json({ success: false, message: 'sheet must be "question" or "answer"' });
    }

    const exam = await Exam.findById(id).select('questionPaperUrl answerSheetUrl').lean();
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const pdfUrl = sheet === 'question' ? exam.questionPaperUrl : exam.answerSheetUrl;
    const pdfPath = path.join(process.cwd(), pdfUrl);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on disk' });
    }

    const imagePath = await getOrGeneratePageImage(pdfPath, pageNumber, pageCacheDir);
    if (!imagePath || !fs.existsSync(imagePath)) {
      return res.status(500).json({ success: false, message: 'Failed to render page' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24h
    res.sendFile(imagePath);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
