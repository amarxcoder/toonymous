import { NextFunction, Response } from "express";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redisConnection } from "./queue";
import { AuthedRequest } from "./requireAuth";

// F5.3: rate limiting on posts/comments/reports/account creation, keyed by
// IP (no device-fingerprinting infra exists yet - IP is the MVP stand-in;
// revisit with a real fingerprint signal in Phase 5+). Redis-backed so it
// holds across process restarts and multiple API instances (N3).
function ipLimiter(opts: { points: number; duration: number; keyPrefix: string }) {
  const limiter = new RateLimiterRedis({
    storeClient: redisConnection,
    points: opts.points,
    duration: opts.duration,
    keyPrefix: opts.keyPrefix,
  });
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      await limiter.consume(req.ip ?? "unknown");
      next();
    } catch {
      res.status(429).json({ error: "too many requests, slow down" });
    }
  };
}

export const postCreateLimiter = ipLimiter({ points: 10, duration: 60, keyPrefix: "rl:post" });
export const commentCreateLimiter = ipLimiter({ points: 20, duration: 60, keyPrefix: "rl:comment" });
export const reportCreateLimiter = ipLimiter({ points: 10, duration: 60, keyPrefix: "rl:report" });
export const signupLimiter = ipLimiter({ points: 5, duration: 3600, keyPrefix: "rl:signup" });
