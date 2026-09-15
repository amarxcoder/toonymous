import path from "node:path";
import * as ort from "onnxruntime-node";
import sharp from "sharp";

// AnimeGANv2 "face_paint_512_v2" (bryandlee/animegan2-pytorch, MIT), exported
// to ONNX, run on CPU in-process. A real trained model, no GPU, no third-party
// API (the photo never leaves this service), works on arbitrary photos, not
// only faces. Known quirk: open-mouth smiles can come out with dark teeth.
// Committed to the repo (8.6MB) so deploys don't depend on a download.
const MODEL_PATH = path.join(__dirname, "..", "..", "models", "face_paint_512_v2.onnx");
// The model's input is fixed at 512x512.
const SIZE = 512;
const MAX_DIMENSION = 1024;

// Created on first use and reused. These options trade ~10% speed for memory
// so it fits a 512MB free-tier host: default settings peaked over 700MB RSS
// per image. They only hold the peak down together with the
// MALLOC_MMAP_THRESHOLD_=1048576 env var (render.yaml, ecosystem.config.js);
// without it glibc keeps freed buffers and the peak climbs with every image.
let session: Promise<ort.InferenceSession> | undefined;
function getSession(): Promise<ort.InferenceSession> {
  session ??= ort.InferenceSession.create(MODEL_PATH, {
    enableCpuMemArena: false,
    enableMemPattern: false,
    intraOpNumThreads: 1,
    graphOptimizationLevel: "disabled",
  });
  return session;
}

export async function onnxCartoonize(input: Buffer): Promise<Buffer> {
  const model = await getSession();

  const { info } = await sharp(input).rotate().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // Letterbox onto a white 512 square (no cropping), run the model, then cut
  // the padding back off so the output keeps the original aspect ratio.
  const scale = SIZE / Math.max(width, height);
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const left = Math.floor((SIZE - w) / 2);
  const top = Math.floor((SIZE - h) / 2);

  const pixels = await sharp(input)
    .rotate()
    .removeAlpha()
    .resize(w, h)
    .extend({ top, bottom: SIZE - h - top, left, right: SIZE - w - left, background: "#ffffff" })
    .raw()
    .toBuffer();

  // Interleaved RGB bytes (HWC) -> planar floats in [-1, 1] (NCHW), and back.
  const n = SIZE * SIZE;
  const tensor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) tensor[c * n + i] = pixels[i * 3 + c]! / 127.5 - 1;
  }

  const results = await model.run({
    [model.inputNames[0]!]: new ort.Tensor("float32", tensor, [1, 3, SIZE, SIZE]),
  });
  const result = results[model.outputNames[0]!]!.data as Float32Array;

  const out = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < 3; c++) {
      out[i * 3 + c] = Math.max(0, Math.min(255, Math.round((result[c * n + i]! + 1) * 127.5)));
    }
  }

  const outScale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  return sharp(out, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .extract({ left, top, width: w, height: h })
    .resize(Math.round(width * outScale), Math.round(height * outScale))
    .jpeg({ quality: 88 })
    .toBuffer();
}
