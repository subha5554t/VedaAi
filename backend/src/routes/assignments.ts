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
    const mime = /jpeg|jpg|png|pdf/.test(file.mimetype);
    if (ext || mime) cb(null, true);
    else cb(new Error('Only JPEG, PNG, PDF files are allowed'));
  },
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const cached = await cacheGet<any[]>('assignments:list');
    if (cached) return res.json({ success: true, data: cached });

    const assignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .select('-result')
      .lean();

    await cacheSet('assignments:list', assignments, 60);
    res.json({ success: true, data: assignments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cached = await cacheGet<any>(`assignment:${id}`);
    if (cached && cached.status === 'completed') {
      return res.json({ success: true, data: cached });
    }

    const assignment = await Assignment.findById(id).lean();
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    if (assignment.status === 'completed') {
      await cacheSet(`assignment:${id}`, assignment, 3600);
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
      if (typeof raw === 'string') {
        questionTypes = JSON.parse(raw);
      } else if (Array.isArray(raw)) {
        questionTypes = raw;
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid questionTypes format' });
    }

    if (!questionTypes.length) {
      return res.status(400).json({ success: false, message: 'At least one question type is required' });
    }

    for (const qt of questionTypes) {
      if (!qt.type || qt.numberOfQuestions < 1 || qt.marks < 1) {
        return res.status(400).json({
          success: false,
          message: 'Each question type must have valid type, numberOfQuestions >= 1, and marks >= 1',
        });
      }
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
      return res.status(404).json({ success: false, message: 'Assignment not found' });
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
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    await cacheDel(`assignment:${id}`);
    await cacheDel('assignments:list');

    if (assignment.fileUrl) {
      const filePath = path.join(process.cwd(), assignment.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Assignment deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;