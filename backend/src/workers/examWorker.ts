import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import IORedis from 'ioredis';
import path from 'path';
import Exam from '../models/Exam';
import { pdfToBase64Images, getPdfPageCount } from '../lib/pdfUtils';
import {
  extractQuestionsFromImages,
  mapAnswersFromImages,
  gradeAnswersWithGemini,
} from '../services/examAiService';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
  await mongoose.connect(uri);
  console.log('Exam Worker: MongoDB connected');
};

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

// Redis Publisher
const pubRedis = new IORedis(redisUrl, {
  tls: isTLS ? {} : undefined,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
  retryStrategy: (times: number) => Math.min(times * 500, 2000),
} as any);

pubRedis.on('error', (err) => console.warn('Exam worker pub Redis error:', err.message));

async function notify(examId: string, status: string, progress: number, step: string) {
  try {
    await pubRedis.publish(
      'job:update',
      JSON.stringify({ examId, status, progress, step, type: 'exam' })
    );
  } catch {}
}

// Job Data Shape
export interface ExamJobData {
  examId: string;
  questionPaperPath: string; // absolute local path
  answerSheetPath: string;
}

// Main Processing Function
async function processExamJob(job: Job<ExamJobData>) {
  const { examId, questionPaperPath, answerSheetPath } = job.data;
  console.log(`Processing exam job ${job.id} for exam ${examId}`);

  try {
    // Step 1: Extracting questions
    await Exam.findByIdAndUpdate(examId, { status: 'extracting', progressStep: 'Extracting questions from paper...' });
    await notify(examId, 'extracting', 10, 'Extracting questions from paper...');
    await job.updateProgress(10);

    console.log('Converting question paper to images...');
    const questionPageImages = await pdfToBase64Images(questionPaperPath);
    const questionPaperPages = questionPageImages.length;

    console.log(`Extracting questions from ${questionPaperPages} page(s)...`);
    const questions = await extractQuestionsFromImages(questionPageImages);
    console.log(`Extracted ${questions.length} questions`);

    await Exam.findByIdAndUpdate(examId, {
      questions,
      questionPaperPages,
      status: 'analyzing',
      progressStep: `Analyzing answer sheet...`,
    });
    await notify(examId, 'analyzing', 30, `Analyzing answer sheet...`);
    await job.updateProgress(30);

    // Step 2: Analyzing answer sheet
    console.log('Converting answer sheet to images...');
    const answerPageImages = await pdfToBase64Images(answerSheetPath);
    const answerSheetPages = answerPageImages.length;

    await Exam.findByIdAndUpdate(examId, {
      answerSheetPages,
      progressStep: `Mapping answers to questions...`,
      status: 'mapping',
    });
    await notify(examId, 'mapping', 50, 'Mapping answers to questions...');
    await job.updateProgress(50);

    // Step 3: Mapping answers
    console.log(`Mapping answers across ${answerSheetPages} page(s)...`);
    const rawAnswers = await mapAnswersFromImages(answerPageImages, questions);
    console.log(`Mapped ${rawAnswers.filter((a) => a.answered).length}/${questions.length} answers`);

    await Exam.findByIdAndUpdate(examId, {
      answers: rawAnswers,
      status: 'grading',
      progressStep: 'Generating AI feedback...',
    });
    await notify(examId, 'grading', 70, 'Generating AI feedback...');
    await job.updateProgress(70);

    // Step 4: Grading + feedback
    console.log('Grading answers...');
    const gradedAnswers = await gradeAnswersWithGemini(questions, rawAnswers);

    const totalScore = gradedAnswers.reduce((sum, a) => sum + (a.score || 0), 0);
    const totalMaxScore = gradedAnswers.reduce((sum, a) => sum + (a.maxScore || 0), 0);

    // Step 5: Save & complete
    await Exam.findByIdAndUpdate(examId, {
      status: 'completed',
      progressStep: 'Done!',
      answers: gradedAnswers,
      totalScore,
      totalMaxScore,
    });

    await job.updateProgress(100);
    await notify(examId, 'completed', 100, 'Done!');

    console.log(`Exam job ${job.id} completed — ${totalScore}/${totalMaxScore}`);
    return { success: true, examId };
  } catch (err: any) {
    console.error(`Exam job ${job.id} failed:`, err.message);
    await Exam.findByIdAndUpdate(examId, {
      status: 'failed',
      errorMessage: err.message,
      progressStep: 'Processing failed',
    });
    await notify(examId, 'failed', 0, err.message);
    throw err;
  }
}

// Start Worker
async function startExamWorker() {
  await connectDB();

  const worker = new Worker<ExamJobData>(
    'exam-processing',
    processExamJob,
    {
      connection: {
        url: redisUrl,
        tls: isTLS ? {} : undefined,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      } as any,
      concurrency: 2, // Lower concurrency — Gemini calls are heavy
    }
  );

  worker.on('completed', (job) => console.log(`Exam job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`Exam job ${job?.id} failed:`, err.message));

  console.log('Exam processing worker started');
}

startExamWorker().catch(console.error);
