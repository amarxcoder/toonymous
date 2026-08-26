import crypto from "crypto";

// Abstract generated avatar only (checklist Phase 1) - never a raw photo
// upload. Deterministic from a seed so the same seed always renders the same
// avatar, generated on the fly (nothing stored).

function seedToUint32(seed: string): number {
  const hash = crypto.createHash("sha256").update(seed).digest();
  return hash.readUInt32BE(0);
}

function mulberry32(a: number) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Palette drawn from the style guide's accent tokens (05-ui-styleguide.md).
const PALETTE = ["#7C5CFC", "#16A34A", "#D97706", "#DC2626", "#0EA5E9", "#DB2777"];

export function generateAvatarSvg(seed: string): string {
  const rand = mulberry32(seedToUint32(seed));
  const bg = PALETTE[Math.floor(rand() * PALETTE.length)];
  const shapes: string[] = [];
  const shapeCount = 3 + Math.floor(rand() * 3);

  for (let i = 0; i < shapeCount; i++) {
    const cx = Math.round(rand() * 64);
    const cy = Math.round(rand() * 64);
    const r = Math.round(6 + rand() * 14);
    const opacity = (0.25 + rand() * 0.5).toFixed(2);
    shapes.push(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" opacity="${opacity}" />`
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="32" fill="${bg}" />
  ${shapes.join("\n  ")}
</svg>`;
}
