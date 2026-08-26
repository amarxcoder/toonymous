import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../lib/requireAuth";
import { requireRole } from "../lib/requireRole";

// Restricted legal/compliance workflow for CSAM/NSFW matches (F5.1, N6) -
// deliberately gated by its own role, separate from the general moderation
// queue in routes/moderation.ts. No image bytes are ever available here or
// anywhere else for a blocked upload (F1.3) - this is a log of the fact
// that a match occurred, not the content itself.
export const complianceRouter = Router();
complianceRouter.use(...requireRole("complianceOfficer"));

complianceRouter.get(
  "/flags",
  asyncHandler(async (req, res) => {
    const reviewed = req.query.reviewed === "true";
    const flags = await prisma.complianceFlag.findMany({
      where: reviewed ? { reviewedAt: { not: null } } : { reviewedAt: null },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    res.json({ flags });
  })
);

complianceRouter.post(
  "/flags/:id/review",
  asyncHandler(async (req: AuthedRequest, res) => {
    const flag = await prisma.complianceFlag.findUnique({ where: { id: req.params.id } });
    if (!flag) {
      res.status(404).json({ error: "not found" });
      return;
    }
    await prisma.complianceFlag.update({
      where: { id: flag.id },
      data: { reviewedAt: new Date(), reviewedBy: req.userId },
    });
    res.status(204).end();
  })
);
