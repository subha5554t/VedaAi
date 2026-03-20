import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import Assignment from '../models/Assignment';
import { generateQuestionPaper } from '../services/aiService';
import { cacheDel } from '../lib/queue';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vedaai';
  await mongoose.connect(uri);
  console.log('Worker: MongoDB connected');
};

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

// Use HTTP polling to notify instead of Redis pub/sub
async function notifyFrontend(assignmentId: string, status: string, progress: number) {
  try {
    await fetch(`http://localhost:${process.env.PORT || 5000}/api/internal/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId, status, progress }),
    });
  } catch (e) {
    // Non-fatal
  }
}

export interface GenerationJobData {
  assignmentId: string;
  title: string;
  subject?: string;
  grade?: string;
  chapter?: string;
  questionTypes: any[];
  additionalInstructions?: string;
}

async function processGenerationJob(job: Job<GenerationJobData>) {
  const { assignmentId, ...input } = job.data;
  console.log(`Processing job ${job.id} for assignment ${assignmentId}`);

  try {
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
    await notifyFrontend(assignmentId, 'processing', 10);
    await job.updateProgress(10);

    console.log('🤖 Calling Groq llama-3.3-70b-versatile...');

    const questionPaper = await generateQuestionPaper({
      title: input.title,
      subject: input.subject,
      grade: input.grade,
      chapter: input.chapter,
      questionTypes: input.questionTypes,
      additionalInstructions: input.additionalInstructions,
      schoolName: 'Delhi Public School, Bokaro',
    });

    await job.updateProgress(80);
    await notifyFrontend(assignmentId, 'processing', 80);

    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'completed',
      result: questionPaper,
    });

    await cacheDel(`assignment:${assignmentId}`);
    await cacheDel('assignments:list');

    await job.updateProgress(100);
    await notifyFrontend(assignmentId, 'completed', 100);

    console.log(`✅ Job ${job.id} completed`);
    return { success: true, assignmentId };
  } catch (err: any) {
    console.error(`❌ Job ${job.id} failed:`, err.message);
    await Assignment.findByIdAndUpdate(assignmentId, {
      status: 'failed',
      errorMessage: err.message,
    });
    await notifyFrontend(assignmentId, 'failed', 0);
    throw err;
  }
}

async function startWorker() {
  await connectDB();

  const worker = new Worker<GenerationJobData>(
    'question-generation',
    processGenerationJob,
    {
      connection: {
        url: redisUrl,
        tls: isTLS ? {} : undefined,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      } as any,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => console.log(`✅ Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`❌ Job ${job?.id} failed:`, err.message));

  console.log('🔧 Question generation worker started');
}

startWorker().catch(console.error);