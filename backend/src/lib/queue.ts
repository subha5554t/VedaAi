import { Queue, QueueEvents } from 'bullmq';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const isTLS = redisUrl.startsWith('rediss://');

const connection = {
  url: redisUrl,
  tls: isTLS ? {} : undefined,
  enableReadyCheck: false,
  maxRetriesPerRequest: null as null,
};

export const questionQueue = new Queue('question-generation', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

export const questionQueueEvents = new QueueEvents('question-generation', {
  connection,
});

const memCache = new Map<string, { value: string; expires: number }>();

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { memCache.delete(key); return null; }
    return JSON.parse(entry.value);
  } catch { return null; }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  try {
    memCache.set(key, {
      value: JSON.stringify(value),
      expires: Date.now() + ttlSeconds * 1000,
    });
  } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  memCache.delete(key);
}