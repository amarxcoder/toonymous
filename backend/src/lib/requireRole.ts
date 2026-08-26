import { Response } from "express";
import { $Enums } from "@prisma/client";
import { asyncHandler } from "./asyncHandler";
import { prisma } from "./prisma";
import { AuthedRequest, requireAuth } from "./requireAuth";

// Gates the internal moderation/compliance tools. Chain after requireAuth's
// job of proving *who* the caller is; this proves they hold the role the
// route needs. There is no self-service way to acquire a role - it is set
// directly in the DB (see scripts/setRole.ts).
export function requireRole(role: $Enums.UserRole) {
  return [
    requireAuth,
    asyncHandler<AuthedRequest>(async (req: AuthedRequest, res: Response, next) => {
      const user = await prisma.user.findUnique({ where: { id: req.userId } });
      if (!user || user.role !== role) {
        res.status(403).json({ error: "forbidden" });
        return;
      }
      next();
    }),
  ];
}
