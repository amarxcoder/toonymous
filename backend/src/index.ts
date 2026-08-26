import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import { appealsRouter } from "./routes/appeals";
import { authRouter } from "./routes/auth";
import { avatarRouter } from "./routes/avatar";
import { blocksRouter } from "./routes/blocks";
import { commentsRouter } from "./routes/comments";
import { complianceRouter } from "./routes/compliance";
import { followsRouter } from "./routes/follows";
import { meRouter } from "./routes/me";
import { moderationRouter } from "./routes/moderation";
import { postsRouter } from "./routes/posts";
import { reportsRouter } from "./routes/reports";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { redisConnection } from "./lib/queue";
import { startRetentionJob } from "./lib/retention";
import { cartoonDir } from "./lib/storage";

const app = express();
const PORT = process.env.PORT ?? 3081;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3080";

// Behind nginx in production (root CLAUDE.md deploy convention) - needed so
// req.ip reflects the real client for rate limiting (F5.3), not the proxy.
app.set("trust proxy", 1);

app.use(pinoHttp({ logger }));
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// N4: checks the two things that actually take the app down if they're
// unreachable, not just "process is alive."
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redisConnection.ping();
    res.json({ status: "ok" });
  } catch (err) {
    logger.error({ err }, "health check failed");
    res.status(503).json({ status: "unavailable" });
  }
});

app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/avatar", avatarRouter);
app.use("/posts", postsRouter);
app.use("/posts", commentsRouter);
app.use("/reports", reportsRouter);
app.use("/blocks", blocksRouter);
app.use("/follows", followsRouter);
app.use("/appeals", appealsRouter);
app.use("/moderation", moderationRouter);
app.use("/compliance", complianceRouter);

// Local dev stand-in for a CDN-served object storage bucket (specs/04-conventions.md).
// Only cartoonized output ever lands in this directory — see lib/storage.ts.
app.use(
  "/cdn",
  express.static(cartoonDir, { maxAge: "1y", immutable: true })
);

// Last-resort handler: a route bug must never take the whole process down.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "unhandled route error");
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  logger.info(`toonymous backend listening on http://localhost:${PORT}`);
});

// N2 safety net: the worker deletes intake files in a `finally` block on
// every job, but a hard crash mid-job could still leave one behind. This
// sweeps anything older than an hour so an original is never retained
// indefinitely by accident.
startRetentionJob();
