import "dotenv/config";
import express from "express";
import { STYLES, getCartoonizeFn } from "./providers";

// Engine selection lives in providers/index.ts, picked at start via
// CARTOONIZE_PROVIDER. Every other service in the pipeline (worker, CDN
// serving, feed) is unaffected by which one is active.
const cartoonize = getCartoonizeFn();

const app = express();
const PORT = process.env.PORT ?? 4002;
// Internal only, never public-facing, on a real VPS deploy (nginx and this
// process share the same host). A container-based free host (e.g. Render)
// needs the process to bind all interfaces to be reachable at all, so that
// case overrides via HOST=0.0.0.0.
const HOST = process.env.HOST ?? "127.0.0.1";

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Set only on hosts where this can't stay off the public internet (e.g.
// Render free tier has no private-service option) — unset locally/on a VPS
// where nginx already keeps this unreachable from outside.
const SHARED_SECRET = process.env.CARTOONIZER_SHARED_SECRET;

app.post(
  "/cartoonize",
  (req, res, next) => {
    if (SHARED_SECRET && req.get("x-internal-secret") !== SHARED_SECRET) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    next();
  },
  express.raw({ type: "*/*", limit: "15mb" }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: "no image body" });
      return;
    }
    const style = req.query.style;
    const fn =
      style === undefined
        ? cartoonize
        : typeof style === "string" && Object.hasOwn(STYLES, style)
          ? STYLES[style]
          : undefined;
    if (!fn) {
      res.status(400).json({ error: "unknown style" });
      return;
    }
    try {
      const output = await fn(req.body);
      res.set("Content-Type", "image/jpeg");
      res.send(output);
    } catch (err) {
      console.error("cartoonize failed", err);
      res.status(422).json({ error: "could not process image" });
    }
  }
);

app.listen(Number(PORT), HOST, () => {
  console.log(`toonymous cartoonizer listening on http://${HOST}:${PORT}`);
});
