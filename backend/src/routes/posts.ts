import fs from "node:fs/promises";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { z } from "zod";
import { asyncHandler } from "../lib/asyncHandler";
import { optionalAuth } from "../lib/optionalAuth";
import { scrubPii } from "../lib/piiFilter";
import { postCreateLimiter } from "../lib/rateLimit";
import { prisma } from "../lib/prisma";
import { cartoonizeQueue } from "../lib/queue";
import { AuthedRequest, requireAuth } from "../lib/requireAuth";
import { checkImageSafety } from "../lib/safetyCheck";
import { intakePath } from "../lib/storage";

export const postsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const captionSchema = z.string().max(280).optional();

type PostWithCounts = {
  id: string;
  caption: string | null;
  status: string;
  imageUrl: string | null;
  createdAt: Date;
  userId: string;
  user: { handle: string; avatarSeed: string };
  _count: { likes: number; comments: number };
};

// `viewerLikedIds`/`viewerFollowingIds` are small per-request sets (the
// handful of post ids on one feed page / the viewer's own follow list) -
// cheap to pass in rather than querying per post.
function postSummary(
  post: PostWithCounts,
  viewer?: { userId?: string; likedIds?: Set<string>; followingIds?: Set<string> }
) {
  return {
    id: post.id,
    caption: post.caption,
    status: post.status,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    handle: post.user.handle,
    avatarSeed: post.user.avatarSeed,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    liked: viewer?.likedIds?.has(post.id) ?? false,
    isOwnPost: viewer?.userId === post.userId,
    following: viewer?.userId ? (viewer.followingIds?.has(post.userId) ?? false) : false,
  };
}

const postInclude = {
  user: { select: { handle: true, avatarSeed: true } },
  _count: { select: { likes: true, comments: { where: { removedAt: null } } } },
} as const;

async function viewerContext(userId: string | undefined, posts: { id: string; userId: string }[]) {
  if (!userId || posts.length === 0) return { userId, likedIds: new Set<string>(), followingIds: new Set<string>() };
  const [likes, follows] = await Promise.all([
    prisma.like.findMany({ where: { userId, postId: { in: posts.map((p) => p.id) } }, select: { postId: true } }),
    prisma.follow.findMany({
      where: { followerId: userId, followingId: { in: posts.map((p) => p.userId) } },
      select: { followingId: true },
    }),
  ]);
  return {
    userId,
    likedIds: new Set(likes.map((l) => l.postId)),
    followingIds: new Set(follows.map((f) => f.followingId)),
  };
}

// Upload -> strip metadata -> safety pre-check (F1.4/F5.1) -> enqueue async
// cartoonization job (N3). The original never reaches permanent storage: on
// a safety-check block it is discarded without ever touching disk; on a
// pass it is written to the short-lived intake dir and deleted by the
// worker once cartoonization succeeds or fails terminally (F1.3).
postsRouter.post(
  "/",
  requireAuth,
  postCreateLimiter,
  upload.single("image"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const file = req.file;
    if (!file || !ALLOWED_MIME.has(file.mimetype)) {
      res.status(400).json({ error: "a jpeg, png, or webp image is required" });
      return;
    }

    const captionResult = captionSchema.safeParse(req.body.caption);
    if (!captionResult.success) {
      res.status(400).json({ error: "caption too long" });
      return;
    }
    const caption = captionResult.data ? scrubPii(captionResult.data) : null;

    // Re-encode strips all EXIF/embedded metadata (F1.2) — sharp does not
    // carry metadata forward unless withMetadata() is called.
    const stripped = await sharp(file.buffer).rotate().jpeg().toBuffer();
    const safety = await checkImageSafety(stripped);

    const post = await prisma.post.create({
      data: {
        userId: req.userId!,
        caption,
        status: safety.safe ? "pending" : "blocked",
        failureReason: safety.safe ? null : (safety.reason ?? "failed safety pre-check"),
      },
      include: postInclude,
    });

    if (!safety.safe) {
      // F5.1: a positive match is logged for the restricted compliance
      // workflow (see routes/compliance.ts) and never reaches the general
      // moderation queue (routes/moderation.ts only ever sees Reports).
      await prisma.complianceFlag.create({
        data: { postId: post.id, reason: safety.reason ?? "failed safety pre-check" },
      });
      res.status(201).json(postSummary(post, { userId: req.userId }));
      return;
    }

    await fs.writeFile(intakePath(post.id), stripped);
    await cartoonizeQueue.add("cartoonize", { postId: post.id });

    res.status(201).json(postSummary(post, { userId: req.userId }));
  })
);

postsRouter.get(
  "/feed",
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const tab = req.query.tab === "random" ? "random" : "chronological";
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    // Hide content from anyone the viewer has blocked (F4.1) and from
    // shadow-limited accounts (F5.4) - a soft moderation action that keeps a
    // post visible to its own author but out of the public feed.
    const blocked = req.userId
      ? await prisma.block.findMany({ where: { blockerId: req.userId }, select: { blockedId: true } })
      : [];
    const excludeAuthors = blocked.map((b) => b.blockedId);
    const baseWhere = {
      status: "ready" as const,
      user: { shadowLimited: false },
      ...(excludeAuthors.length ? { userId: { notIn: excludeAuthors } } : {}),
    };

    if (tab === "random") {
      const exclude = String(req.query.exclude ?? "")
        .split(",")
        .filter(Boolean);
      const posts = await prisma.post.findMany({
        where: { ...baseWhere, id: { notIn: exclude } },
        take: limit,
        orderBy: { id: "asc" }, // placeholder order, replaced below by raw random sample
        include: postInclude,
      });
      // Small-dataset MVP approach: shuffle in memory rather than SQL
      // RANDOM() at scale (revisit per N3 once post volume is real).
      for (let i = posts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posts[i], posts[j]] = [posts[j]!, posts[i]!];
      }
      const viewer = await viewerContext(req.userId, posts);
      res.json({ posts: posts.map((p) => postSummary(p, viewer)), nextCursor: null });
      return;
    }

    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const posts = await prisma.post.findMany({
      where: baseWhere,
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: postInclude,
    });
    const nextCursor = posts.length === limit ? posts[posts.length - 1]!.id : null;
    const viewer = await viewerContext(req.userId, posts);
    res.json({ posts: posts.map((p) => postSummary(p, viewer)), nextCursor });
  })
);

postsRouter.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: postInclude,
    });
    if (!post) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const viewer = await viewerContext(req.userId, [post]);
    res.json(postSummary(post, viewer));
  })
);

// Anonymous aggregate count only - who liked a post is never exposed to the
// post owner or anyone else (F4.2). Toggle: like if not liked, unlike if
// already liked.
postsRouter.post(
  "/:id/like",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post || post.status !== "ready") {
      res.status(404).json({ error: "not found" });
      return;
    }

    const existing = await prisma.like.findUnique({
      where: { postId_userId: { postId: post.id, userId: req.userId! } },
    });
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
    } else {
      await prisma.like.create({ data: { postId: post.id, userId: req.userId! } });
    }

    const likeCount = await prisma.like.count({ where: { postId: post.id } });
    res.json({ liked: !existing, likeCount });
  })
);
