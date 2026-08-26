import { NextFunction, Response } from "express";
import { verifyAccessToken } from "./auth";
import { AuthedRequest } from "./requireAuth";

// Like requireAuth, but a missing/invalid token is not an error - used on
// public routes (feed, post detail) that personalize slightly for a logged
// in viewer (their own like/follow state, their block list) without
// requiring a session.
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.userId = verifyAccessToken(header.slice("Bearer ".length)).userId;
    } catch {
      // ignore - treat as anonymous
    }
  }
  next();
}
