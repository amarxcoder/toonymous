// F5.1/N6 placeholder. Real CSAM/NSFW detection MUST come from a dedicated
// third-party trust-and-safety vendor (specs/04-conventions.md) — building
// that in-house is not appropriate and this stub is not a compliance
// control. It exists only so the pipeline's shape (safety check runs before
// cartoonization, on every image, no bypass) is real and testable now.
// Do not ship to production without wiring a real vendor call in here.
export interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
}

export async function checkImageSafety(_image: Buffer): Promise<SafetyCheckResult> {
  console.warn(
    "[safetyCheck] using MVP stub (always safe) — replace with a real CSAM/NSFW vendor before production"
  );
  return { safe: true };
}
