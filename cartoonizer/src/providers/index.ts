import { apiCartoonize } from "./api";
import { gmicCartoonize } from "./gmic";
import { sharpCartoonize } from "./sharpFilter";

export type CartoonizeFn = (input: Buffer) => Promise<Buffer>;

const PROVIDERS: Record<string, CartoonizeFn> = {
  sharp: sharpCartoonize,
  gmic: gmicCartoonize,
  api: apiCartoonize,
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
