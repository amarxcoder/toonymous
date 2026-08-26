import sharp from "sharp";

// Lightweight image-processing filter (smooth + saturate + edge-line
// overlay), not a trained model. Zero extra installs, works on any host —
// the safe default. Swap CARTOONIZE_PROVIDER to something else for real
// cartoon/caricature quality; see providers/index.ts.
const MAX_DIMENSION = 1024;

export async function sharpCartoonize(input: Buffer): Promise<Buffer> {
  const base = sharp(input).rotate().resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });

  const baseBuffer = await base
    .clone()
    .median(7)
    .modulate({ saturation: 1.6, brightness: 1.03 })
    .jpeg()
    .toBuffer();

  // Chaining threshold()/negate() directly onto convolve() in one pipeline
  // mishandles convolve's unclamped intermediate values (background pixels
  // come out as edges and vice versa) — materialize a clamped uchar buffer
  // first, then run threshold/negate as a separate pipeline.
  const convolved = await base
    .clone()
    .greyscale()
    .convolve({ width: 3, height: 3, kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const edgesBuffer = await sharp(convolved.data, { raw: convolved.info })
    .threshold(35)
    .negate()
    .png()
    .toBuffer();

  return sharp(baseBuffer)
    .composite([{ input: edgesBuffer, blend: "multiply" }])
    .jpeg({ quality: 85 })
    .toBuffer();
}
