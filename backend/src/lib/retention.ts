import fs from "node:fs/promises";
import cron from "node-cron";
import { logger } from "./logger";
import { intakeDir } from "./storage";

const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

// N2 original-image purge safety net. Normal path deletes an intake file in
// worker.ts's `finally` block; this only ever catches a leftover from a crash
// mid-job. Runs hourly - cheap enough locally, no need for anything fancier.
export async function sweepStaleIntakeFiles(): Promise<number> {
  const entries = await fs.readdir(intakeDir);
  const now = Date.now();
  let removed = 0;

  for (const name of entries) {
    const filePath = `${intakeDir}/${name}`;
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat && now - stat.mtimeMs > MAX_AGE_MS) {
      await fs.rm(filePath, { force: true });
      removed++;
    }
  }

  if (removed > 0) {
    logger.warn({ removed }, "retention sweep removed stale intake files");
  }
  return removed;
}

export function startRetentionJob(): void {
  cron.schedule("0 * * * *", () => {
    sweepStaleIntakeFiles().catch((err) => logger.error({ err }, "retention sweep failed"));
  });
}
