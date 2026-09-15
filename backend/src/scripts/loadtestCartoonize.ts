import sharp from "sharp";
import { cartoonizeQueue } from "../lib/queue";

// N3 local load test: fires N concurrent posts at the running backend and
// watches the cartoonize queue drain. Not a substitute for a real load-testing
// tool against a deployed environment, but enough to sanity-check the one
// component most likely to bottleneck (the async cartoonize path) without any
// extra infra. Run with: `npx ts-node src/scripts/loadtestCartoonize.ts [count]`
// against a running `npm run dev` + `npm run worker` + cartoonizer.

const BACKEND = process.env.BACKEND_ORIGIN ?? "http://localhost:4001";
const COUNT = Number(process.argv[2] ?? 30);

async function makeTestUser(): Promise<string> {
  const email = `loadtest-${Date.now()}@example.com`;
  const res = await fetch(`${BACKEND}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "loadtest-password" }),
  });
  if (!res.ok) throw new Error(`signup failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { accessToken: string };
  return body.accessToken;
}

async function makeTestImage(seed: number): Promise<Buffer> {
  return sharp({
    create: {
      width: 200,
      height: 200,
      channels: 3,
      background: { r: seed % 255, g: (seed * 7) % 255, b: (seed * 13) % 255 },
    },
  })
    .jpeg()
    .toBuffer();
}

async function createPost(accessToken: string, image: Buffer): Promise<number> {
  const form = new FormData();
  form.append("image", new Blob([new Uint8Array(image)], { type: "image/jpeg" }), "test.jpg");
  const res = await fetch(`${BACKEND}/posts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  return res.status;
}

async function main() {
  console.log(`load test: ${COUNT} posts against ${BACKEND}`);
  const accessToken = await makeTestUser();

  const started = Date.now();
  const statuses = await Promise.all(
    Array.from({ length: COUNT }, async (_, i) => {
      const image = await makeTestImage(i);
      return createPost(accessToken, image);
    })
  );
  const enqueueMs = Date.now() - started;

  const okCount = statuses.filter((s) => s === 201).length;
  console.log(`enqueued ${okCount}/${COUNT} posts in ${enqueueMs}ms`);
  if (okCount < COUNT) {
    console.log("non-201 statuses:", statuses.filter((s) => s !== 201));
  }

  const drainStart = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const counts = await cartoonizeQueue.getJobCounts("waiting", "active", "completed", "failed");
    console.log(
      `+${Date.now() - drainStart}ms queue depth:`,
      `waiting=${counts.waiting} active=${counts.active}`,
      `completed=${counts.completed} failed=${counts.failed}`
    );
    if (counts.waiting === 0 && counts.active === 0) break;
    if (Date.now() - drainStart > 60_000) {
      console.log("timed out waiting for queue to drain");
      break;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(`queue drained in ${Date.now() - drainStart}ms`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
