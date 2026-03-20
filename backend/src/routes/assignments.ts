import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Assignment from '../models/Assignment';
import { questionQueue, cacheGet, cacheSet, cacheDel } from '../lib/queue';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

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
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error('Only JPEG, PNG, PDF files are allowed'));
  },
});

const noCache = (res: Response) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
};

router.get('/', async (req: Request, res: Response) => {
  try {
    noCache(res);
    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .select('-result')
      .lean();
    res.json({ success: true, data: assignments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    noCache(res);
    const { id } = req.params;
    const assignment = await Assignment.findById(id).lean();
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, data: assignment });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, chapter, dueDate, additionalInstructions } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!dueDate) {
      return res.status(400).json({ success: false, message: 'Due date is required' });
    }

    let questionTypes: any[] = [];
    try {
      const raw = req.body.questionTypes;
      questionTypes = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid questionTypes format' });
    }

    if (!questionTypes || !questionTypes.length) {
      return res.status(400).json({ success: false, message: 'At least one question type required' });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      subject: subject?.trim(),
      grade: grade?.trim(),
      chapter: chapter?.trim(),
      dueDate: new Date(dueDate),
      questionTypes,
      additionalInstructions: additionalInstructions?.trim(),
      fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      fileName: req.file?.originalname,
      status: 'pending',
    });

    const job = await questionQueue.add(
      'generate-questions',
      {
        assignmentId: assignment._id.toString(),
        title: title.trim(),
        subject: subject?.trim(),
        grade: grade?.trim(),
        chapter: chapter?.trim(),
        questionTypes,
        additionalInstructions: additionalInstructions?.trim(),
      },
      { priority: 1 }
    );

    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });
    await cacheDel('assignments:list');

    noCache(res);
    res.status(201).json({
      success: true,
      data: assignment.toJSON(),
      jobId: job.id,
    });
  } catch (err: any) {
    console.error('Create assignment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    await Assignment.findByIdAndUpdate(id, {
      status: 'pending',
      result: undefined,
      errorMessage: undefined,
    });
    const job = await questionQueue.add('generate-questions', {
      assignmentId: id,
      title: assignment.title,
      subject: assignment.subject,
      grade: assignment.grade,
      chapter: assignment.chapter,
      questionTypes: assignment.questionTypes,
      additionalInstructions: assignment.additionalInstructions,
    });
    await Assignment.findByIdAndUpdate(id, { jobId: job.id });
    await cacheDel(`assignment:${id}`);
    await cacheDel('assignments:list');
    res.json({ success: true, jobId: job.id });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    await cacheDel(`assignment:${id}`);
    await cacheDel('assignments:list');
    if (assignment.fileUrl) {
      const filePath = path.join(process.cwd(), assignment.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;