import "dotenv/config";
import express from "express";
import { getCartoonizeFn } from "./providers";

// Engine selection lives in providers/index.ts, picked at start via
// CARTOONIZE_PROVIDER. Every other service in the pipeline (worker, CDN
// serving, feed) is unaffected by which one is active.
const cartoonize = getCartoonizeFn();

const app = express();
const PORT = process.env.PORT ?? 3082;
const HOST = "127.0.0.1"; // internal only, never public-facing

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post(
  "/cartoonize",
  express.raw({ type: "*/*", limit: "15mb" }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: "no image body" });
      return;
    }
    try {
      const output = await cartoonize(req.body);
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
