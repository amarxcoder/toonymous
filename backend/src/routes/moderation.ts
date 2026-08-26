import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../lib/requireAuth";
import { requireRole } from "../lib/requireRole";

// Internal moderation tool (F5.2). No reviewer-facing "real identity" of the
// reported account ever appears here - only the anonymous handle already
// public on the content, plus account/device signals (F5.4), never email.
export const moderationRouter = Router();
moderationRouter.use(...requireRole("moderator"));

async function targetPreview(targetType: "post" | "comment", targetId: string) {
  if (targetType === "post") {
    const post = await prisma.post.findUnique({
      where: { id: targetId },
      include: { user: { select: { handle: true } } },
    });
    if (!post) return null;
    return { status: post.status, caption: post.caption, imageUrl: post.imageUrl, authorHandle: post.user.handle };
  }
  const comment = await prisma.comment.findUnique({
    where: { id: targetId },
    include: { user: { select: { handle: true } } },
  });
  if (!comment) return null;
  return { removedAt: comment.removedAt, text: comment.text, authorHandle: comment.user.handle };
}

moderationRouter.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const status = req.query.status === "resolved" ? "resolved" : "open";
    const reports = await prisma.report.findMany({
      where: { status },
      orderBy: { createdAt: "asc" },
      include: { reporter: { select: { handle: true } } },
      take: 50,
    });
    const withPreviews = await Promise.all(
      reports.map(async (r) => ({
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
        reporterHandle: r.reporter.handle,
        target: await targetPreview(r.targetType, r.targetId),
      }))
    );
    res.json({ reports: withPreviews });
  })
);

const resolveSchema = z.object({
  action: z.enum(["remove_content", "shadow_limit", "ban", "no_action"]),
  note: z.string().max(500).optional(),
});

moderationRouter.post(
  "/reports/:id/resolve",
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = resolveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "a valid action is required" });
      return;
    }
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report || report.status !== "open") {
      res.status(404).json({ error: "open report not found" });
      return;
    }
    const { action, note } = parsed.data;

    let targetType: "post" | "comment" | "account" = report.targetType;
    let targetId = report.targetId;

    if (action === "remove_content") {
      if (report.targetType === "post") {
        await prisma.post.update({ where: { id: report.targetId }, data: { status: "removed" } });
      } else {
        await prisma.comment.update({ where: { id: report.targetId }, data: { removedAt: new Date() } });
      }
    } else if (action === "shadow_limit" || action === "ban") {
      const authorId =
        report.targetType === "post"
          ? (await prisma.post.findUnique({ where: { id: report.targetId } }))?.userId
          : (await prisma.comment.findUnique({ where: { id: report.targetId } }))?.userId;
      if (!authorId) {
        res.status(404).json({ error: "reported content no longer exists" });
        return;
      }
      targetType = "account";
      targetId = authorId;
      if (action === "shadow_limit") {
        await prisma.user.update({ where: { id: authorId }, data: { shadowLimited: true } });
      } else {
        await prisma.user.update({ where: { id: authorId }, data: { bannedAt: new Date() } });
        await prisma.refreshToken.deleteMany({ where: { userId: authorId } });
      }
    }

    const moderationAction = await prisma.moderationAction.create({
      data: {
        reportId: report.id,
        moderatorId: req.userId!,
        targetType,
        targetId,
        action,
        note,
      },
    });
    await prisma.report.update({ where: { id: report.id }, data: { status: "resolved", resolvedAt: new Date() } });

    res.json({ id: moderationAction.id, action: moderationAction.action, targetType, targetId });
  })
);

moderationRouter.get(
  "/appeals",
  asyncHandler(async (req, res) => {
    const statusFilter =
      req.query.status === "resolved"
        ? { in: ["approved", "denied"] as ("approved" | "denied")[] }
        : ("pending" as const);
    const appeals = await prisma.appeal.findMany({
      where: { status: statusFilter },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { handle: true } }, moderationAction: true },
      take: 50,
    });
    res.json({
      appeals: appeals.map((a) => ({
        id: a.id,
        reason: a.reason,
        status: a.status,
        createdAt: a.createdAt,
        userHandle: a.user.handle,
        action: {
          id: a.moderationAction.id,
          action: a.moderationAction.action,
          targetType: a.moderationAction.targetType,
          targetId: a.moderationAction.targetId,
          note: a.moderationAction.note,
        },
      })),
    });
  })
);

const appealResolveSchema = z.object({ status: z.enum(["approved", "denied"]) });

moderationRouter.post(
  "/appeals/:id/resolve",
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = appealResolveSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "status must be approved or denied" });
      return;
    }
    const appeal = await prisma.appeal.findUnique({
      where: { id: req.params.id },
      include: { moderationAction: true },
    });
    if (!appeal || appeal.status !== "pending") {
      res.status(404).json({ error: "pending appeal not found" });
      return;
    }

    if (parsed.data.status === "approved") {
      const { targetType, targetId, action } = appeal.moderationAction;
      if (action === "remove_content" && targetType === "post") {
        await prisma.post.update({ where: { id: targetId }, data: { status: "ready" } });
      } else if (action === "remove_content" && targetType === "comment") {
        await prisma.comment.update({ where: { id: targetId }, data: { removedAt: null } });
      } else if (action === "shadow_limit" && targetType === "account") {
        await prisma.user.update({ where: { id: targetId }, data: { shadowLimited: false } });
      } else if (action === "ban" && targetType === "account") {
        await prisma.user.update({ where: { id: targetId }, data: { bannedAt: null } });
      }
      await prisma.moderationAction.create({
        data: {
          moderatorId: req.userId!,
          targetType,
          targetId,
          action: "reverse",
          note: `appeal ${appeal.id} approved`,
        },
      });
    }

    await prisma.appeal.update({
      where: { id: appeal.id },
      data: { status: parsed.data.status, resolvedAt: new Date() },
    });
    res.status(204).end();
  })
);
