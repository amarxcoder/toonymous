import pino from "pino";

// Structured logging (N4) - pure-JS, no native deps, fine for the
// memory-constrained production box (root CLAUDE.md).
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
});
