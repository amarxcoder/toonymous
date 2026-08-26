import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/requireAuth";

// Report/appeal path for moderation decisions, even for anonymous accounts
// (N6). An appeal can only be filed by whoever the moderation action
// actually targeted - the post/comment's author, or the account itself for
// a shadow-limit/ban.
export const appealsRouter = Router();
appealsRouter.use(requireAuth);

const appealSchema = z.object({
  moderationActionId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
});

async function isAffectedParty(userId: string, action: { targetType: string; targetId: string }) {
  if (action.targetType === "account") return action.targetId === userId;
  if (action.targetType === "post") {
    const post = await prisma.post.findUnique({ where: { id: action.targetId } });
    return post?.userId === userId;
  }
  const comment = await prisma.comment.findUnique({ where: { id: action.targetId } });
  return comment?.userId === userId;
}

appealsRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = appealSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "a moderation action and reason are required" });
      return;
    }
    const action = await prisma.moderationAction.findUnique({
      where: { id: parsed.data.moderationActionId },
    });
    if (!action) {
      res.status(404).json({ error: "moderation action not found" });
      return;
    }
    if (!(await isAffectedParty(req.userId!, action))) {
      res.status(403).json({ error: "you can only appeal an action taken against you" });
      return;
    }

    const existing = await prisma.appeal.findUnique({ where: { moderationActionId: action.id } });
    if (existing) {
      res.status(409).json({ error: "this action has already been appealed" });
      return;
    }

    const appeal = await prisma.appeal.create({
      data: { moderationActionId: action.id, userId: req.userId!, reason: parsed.data.reason },
    });
    res.status(201).json({ id: appeal.id, status: appeal.status, createdAt: appeal.createdAt });
  })
);

// Actions taken against my content/account, so I know what's appealable.
appealsRouter.get(
  "/actionable",
  asyncHandler(async (req: AuthedRequest, res) => {
    const [myPosts, myComments] = await Promise.all([
      prisma.post.findMany({ where: { userId: req.userId! }, select: { id: true } }),
      prisma.comment.findMany({ where: { userId: req.userId! }, select: { id: true } }),
    ]);
    const actions = await prisma.moderationAction.findMany({
      where: {
        action: { notIn: ["reverse", "no_action"] },
        OR: [
          { targetType: "account", targetId: req.userId! },
          { targetType: "post", targetId: { in: myPosts.map((p) => p.id) } },
          { targetType: "comment", targetId: { in: myComments.map((c) => c.id) } },
        ],
      },
      include: { appeals: { where: { userId: req.userId! } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      actions: actions.map((a) => ({
        id: a.id,
        action: a.action,
        targetType: a.targetType,
        note: a.note,
        createdAt: a.createdAt,
        appeal: a.appeals[0]
          ? { id: a.appeals[0].id, status: a.appeals[0].status }
          : null,
      })),
    });
  })
);
