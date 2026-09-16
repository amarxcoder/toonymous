import "dotenv/config";
import fs from "node:fs/promises";
import { Worker } from "bullmq";
import { CARTOONIZER_URL, cartoonizerHeaders } from "./lib/cartoonizer";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { CartoonizeJobData, redisConnection } from "./lib/queue";
import { deleteIfExists, intakePath, saveCartoon } from "./lib/storage";

// The cartoonizer turning an image down (a 4xx: unconvertible image, unknown
// style, bad shared secret) is a verdict — retrying only earns the same
// answer, so the post fails straight away. A 5xx, a 429 or a transport-level
// throw means it was unreachable or overloaded, usually a free-tier cold
// start, and deserves another attempt.
class CartoonizerRefused extends Error {}

function isTransient(err: unknown): boolean {
  if (err instanceof CartoonizerRefused) return false;
  // Intake file gone: nothing to retry with.
  return (err as NodeJS.ErrnoException | null)?.code !== "ENOENT";
}

// F1.3: the intake file is deleted here on every path that ends the job —
// success or terminal failure. The one path that skips deletion is a retry,
// which needs the file to still be there and re-enters this function.
const worker = new Worker<CartoonizeJobData>(
  "cartoonize",
  async (job) => {
    const { postId, style } = job.data;
    const inPath = intakePath(postId);
    const attempt = job.attemptsMade + 1;
    const lastAttempt = attempt >= (job.opts.attempts ?? 1);

    try {
      const original = await fs.readFile(inPath);

      const query = style ? `?style=${style}` : "";
      const response = await fetch(`${CARTOONIZER_URL}/cartoonize${query}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          ...cartoonizerHeaders(),
        },
        body: original,
      });

      if (!response.ok) {
        const message = `cartoonizer responded ${response.status}`;
        throw response.status >= 500 || response.status === 429
          ? new Error(message)
          : new CartoonizerRefused(message);
      }

      const cartoonBuffer = Buffer.from(await response.arrayBuffer());
      const imageUrl = await saveCartoon(postId, cartoonBuffer);

      await prisma.post.update({
        where: { id: postId },
        data: { status: "ready", imageUrl },
      });
    } catch (err) {
      if (isTransient(err) && !lastAttempt) {
        logger.warn({ err, postId, attempt }, "cartoonize attempt failed, retrying");
        throw err;
      }
      logger.error({ err, postId, attempt }, "cartoonize job failed");
      await prisma.post.update({
        where: { id: postId },
        data: { status: "failed", failureReason: "cartoonization failed" },
      });
    }

    deleteIfExists(inPath);
  },
  { connection: redisConnection }
);

worker.on("ready", () => logger.info("toonymous cartoonize worker ready"));
worker.on("failed", (job, err) => logger.error({ err, jobId: job?.id }, "job failed"));
