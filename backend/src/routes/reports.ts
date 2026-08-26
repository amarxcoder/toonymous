import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { reportCreateLimiter } from "../lib/rateLimit";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/requireAuth";

export const reportsRouter = Router();

const reportSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

// Report post/comment -> moderation queue entry, with an audit trail
// (F5.2). The reported account's real identity never enters this record -
// only the anonymous handle already public on the content itself.
reportsRouter.post(
  "/",
  requireAuth,
  reportCreateLimiter,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "a target and reason are required" });
      return;
    }
    const { targetType, targetId, reason } = parsed.data;

    const exists =
      targetType === "post"
        ? await prisma.post.findUnique({ where: { id: targetId } })
        : await prisma.comment.findUnique({ where: { id: targetId } });
    if (!exists) {
      res.status(404).json({ error: "reported content not found" });
      return;
    }

    const report = await prisma.report.create({
      data: { targetType, targetId, reason, reporterId: req.userId! },
    });
    res.status(201).json({ id: report.id, status: report.status, createdAt: report.createdAt });
  })
);
