# Toonymous — Conventions & Tech Stack

Follows the workspace-wide conventions in the root [CLAUDE.md](../../CLAUDE.md) (no Docker, port
block system, deploy pipeline). This doc adds project-specific decisions.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React, TypeScript) | Matches the stack already used across this workspace (myrooots, trayvo, matri) — keeps conventions and mental model shared. |
| Backend API | Node.js + Express (or NestJS if the API grows complex enough to want structured modules) | Same rationale; start with Express for MVP simplicity, promote to NestJS only if warranted. |
| Primary database | PostgreSQL (local install, no Docker) | Workspace standard. Relational fits accounts/posts/comments/moderation records well. |
| Cache / queue backing | Redis (local install, no Docker) | Needed for the async cartoonization job queue (N3) and session/rate-limit state. |
| Job queue | BullMQ (Node, backed by Redis) | Standard choice for a Node stack; runs the cartoonization pipeline as background jobs per N3. |
| Object storage | Local disk in dev; S3-compatible bucket in production | Cartoonized images only — originals never persist (F1.3). No Docker needed either way. |
| Cartoonization engine | Swappable via `CARTOONIZE_PROVIDER` env var (`cartoonizer/src/providers/`): `sharp` (MVP default, image filter, zero installs), `onnx` (AnimeGANv2 `face_paint_512_v2`, CPU, in-process, used by the demo deploy), `gmic` (G'MIC CLI cartoon filter, no GPU, not face-only), `api` (passthrough to a local model server or third-party image-to-cartoon API). Per-post style presets (`anime`, `sketch`, `comic`) picked at post time map to fixed engines in `STYLES`; a request with no style uses `CARTOONIZE_PROVIDER`. | Evaluated Photo2Cartoon, ComfyUI+FLUX Kontext, Inkscape Trace Bitmap, StyleCariGAN/CariGAN, GIMP+G'MIC against the actual dev box: no GPU and RAM already under pressure ruled out ComfyUI+FLUX; Photo2Cartoon/StyleCariGAN are face-only GANs but posts here are arbitrary photos, not guaranteed portraits; G'MIC needs neither and is lightest, so it's the wired-but-unverified upgrade path. `api` keeps a real self-hosted model or hosted API a config change away once volume/budget is known — see [01-overview.md](01-overview.md)'s open decision. |
| Content safety scan | Third-party CSAM/NSFW detection API (e.g. a dedicated trust-and-safety vendor) | Building CSAM detection in-house is not appropriate — use an established vendor with proper legal/reporting integration (F5.1). |
| PII/identity text filter | Regex + a lightweight NER (named-entity-recognition) pass for names/addresses, plus pattern matching for phone/email/handles | Runs on every caption/comment before publish (F2.3). |
| Auth | Email/phone + password or OTP, short-lived JWT/session tokens with refresh | Per N1/F6.1. |

## No Docker

Per root [CLAUDE.md](../../CLAUDE.md): Postgres, Redis, and the Python cartoonization microservice
all run as natively-installed local services (system package manager or each tool's own
installer), not containers — in local dev and in production alike.

## Ports

Assigned block: **4000-4009** (next free block per the root CLAUDE.md port table at the time this
project was created).

| Port | Service |
|---|---|
| 4000 | Frontend (Next.js) |
| 4001 | Backend API |
| 4002 | Cartoonization inference microservice (internal only, not public-facing) |
| 4003-4009 | Reserved for future services (admin/moderation console, etc.) |

Root CLAUDE.md's port table and project list are updated alongside this file — see the diff there.

## Repo/folder conventions

```
toonymous/
  CLAUDE.md              # project index, links back to root CLAUDE.md
  specs/                 # this directory — product & design specs, source of truth pre-code
  frontend/              # Next.js app (once code starts)
  backend/               # Express/NestJS API (once code starts)
  cartoonizer/            # Python inference microservice (once code starts)
```

Actual code folders (`frontend/`, `backend/`, `cartoonizer/`) don't exist yet — created when
implementation starts, per the checklist in [06-checklist.md](06-checklist.md).

## Coding conventions

Inherit the root CLAUDE.md's behavioral guidelines (think before coding, simplicity first,
surgical changes, goal-driven execution) and this project's own
[CLAUDE.md](../CLAUDE.md) Karpathy-inspired addenda. Project-specific additions:

- **TypeScript strict mode** on both frontend and backend — anonymity/privacy bugs are exactly the
  class of bug that a missing null-check or loose type turns into a real incident.
- **No `any` for data that touches the image pipeline or the PII filter** — these are the two
  places a type error becomes a privacy leak.
- **Every new API endpoint that returns user-generated content must be reviewed against the
  anonymity pillars in [01-overview.md](01-overview.md)** before merge: does the response, even
  indirectly, leak location, real identity, or raw image data?
- **No em dashes in user-facing UI copy** (workspace-wide rule, root CLAUDE.md) — use a hyphen or
  rewrite the sentence.
- Environment config via `.env` (gitignored), one `.env.example` per service documenting required
  vars, never committed with real secrets.

## Deploy

Branch strategy: a `release` branch is the deploy trigger — any commit or merge into `release`
kicks off the deploy (Render/Vercel are configured in their dashboards to auto-deploy from
`release`, not `main`). Push feature work to `release` (or merge into it) to ship; don't push
straight to `main` to deploy.

A push to `release` also merges it back into `main` automatically, via
[.github/workflows/release-merge.yml](../.github/workflows/release-merge.yml). This fires right
after the push (it doesn't wait for Render/Vercel to confirm the deploy actually succeeded), so a
push to `release` should be treated as "about to deploy," not "confirmed live."

Follows the workspace's standard pipeline (root CLAUDE.md "Deploy pipeline" section): bare VPS, PM2
per process, nginx in front, no Docker, deploy scripts must source nvm before running node/npm.
Given the memory-constrained production box note in root CLAUDE.md, keep the Node services on the
lean side; the Python cartoonization microservice is the one component likely to need its own
resource-sized box or a GPU instance — plan that infra decision separately from the shared VPS once
real usage is known.

This is still the intended path to a real launch — the free-tier deploy below is a client-review
demo, not a replacement for it.

### Free-tier demo deploy (client review)

Live for client review, not production: frontend
[toonymous.vercel.app](https://toonymous.vercel.app), backend
`https://toonymous-backend.onrender.com`, cartoonizer `https://toonymous-cartoonizer.onrender.com`.
Config source of truth is `render.yaml` at the repo root (a Render Blueprint) plus each service's
env vars set directly in the Vercel/Render dashboards (not committed anywhere).

Providers: Vercel (frontend), Render (backend + cartoonizer, free Web Services), Supabase
(Postgres + object storage), Upstash (Redis). Chosen because they're free and don't require
Docker on our end — Render's own build/runtime containerizes internally, which is a deploy-target
detail we don't control, not a project convention change.

This setup needed several adaptations from the real deploy convention above, all gated so local
dev and a real VPS deploy are unaffected:

- **Backend API + BullMQ worker run combined in one process** (`npm run start:render` in
  `backend/package.json`) — Render's free plan has no free Background Worker tier, only Web
  Services.
- **Cartoonizer is its own public Render web service, not actually internal-only**, guarded by a
  `CARTOONIZER_SHARED_SECRET` header (`cartoonizer/src/index.ts`, sent by `backend/src/worker.ts`)
  — Render's free plan has no free Private Service tier either.
- **Cartoonizer's `onnx` provider is tuned to fit Render's 512MB free instance**: the
  onnxruntime session runs with graph optimization disabled, no CPU memory arena/pattern, and 1
  thread (`cartoonizer/src/providers/onnx.ts`), and the service env sets
  `MALLOC_MMAP_THRESHOLD_=1048576` (`render.yaml`, `ecosystem.config.js`). With default settings,
  inference peaked at 570-830MB RSS and climbed with every image, so the instance was OOM-killed
  mid-image and every upload failed. With both changes the peak is a flat ~410MB, and inference is
  ~10% slower. The env var must be set before the process starts, since glibc reads it at startup,
  so putting it in `.env` (loaded by dotenv at runtime) does nothing.
- **Cartoonized images are written to Supabase Storage**, not local disk
  (`backend/src/lib/storage.ts`'s `saveCartoon`, active whenever `SUPABASE_URL` /
  `SUPABASE_SERVICE_KEY` / `SUPABASE_BUCKET` are set) — Render's free web services have no
  persistent disk; it's wiped on every restart, which happens often since idle free services spin
  down after 15 minutes.
- **`DATABASE_URL` must use Supabase's session pooler** (the `*.pooler.supabase.com:5432` host,
  not the direct `db.*.supabase.co:5432` host) — the direct host is IPv6-only on Supabase's free
  tier and Render can't reach it. The transaction-mode pooler (port 6543) doesn't work either since
  it can't run Prisma migrations.
- **Refresh-token cookie is `sameSite: "none", secure: true`** (`backend/src/routes/auth.ts`) —
  frontend (Vercel) and backend (Render) are different domains, so a `lax` cookie would silently
  never be sent back on cross-site requests.
- **Render's build command is `npm install --include=dev && ...`** — `NODE_ENV=production` in the
  service env otherwise makes npm skip devDependencies, where `typescript`, `@types/*`, and the
  Prisma CLI live, breaking the build.
