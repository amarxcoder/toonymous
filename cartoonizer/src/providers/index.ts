import { apiCartoonize } from "./api";
import { gmicCartoonize } from "./gmic";
import { onnxCartoonize } from "./onnx";
import { sharpCartoonize } from "./sharpFilter";
import { sketchCartoonize } from "./sketch";

export type CartoonizeFn = (input: Buffer) => Promise<Buffer>;

const PROVIDERS: Record<string, CartoonizeFn> = {
  sharp: sharpCartoonize,
  gmic: gmicCartoonize,
  api: apiCartoonize,
  onnx: onnxCartoonize,
};

// CARTOONIZE_PROVIDER picks the engine at process start — swap models
// (local CLI tool, local LLM server, hosted API) with an env change, no
// code change. Defaults to "sharp": zero extra installs, works everywhere.
export function getCartoonizeFn(): CartoonizeFn {
  const name = process.env.CARTOONIZE_PROVIDER ?? "sharp";
  const fn = PROVIDERS[name];
  if (!fn) {
    throw new Error(
      `Unknown CARTOONIZE_PROVIDER "${name}" — expected one of: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }
  return fn;
}

// Per-post style presets the user picks at post time (specs/02-features.md).
// Keys must match CARTOON_STYLES in backend/src/lib/queue.ts. A request with
// no style falls back to the CARTOONIZE_PROVIDER engine above.
export const STYLES: Record<string, CartoonizeFn> = {
  anime: onnxCartoonize,
  sketch: sketchCartoonize,
  comic: sharpCartoonize,
};
