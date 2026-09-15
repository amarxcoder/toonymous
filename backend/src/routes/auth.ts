import bcrypt from "bcrypt";
import { Response, Router } from "express";
import { z } from "zod";
import {
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
  signAccessToken,
} from "../lib/auth";
import { asyncHandler } from "../lib/asyncHandler";
import { generateHandle } from "../lib/handle";
import { prisma } from "../lib/prisma";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const REFRESH_COOKIE = "refresh_token";
// sameSite: "none" + secure: true (browsers reject None without Secure) so
// this cookie still gets sent when the frontend and backend are on
// different domains, e.g. a Vercel-hosted frontend calling a Render-hosted
// backend for the free-tier demo deploy.
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  maxAge: REFRESH_TOKEN_TTL_MS,
  path: "/auth",
};

async function issueSession(userId: string, res: Response) {
  const accessToken = signAccessToken(userId);
  const { token, tokenHash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
  res.cookie(REFRESH_COOKIE, token, REFRESH_COOKIE_OPTS);
  return accessToken;
}

authRouter.post("/signup", asyncHandler(async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid email or password (min 8 chars)" });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "an account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Handles are system-generated only (F2.2) - retry on the rare collision.
  let handle = generateHandle();
  for (let attempt = 0; attempt < 5; attempt++) {
    const taken = await prisma.user.findUnique({ where: { handle } });
    if (!taken) break;
    handle = generateHandle();
  }

  const user = await prisma.user.create({
    data: { email, passwordHash, handle, avatarSeed: handle },
  });

  const accessToken = await issueSession(user.id, res);
  res.status(201).json({ accessToken, handle: user.handle });
}));

authRouter.post("/login", asyncHandler(async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid email or password" });
    return;
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "invalid email or password" });
    return;
  }
  if (user.bannedAt) {
    res.status(403).json({ error: "this account has been banned" });
    return;
  }

  const accessToken = await issueSession(user.id, res);
  res.json({ accessToken, handle: user.handle });
}));

authRouter.post("/refresh", asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    res.status(401).json({ error: "missing refresh token" });
    return;
  }
  const tokenHash = hashRefreshToken(token);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.expiresAt < new Date()) {
    res.status(401).json({ error: "invalid or expired refresh token" });
    return;
  }

  // A ban revokes future sessions even if this refresh token hasn't expired
  // yet (F5.4) - an already-issued 15m access token can still work until it
  // expires, an accepted tradeoff of stateless access tokens.
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || user.bannedAt) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    res.status(403).json({ error: "this account has been banned" });
    return;
  }

  // Rotate: delete the used refresh token, issue a new pair.
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const accessToken = await issueSession(stored.userId, res);
  res.json({ accessToken });
}));

authRouter.post("/logout", asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { tokenHash: hashRefreshToken(token) } });
  }
  res.clearCookie(REFRESH_COOKIE, { path: "/auth" });
  res.status(204).end();
}));
