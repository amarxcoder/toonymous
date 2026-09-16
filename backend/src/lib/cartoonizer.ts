// Shared by the upload route (which wakes the service) and the worker (which
// calls it). Internal-only service, see specs/04-conventions.md.
export const CARTOONIZER_URL = process.env.CARTOONIZER_URL ?? "http://127.0.0.1:4002";

export function cartoonizerHeaders(): Record<string, string> {
  const secret = process.env.CARTOONIZER_SHARED_SECRET;
  return secret ? { "x-internal-secret": secret } : {};
}

// Free-tier hosts spin the cartoonizer down after a few minutes idle and a
// cold start costs ~15s, which is long enough for the job to arrive while it
// is still booting. Pinging /health the moment an upload lands lets it wake
// up in parallel with the rest of the upload, so the job usually finds it
// ready. Fire and forget: if the ping fails the job's retries still cover it.
export function warmCartoonizer(): void {
  fetch(`${CARTOONIZER_URL}/health`).catch(() => {});
}
