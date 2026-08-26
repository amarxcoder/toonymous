import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/requireAuth";

export const followsRouter = Router();
followsRouter.use(requireAuth);

const handleSchema = z.object({ handle: z.string().min(1) });

// Follow by handle (F4.1) - a plain social-graph edge, never used to alter
// feed ordering (F3.2 still governs the feed; this only backs follower
// counts and a follow/unfollow button on post cards).
followsRouter.post(
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
      res.status(400).json({ error: "cannot follow your own handle" });
      return;
    }
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: req.userId!, followingId: target.id } },
      create: { followerId: req.userId!, followingId: target.id },
      update: {},
    });
    res.status(204).end();
  })
);

followsRouter.delete(
  "/:handle",
  asyncHandler(async (req: AuthedRequest, res) => {
    const target = await prisma.user.findUnique({ where: { handle: req.params.handle } });
    if (!target) {
      res.status(404).json({ error: "no account with that handle" });
      return;
    }
    await prisma.follow.deleteMany({ where: { followerId: req.userId, followingId: target.id } });
    res.status(204).end();
  })
);
