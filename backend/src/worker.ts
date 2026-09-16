import "dotenv/config";
import fs from "node:fs/promises";
import { Worker } from "bullmq";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { CartoonizeJobData, redisConnection } from "./lib/queue";
import { deleteIfExists, intakePath, saveCartoon } from "./lib/storage";

const CARTOONIZER_URL = process.env.CARTOONIZER_URL ?? "http://127.0.0.1:4002";

// F1.3: the intake file is deleted here on every path (success or failure) —
// there is no retry path that leaves an original image sitting on disk.
const worker = new Worker<CartoonizeJobData>(
  "cartoonize",
  async (job) => {
    const { postId, style } = job.data;
    const inPath = intakePath(postId);

    try {
      const original = await fs.readFile(inPath);

      const query = style ? `?style=${style}` : "";
      const response = await fetch(`${CARTOONIZER_URL}/cartoonize${query}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          ...(process.env.CARTOONIZER_SHARED_SECRET
            ? { "x-internal-secret": process.env.CARTOONIZER_SHARED_SECRET }
            : {}),
        },
        body: original,
      });

      if (!response.ok) {
        throw new Error(`cartoonizer responded ${response.status}`);
      }

      const cartoonBuffer = Buffer.from(await response.arrayBuffer());
      const imageUrl = await saveCartoon(postId, cartoonBuffer);

      await prisma.post.update({
        where: { id: postId },
        data: { status: "ready", imageUrl },
      });
    } catch (err) {
      logger.error({ err, postId }, "cartoonize job failed");
      await prisma.post.update({
        where: { id: postId },
        data: { status: "failed", failureReason: "cartoonization failed" },
      });
    } finally {
      deleteIfExists(inPath);
    }
  },
  { connection: redisConnection }
);

worker.on("ready", () => logger.info("toonymous cartoonize worker ready"));
worker.on("failed", (job, err) => logger.error({ err, jobId: job?.id }, "job failed"));
