import fs from "node:fs";
import path from "node:path";

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
