import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/requireAuth";

export const blocksRouter = Router();
blocksRouter.use(requireAuth);

const handleSchema = z.object({ handle: z.string().min(1) });

// Mute/block is per-handle, never identity (F4.1) - hides the blocked
// handle's posts/comments from the blocker's feed. A blocked user can
// always make a new anonymous account; that's an accepted tradeoff of true
// anonymity (specs/02-features.md).
blocksRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.userId },
      include: { blocked: { select: { handle: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ handles: blocks.map((b) => b.blocked.handle) });
  })
);

blocksRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = handleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "a handle is required" });
      return;
    }
    const target = await prisma.user.findUnique({ where: { handle: parsed.data.handle } });
    if (!target) {
      res.status(404).json({ error: "no account with that handle" });
      return;
    }
    if (target.id === req.userId) {
      res.status(400).json({ error: "cannot block your own handle" });
      return;
    }
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: req.userId!, blockedId: target.id } },
      create: { blockerId: req.userId!, blockedId: target.id },
      update: {},
    });
    res.status(204).end();
  })
);

blocksRouter.delete(
  "/:handle",
  asyncHandler(async (req: AuthedRequest, res) => {
    const target = await prisma.user.findUnique({ where: { handle: req.params.handle } });
    if (!target) {
      res.status(404).json({ error: "no account with that handle" });
      return;
    }
    await prisma.block.deleteMany({ where: { blockerId: req.userId, blockedId: target.id } });
    res.status(204).end();
  })
);
