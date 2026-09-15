import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// F1.3: `intakeDir` is the *only* place an original upload ever touches disk,
// and every caller that writes here is responsible for deleting the file on
// both the success and failure path — see worker.ts. `cartoonDir` holds only
// cartoonized output and is served statically as the local dev stand-in for
// an object-storage-backed CDN (specs/04-conventions.md).
export const intakeDir = path.join(__dirname, "..", "..", "intake");
export const cartoonDir = path.join(__dirname, "..", "..", "storage", "cartoons");

fs.mkdirSync(intakeDir, { recursive: true });
fs.mkdirSync(cartoonDir, { recursive: true });

export function intakePath(postId: string): string {
  return path.join(intakeDir, `${postId}.jpg`);
}

export function cartoonPath(postId: string): string {
  return path.join(cartoonDir, `${postId}.jpg`);
}

export function deleteIfExists(filePath: string): void {
  fs.rm(filePath, { force: true }, (err) => {
    if (err) console.error(`failed to delete ${filePath}`, err);
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

// Hosts without a persistent disk (e.g. Render's free tier) set the
// SUPABASE_* env vars so cartoonized output survives a restart; everywhere
// else (dev, a real VPS per specs/04-conventions.md) keeps writing to local
// disk exactly as before.
export async function saveCartoon(postId: string, buffer: Buffer): Promise<string> {
  if (supabase && SUPABASE_BUCKET) {
    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(`${postId}.jpg`, buffer, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    return supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(`${postId}.jpg`).data.publicUrl;
  }

  fs.writeFileSync(cartoonPath(postId), buffer);
  return `${process.env.BACKEND_ORIGIN ?? "http://localhost:4001"}/cdn/${postId}.jpg`;
}
