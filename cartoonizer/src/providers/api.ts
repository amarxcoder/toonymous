// Generic passthrough to an external image-to-cartoon service — a local
// model server (e.g. a self-hosted Photo2Cartoon/AnimeGAN/FLUX endpoint) or
// a third-party API. Request/response shape is a guess (multipart "image"
// in, raw image bytes out) since no real provider is chosen yet; adjust
// this file to match whichever one is picked, without touching index.ts or
// the job worker that calls it.
export async function apiCartoonize(input: Buffer): Promise<Buffer> {
  const url = process.env.CARTOONIZE_API_URL;
  if (!url) {
    throw new Error("CARTOONIZE_API_URL not set — required for CARTOONIZE_PROVIDER=api");
  }

  const form = new FormData();
  form.append("image", new Blob([input]), "input.jpg");

  const apiKey = process.env.CARTOONIZE_API_KEY;
  const res = await fetch(url, {
    method: "POST",
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    throw new Error(`cartoonize API request failed: ${res.status} ${await res.text()}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
