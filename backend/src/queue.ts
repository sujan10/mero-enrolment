import { Queue } from 'bullmq';
import { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // url: process.env.REDIS_URL, // ioredis v5+ uses host/port, not url
};

export const pdfQueue = new Queue('pdf-jobs', {
  connection: {
    host: process.env.REDIS_URL,
    // If using Upstash, parse host/port/password from REDIS_URL as needed
    // For local Redis, use host: 'localhost', port: 6379
  },
}); 