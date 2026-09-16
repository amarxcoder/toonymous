import { Queue } from "bullmq";
import IORedis from "ioredis";

// N3: cartoonization runs as an async background job, never inline in the
// upload request/response cycle.
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379/1";

export const redisConnection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

// Style presets the user picks at post time. Keys must match STYLES in
// cartoonizer/src/providers/index.ts and the picker in frontend compose page.
export const CARTOON_STYLES = ["anime", "sketch", "comic"] as const;
export type CartoonStyle = (typeof CARTOON_STYLES)[number];

export interface CartoonizeJobData {
  postId: string;
  style?: CartoonStyle;
}

export const cartoonizeQueue = new Queue<CartoonizeJobData>("cartoonize", {
  connection: redisConnection,
  defaultJobOptions: {
    // The cartoonizer can be briefly unreachable without anything being
    // wrong with the image: a free-tier host spins it down when idle and the
    // cold start costs ~15s. Without retries a single blip fails the post
    // permanently and the user has to upload again. worker.ts decides which
    // failures are worth retrying; a refusal still fails on the first try.
    attempts: 3,
    backoff: { type: "exponential", delay: 15_000 },
  },
});
