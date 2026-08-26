import { Queue } from "bullmq";
import IORedis from "ioredis";

// N3: cartoonization runs as an async background job, never inline in the
// upload request/response cycle.
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379/1";

export const redisConnection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export interface CartoonizeJobData {
  postId: string;
}

export const cartoonizeQueue = new Queue<CartoonizeJobData>("cartoonize", {
  connection: redisConnection,
});
