# CLAUDE.md — Toonymous

Anonymous, global social app: every posted image is automatically converted to a cartoon/caricature
before storage or display; no real identity, no location, no regional grouping, no algorithmic
feed. See [specs/01-overview.md](specs/01-overview.md) for the full product vision and the
non-negotiable design pillars — read that file before making any product or architecture call that
touches identity, location, or feed ranking.

This project follows the workspace-wide conventions in [../CLAUDE.md](../CLAUDE.md) (behavioral
guidelines, no Docker, port-block system, deploy pipeline, no em dashes in user-facing text) —
merge with the project-specific rules below rather than repeating them.

## Spec index (source of truth pre-code, and the reference once code exists)

- [specs/01-overview.md](specs/01-overview.md) — product vision, name rationale, non-negotiable
  pillars, open decisions
- [specs/02-features.md](specs/02-features.md) — MVP and near-term feature scope, explicit
  out-of-scope list
- [specs/03-requirements.md](specs/03-requirements.md) — functional + non-functional requirements
  (security, privacy, scalability, accessibility, compliance)
- [specs/04-conventions.md](specs/04-conventions.md) — tech stack, port block (4000-4009), folder
  layout, coding conventions, deploy notes
- [specs/05-ui-styleguide.md](specs/05-ui-styleguide.md) — single source of truth for all UI: color
  tokens (light + dark), typography, layout, components, motion, voice, accessibility
- [specs/06-checklist.md](specs/06-checklist.md) — phased build checklist; keep its status column
  current as work lands (✅/⚠️/❌), same convention as matri's `REFERENCE/updated-checklist.md`

**Before any significant feature or UI work, re-read the relevant spec file above — this app has
more hard product constraints than usual (anonymity, no location, no ranking) and it's easy to
accidentally violate one while solving an unrelated problem.**

## Karpathy-inspired engineering guidelines

Additive to the root CLAUDE.md's four behavioral rules (think before coding, simplicity first,
surgical changes, goal-driven execution). These lean on Andrej Karpathy's public engineering
philosophy — favor a working, well-understood baseline over an impressive but opaque one, and treat
"do I actually understand this end to end" as the real bar for shipping.

1. **Build the dumbest version that could possibly work first, then earn complexity.** Before
   reaching for a queue/cache/ML model/abstraction, ask what the simplest version of this looks
   like (synchronous call, hardcoded value, plain SQL) and build that first if it's fast enough to
   validate the idea. Only add the sophisticated version once the simple one has proven the concept
   or hit a real, measured limit — not a hypothetical one.
2. **Become one with the code — read every diff line by line before accepting it.** Don't trust
   generated code you haven't personally traced through. If you (the agent) can't explain why a
   line is there, delete it or go understand it first. This applies double here: privacy/anonymity
   bugs are exactly the kind that hide in a line nobody actually read.
3. **Verify on the smallest possible slice before scaling up.** Karpathy's ML instinct — "overfit a
   single batch before training on the full dataset" — translates directly: get one image through
   the full pipeline (upload → strip metadata → safety scan → cartoonize → display) end to end
   manually before wiring up the queue, the CDN, and the feed around it. A pipeline that's never
   worked once by hand will not debug itself once it's distributed across a job queue.
4. **Prefer boring, readable code over clever code.** No cleverness that trades readability for
   marginal performance without a measured reason. The person most likely to be confused by clever
   code later is whoever (human or agent) touches this repo next.
5. **Delete code aggressively.** The best line of code is the one that doesn't exist. If a feature,
   abstraction, or config flag isn't earning its keep, remove it rather than let it accrete —
   revisit [specs/02-features.md](specs/02-features.md)'s explicit non-goals list before adding
   anything that smells like scope creep back in.
6. **Stay full-stack literate.** Understand the piece you're touching well enough to reason about
   the layer above and below it (don't treat the cartoonization microservice, the queue, or the DB
   schema as an untouchable black box) — the goal is that no part of the system is "someone else's
   problem" when something breaks.

## Status

Phase 0 through Phase 7 done (Phase 7 to the extent a local-only setup allows) — see
[specs/06-checklist.md](specs/06-checklist.md) for the detailed, per-item breakdown including
MVP-stub caveats. `frontend/` (Next.js, port 4000), `backend/` (Express + Prisma + Postgres +
BullMQ worker, port 4001), and `cartoonizer/` (Express + sharp, port 4002, internal-only) all run
locally.

Working end to end: signup/login/refresh/logout, system-generated handles with limited reroll,
generated abstract avatars, hard account deletion, image upload → EXIF strip → safety pre-check →
async cartoonization → guaranteed original-deletion → CDN-style serving → global feed
(chronological + randomized tabs) → post composer with live status polling, PII-scrubbed captions
and comments, like/comment/follow/block on posts, report → moderation queue → resolve
(remove/shadow-limit/ban) → appeal → approve/deny with reversal, a restricted compliance queue for
safety-pre-check matches fully separate from the general moderation queue, full light/dark theming,
a responsive 4-destination nav (bottom bar mobile / left rail desktop), toast-based inline feedback
(no raw `alert`/`confirm`/`prompt` anywhere per the styleguide), all UI copy externalized to
`frontend/src/lib/strings.ts`, structured logging (`pino`), a real DB+Redis health check, an hourly
intake-file retention sweep, and a PM2 process config (`ecosystem.config.js`).

Two things not doable from a local dev box, left `❌` in the checklist on purpose: nginx+TLS (needs
a real domain/deploy target) and the legal/compliance review (needs an actual human/lawyer). A
local load test against the cartoonization queue (`npm run loadtest:cartoonize` in `backend/`)
found the per-IP rate limiter (F5.3), not the queue, is the first thing to hit under burst load —
that's the intended behavior, not a bug.

Two things are MVP stand-ins, not the real thing, and are flagged inline in the code:
- `backend/src/lib/safetyCheck.ts` always returns "safe" — replace with a real CSAM/NSFW vendor
  before any real (non-test) image is ever uploaded, not just before public launch (N6). Its
  restricted-workflow plumbing (`ComplianceFlag` model, `/compliance` routes, `/admin/compliance`
  UI, its own `complianceOfficer` role) is real and verified end to end with a manually inserted
  flag — only the detector itself is a stub.
- `cartoonizer/`'s default effect is a sharp image filter (smooth + saturate + edge outline), not a
  trained model. The engine is now swappable via `CARTOONIZE_PROVIDER` env var
  (`cartoonizer/src/providers/`) with zero code changes elsewhere in the pipeline: `sharp` (default,
  zero installs), `gmic` (shells out to the `gmic` CLI's cartoon filter — not installed on this box,
  needs `sudo apt install gmic`, unverified end to end since installing it needs interactive sudo
  this environment doesn't have), `api` (generic HTTP passthrough to a local model server or hosted
  API via `CARTOONIZE_API_URL`/`CARTOONIZE_API_KEY`, for swapping in a real LLM/vision API later).
  Evaluated Photo2Cartoon, ComfyUI+FLUX Kontext, Inkscape Trace Bitmap, StyleCariGAN/CariGAN, and
  GIMP+G'MIC against this box: no GPU present and RAM already under pressure (`free -h` showed
  228Mi free, 5.4Gi swapped at evaluation time) rules out ComfyUI+FLUX outright; Photo2Cartoon and
  StyleCariGAN/CariGAN are face-only GANs (need a detected face to look right) while posts here are
  arbitrary photos, not guaranteed portraits; G'MIC's cartoon filter has no GPU/face requirement and
  the smallest footprint of the real options, so it's wired as the `gmic` provider — install and
  smoke-test it before flipping `CARTOONIZE_PROVIDER` in any real deploy.

Other known MVP gaps, not stubs but worth knowing about:
- Rate limiting (F5.3) keys on IP only — there's no real device-fingerprint signal yet.
- A ban revokes refresh tokens immediately, but an already-issued 15m access token still works
  until it expires (stateless JWT tradeoff).
- Roles (`moderator`, `complianceOfficer`) are granted via `npm run set-role -- <email> <role>` in
  `backend/` — there is no self-service or API path to acquire one, by design.

No CI workflow or automated test suite yet.

Live for client review at [toonymous.vercel.app](https://toonymous.vercel.app) via a free-tier
deploy (Vercel + Render + Supabase + Upstash) — see
[specs/04-conventions.md](specs/04-conventions.md#free-tier-demo-deploy-client-review) for what
that required and why it's a demo stand-in, not the real bare-VPS launch path.
