import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { optionalAuth } from "../lib/optionalAuth";
import { commentCreateLimiter } from "../lib/rateLimit";
import { scrubPii } from "../lib/piiFilter";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/requireAuth";

// Mounted at /posts in index.ts, so routes here read as /posts/:postId/comments.
export const commentsRouter = Router();

const textSchema = z.string().trim().min(1).max(280);

function commentSummary(comment: {
  id: string;
  text: string;
  createdAt: Date;
  user: { handle: string; avatarSeed: string };
}) {
  return {
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    handle: comment.user.handle,
    avatarSeed: comment.user.avatarSeed,
  };
}

// Text only, scrubbed by the same PII/identity filter as captions (F2.3) -
// no comment-image uploads at MVP, per specs/02-features.md.
commentsRouter.post(
  "/:postId/comments",
  requireAuth,
  commentCreateLimiter,
  asyncHandler(async (req: AuthedRequest, res) => {
    const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
    if (!post || post.status !== "ready") {
      res.status(404).json({ error: "not found" });
      return;
    }
    const parsed = textSchema.safeParse(req.body.text);
    if (!parsed.success) {
      res.status(400).json({ error: "comment must be 1-280 characters" });
      return;
    }

    const comment = await prisma.comment.create({
      data: { postId: post.id, userId: req.userId!, text: scrubPii(parsed.data) },
      include: { user: { select: { handle: true, avatarSeed: true } } },
    });
    res.status(201).json(commentSummary(comment));
  })
);

commentsRouter.get(
  "/:postId/comments",
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const blocked = req.userId
      ? await prisma.block.findMany({ where: { blockerId: req.userId }, select: { blockedId: true } })
      : [];
    const excludeAuthors = blocked.map((b) => b.blockedId);
    const comments = await prisma.comment.findMany({
      where: {
        postId: req.params.postId,
        removedAt: null,
        ...(excludeAuthors.length ? { userId: { notIn: excludeAuthors } } : {}),
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { user: { select: { handle: true, avatarSeed: true } } },
    });
    const nextCursor = comments.length === limit ? comments[comments.length - 1]!.id : null;
    res.json({ comments: comments.map(commentSummary), nextCursor });
  })
);
