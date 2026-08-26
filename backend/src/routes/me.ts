import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { generateHandle } from "../lib/handle";
import { prisma } from "../lib/prisma";
import { AuthedRequest, requireAuth } from "../lib/requireAuth";

export const meRouter = Router();
const MAX_HANDLE_REROLLS = 3;

meRouter.use(requireAuth);

// A still-valid access token for a since-deleted account is an expected
// case (token TTL outlives the delete), not a server error - respond 401
// like any other invalid-session case rather than throwing.
async function requireUser(userId: string | undefined) {
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  return user;
}

// Only ever returns handle/avatar/createdAt - never email (F6.1: credential
// is never exposed via any API to non-owners, including this self endpoint's
// shape, which the rest of the API reuses for public profile responses).
meRouter.get(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const user = await requireUser(req.userId);
    if (!user) {
      res.status(401).json({ error: "account no longer exists" });
      return;
    }
    const followerCount = await prisma.follow.count({ where: { followingId: user.id } });
    res.json({
      handle: user.handle,
      avatarSeed: user.avatarSeed,
      handleRerollsRemaining: MAX_HANDLE_REROLLS - user.handleRerolls,
      createdAt: user.createdAt,
      // Only ever this account's own role - never returned for anyone else.
      role: user.role,
      followerCount,
    });
  })
);

meRouter.post(
  "/handle/reroll",
  asyncHandler<AuthedRequest>(async (req, res) => {
    const user = await requireUser(req.userId);
    if (!user) {
      res.status(401).json({ error: "account no longer exists" });
      return;
    }
    if (user.handleRerolls >= MAX_HANDLE_REROLLS) {
      res.status(429).json({ error: "handle reroll limit reached" });
      return;
    }

    let handle = generateHandle();
    for (let attempt = 0; attempt < 5; attempt++) {
      const taken = await prisma.user.findUnique({ where: { handle } });
      if (!taken) break;
      handle = generateHandle();
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { handle, avatarSeed: handle, handleRerolls: { increment: 1 } },
    });
    res.json({
      handle: updated.handle,
      handleRerollsRemaining: MAX_HANDLE_REROLLS - updated.handleRerolls,
    });
  })
);

// Hard delete, per F6.2 - no soft-delete/tombstone row left behind.
meRouter.delete(
  "/",
  asyncHandler<AuthedRequest>(async (req, res) => {
    await prisma.user.deleteMany({ where: { id: req.userId } });
    res.status(204).end();
  })
);
