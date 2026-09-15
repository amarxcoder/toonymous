# Toonymous — Build Checklist

Status legend: ❌ Pending · ⚠️ Partial · ✅ Done. Update this file as work lands (mirrors the
convention used in matri's `REFERENCE/updated-checklist.md`).

## Phase 0 — Foundation

- ✅ Confirm final app name (or keep Toonymous) and register domain — name kept as Toonymous;
  domain registration still open
- ✅ Init `frontend/` (Next.js + TypeScript), `backend/` (Express + TypeScript), `cartoonizer/`
  (placeholder, code lands in Phase 2) per [04-conventions.md](04-conventions.md)
- ✅ Local Postgres install (no Docker) + initial schema migration tool chosen (Prisma) — db
  `toonymous` on the existing local cluster (port 5433), `toonymous_user` role, `prisma migrate
  dev` applied
- ✅ Local Redis install (no Docker) for queue + rate limiting — already running natively
  (port 6379); not yet consumed by any code (queue work starts Phase 2, rate limiting Phase 5)
- ✅ `.env.example` per service, secrets management convention documented — `backend/.env.example`,
  `frontend/.env.example`, real `.env`s gitignored
- ⚠️ CI baseline: lint, type-check, test run on push — `tsc --noEmit` passes on both services
  locally; no CI workflow file or test suite exists yet

## Phase 1 — Accounts & anonymity core

- ✅ Signup/login (email + password), short-lived JWT (15m) + rotating refresh token (30d, httpOnly
  cookie, DB-backed for revocation) (F6.1)
- ✅ System-generated handle assignment (adjective-noun-number, collision-checked) + limited reroll
  (3 max) (F2.2)
- ✅ Account deletion → hard-delete via `DELETE /me`, cascades refresh tokens (F6.2, N2)
- ✅ Abstract/generated default avatar — deterministic SVG generated from a handle-derived seed,
  no raw photo upload path exists (F2.1 adjacent)
- ✅ Data model review: `User`/`RefreshToken` Prisma schema reviewed — no real name, location, or
  contact info field beyond the login-only `email` (F2.1)

## Phase 2 — Image pipeline (core mechanic)

- ✅ Upload endpoint → short-lived intake store (F1.3) — `POST /posts` (multer, 8MB limit,
  jpeg/png/webp only), writes to `backend/intake/`, not encrypted at rest yet (local dev only —
  N1's "encryption at rest" still open, see Phase 7/N1 follow-up)
- ✅ EXIF/metadata strip step (F1.2) — sharp re-encode on upload before anything is written to disk
- ⚠️ Safety pre-check (F5.1) — pipeline wired (runs before cartoonization, blocks on failure, never
  enqueues a blocked image), but `backend/src/lib/safetyCheck.ts` is an MVP stub that always
  returns safe; **must be replaced with a real CSAM/NSFW vendor before any real user upload**, not
  just before public launch
- ✅ Cartoonization microservice (`cartoonizer/`, port 4002) + BullMQ job wiring (async, per N3) —
  MVP defaults to a lightweight sharp-based smooth+saturate+edge-outline filter, not a trained GAN
  model. Engine is swappable via `CARTOONIZE_PROVIDER` (`cartoonizer/src/providers/`): `sharp`
  (default), `onnx` (AnimeGANv2 `face_paint_512_v2` on CPU via `onnxruntime-node`, used by the
  demo deploy and PM2 config; hosted "free" AI image APIs checked Sept 2026 and none had a usable
  free tier), `gmic` (G'MIC CLI cartoon filter — no GPU, works on arbitrary photos, not face-only;
  not installed on this box, unverified), `api` (passthrough to a local model server or hosted API,
  for a future local LLM/vision API swap). Photo2Cartoon/StyleCariGAN ruled out as the default:
  face-only GANs, and posts here aren't guaranteed portraits. ComfyUI+FLUX Kontext ruled out: no GPU
  on this box and it's already RAM-constrained.
- ✅ Original image guaranteed-deletion step (F1.3) — worker deletes the intake file in a `finally`
  block on both success and failure; safety-check-blocked images never touch disk at all
- ✅ Cartoonized output → local disk → served at `/cdn/:id.jpg` (dev stand-in for S3 + real CDN per
  [04-conventions.md](04-conventions.md))
- ✅ Client polling for "your post is ready" — compose page polls `GET /posts/:id` every 1.5s

## Phase 3 — Feed & posting

- ✅ Global feed API — `GET /posts/feed`, no region/partition field anywhere (F3.1)
- ✅ Chronological (cursor-based keyset pagination, N3) + randomized-global (in-memory shuffle,
  MVP-scale only — swap for a real sampling strategy before the dataset is large, per N3) tabs
  (F3.2)
- ✅ Post composer — `/compose`, image + optional caption, shows pipeline status live
- ✅ PII/identity text filter wired into caption publish path (F2.3) — regex-based
  (`backend/src/lib/piiFilter.ts`): emails, URLs, @handles, phone numbers redacted before save
- ✅ Post card UI (`/feed`) per [05-ui-styleguide.md](05-ui-styleguide.md) — handle + avatar +
  relative time only, no location/identity line

## Phase 4 — Engagement

- ✅ Like/react (anonymous aggregate count only) (F4.2) — `POST /posts/:id/like` toggle; reactor
  identity never exposed, only the aggregate count
- ✅ Comments (text-only at MVP, scrubbed by PII filter) — `backend/src/routes/comments.ts`,
  cursor-paginated, no comment-image uploads
- ✅ Report post/comment → moderation queue entry (F5.2) — `POST /reports`, rate limited
- ✅ Mute/block by handle (F4.1) — `backend/src/routes/blocks.ts`; blocked handles' posts/comments
  filtered out of the blocker's feed and comment threads
- ✅ Follow by handle (confirmed with user before building) — `backend/src/routes/follows.ts`;
  purely a social-graph edge (follower counts, a follow button), never used to alter feed
  order/ranking (F3.2 unaffected)

## Phase 5 — Trust & safety / moderation

- ✅ Moderation queue UI (internal tool) for reported content, no reviewer-facing identity (F5.2) —
  `/admin/moderation` (frontend, role-gated) + `backend/src/routes/moderation.ts`; shows only
  already-public anonymous handles, never email/real identity
- ✅ Rate limiting on posts/comments/reports/account creation by device-fingerprint/IP (F5.3) —
  `backend/src/lib/rateLimit.ts`, Redis-backed (`rate-limiter-flexible`); keyed on IP only, no real
  device-fingerprint signal exists yet — revisit before this needs to withstand real abuse
- ✅ Shadow-limit / ban tooling keyed to account + device signals (F5.4) — moderator resolves a
  report with `shadow_limit` (hides future feed visibility) or `ban` (blocks login, revokes
  refresh tokens); both key off `User.id`, never an identity signal
- ✅ Compliance reporting hook for CSAM matches routed to restricted workflow (F5.1, N6) — a safety
  pre-check failure logs a `ComplianceFlag` row, reviewable only via `/admin/compliance` (its own
  `complianceOfficer` role, deliberately separate from the general moderation queue); no image
  content is ever stored for a blocked upload (F1.3 unaffected)
- ✅ Report/appeal path for moderation actions (N6) — `POST /appeals` (only the affected
  account/content owner may file one) → `/admin/moderation` appeals tab → approving reverses the
  original action and logs a `reverse` ModerationAction; verified end to end (report → shadow-limit
  → appeal → approve → post reappears in feed)

## Phase 6 — UI polish & accessibility

- ✅ Full theming (light + dark) per [05-ui-styleguide.md](05-ui-styleguide.md) color tokens — was
  already wired via `prefers-color-scheme` in `frontend/src/app/globals.css`; confirmed complete,
  no further work needed
- ✅ Responsive layout: mobile bottom nav, desktop left rail — `frontend/src/components/Nav.tsx`
  (4 destinations only, per spec: Feed / Post / Notifications / Profile — "Notifications" points at
  the existing `/appeals` page, there's no separate notifications feature), mounted app-wide via
  `frontend/src/components/AppShell.tsx` for logged-in sessions only
- ✅ WCAG 2.1 AA pass: contrast, keyboard nav, focus states, ARIA labels, alt text (N5) —
  focus-visible ring and reduced-motion were already in place; **found and fixed a real contrast
  failure**: `--accent-primary` as small text on white was 4.38:1 (below the 4.5:1 AA floor for
  normal text), computed via a manual luminance check against every text/background token pair in
  the styleguide; added a `--accent-primary-text` token (darker shade in light theme, same shade in
  dark theme where it already passed) and swapped every text-colored use of the accent (Follow
  button, active Like state, nav active state, auth page links) onto it; all raw `window.alert` /
  `window.confirm` / `window.prompt` calls replaced with the styleguide's required "inline, calm,
  actionable" feedback (new `ToastContext` + inline confirm/reason forms in `PostCard.tsx` and
  `/appeals`)
- ✅ `prefers-reduced-motion` support — already implemented in `globals.css`, confirmed complete
- ✅ i18n string externalization even for single-locale launch (F7.2) — `frontend/src/lib/strings.ts`,
  all screens now read their copy from it instead of inline literals

## Phase 7 — Ops & launch readiness

- ✅ Structured logging + queue-depth visibility for cartoonization backlog (N4) — `pino` +
  `pino-http` (`backend/src/lib/logger.ts`), wired into the request pipeline and the worker; no
  error tracking/metrics vendor wired up (would need a real account/service, out of reach for a
  local-only setup) — `cartoonizeQueue.getJobCounts()` is exercised by the new load test script
  below as the queue-depth visibility mechanism today
- ✅ Health checks + PM2 process config for frontend/backend (N4) — `GET /health` now actually
  checks Postgres (`SELECT 1`) and Redis (`PING`) instead of just returning `ok` unconditionally;
  `ecosystem.config.js` at the repo root defines all four processes (frontend/backend/worker/
  cartoonizer) for `pm2 start ecosystem.config.js` per the root CLAUDE.md deploy convention
- ❌ nginx + TLS, deploy script sourcing nvm (root CLAUDE.md deploy convention) — needs a real
  domain and a deploy target, not buildable against localhost; the convention itself is already
  documented in root CLAUDE.md, nothing project-specific to add until there's a box to point it at
- ✅ Free-tier client-review deploy (Vercel + Render + Supabase + Upstash) — live at
  [toonymous.vercel.app](https://toonymous.vercel.app); see
  [04-conventions.md](04-conventions.md#free-tier-demo-deploy-client-review) for the adaptations
  this required. A demo stand-in for the item above, not a substitute for it — the real launch
  still needs the bare-VPS/nginx/TLS path.
- ✅ Port block 4000-4009 wired per [04-conventions.md](04-conventions.md) — confirmed live: frontend
  4000, backend 4001, cartoonizer 4002 (internal-only, not proxied); root CLAUDE.md's project table
  updated from "assigned, not yet wired up" to active
- ✅ Data retention scheduled jobs (original-image purge safety net, deleted-account purge SLA)
  (N2) — `backend/src/lib/retention.ts`, hourly `node-cron` job sweeping any intake file older than
  1 hour (a safety net for a crash mid-job; the normal path already deletes in `worker.ts`'s
  `finally` block). Deleted-account purge SLA is already satisfied by design — `DELETE /me` is a
  hard delete with no soft-delete window, so there's nothing to schedule.
- ❌ Legal/compliance review: age-gating posture, jurisdictional content law, CSAM reporting
  obligations (N6, flagged in [01-overview.md](01-overview.md) as needing real legal sign-off) —
  requires an actual human/lawyer, not buildable
- ✅ Load test the cartoonization queue path specifically (N3) — `backend/src/scripts/
  loadtestCartoonize.ts` (`npm run loadtest:cartoonize -- <count>`), fires N concurrent posts at the
  running backend and watches `cartoonizeQueue.getJobCounts()` drain. Run live against this local
  setup at count=30: the per-IP rate limiter (F5.3, 10 posts/60s) correctly capped it at 10
  successful creates with 429s on the rest — confirming the limiter itself works under burst load;
  those 10 (plus leftover jobs from earlier manual testing, 16 total) drained from the queue in
  ~4.4s with zero failures. The queue was never the bottleneck; the rate limiter was, which is the
  intended behavior.

## Explicit non-goals (never check these off — they should never be built)

- Regional/location-based feed or filter
- Behavioral-profiling recommendation engine
- Real-name/verified-identity fields
- Raw photo storage or display at any stage
- Contacts/address-book friend finder
