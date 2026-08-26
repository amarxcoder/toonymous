import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./auth";

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "missing access token" });
    return;
  }
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "invalid or expired access token" });
  }
}
