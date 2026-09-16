import sharp from "sharp";

// Pencil-sketch filter: greyscale, then colour-dodge a blurred negative back
// over it so flat areas wash out to paper-white and only edges keep their
// strokes. Pure image filter like sharpFilter.ts, no model, no extra memory.
// Reads well on both portraits and scenes.
const MAX_DIMENSION = 1024;

export async function sketchCartoonize(input: Buffer): Promise<Buffer> {
  const grey = sharp(input)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .greyscale();

  const base = await grey.clone().png().toBuffer();
  const blurredNegative = await grey.clone().negate().blur(12).png().toBuffer();

  return sharp(base)
    .composite([{ input: blurredNegative, blend: "colour-dodge" }])
    .jpeg({ quality: 88 })
    .toBuffer();
}
