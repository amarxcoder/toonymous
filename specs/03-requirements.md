# Toonymous — Requirements

Cross-reference: [01-overview.md](01-overview.md) for pillars, [02-features.md](02-features.md) for
feature scope this must support.

## Functional requirements

### F1. Image pipeline
- F1.1 — Every uploaded image is converted to a cartoon/caricature rendering before it is stored
  durably or shown to any user, with no code path that bypasses conversion.
- F1.2 — EXIF and all embedded metadata (GPS, device ID, timestamp beyond what the app itself
  needs) is stripped before the image is processed or stored.
- F1.3 — The original (pre-conversion) image is held only in a short-lived intake store, is never
  written to permanent object storage, and is deleted immediately after conversion succeeds or
  fails terminally (no silent retention "just in case").
- F1.4 — Conversion runs through an automated safety pre-check (F5) before the cartoonization
  model ever processes the image.

### F2. Anonymity
- F2.1 — No field in the data model captures real name, government ID, precise location, or
  contact info visible to other users.
- F2.2 — Handles are system-generated; free-text custom handles are not permitted at launch (see
  [02-features.md](02-features.md)).
- F2.3 — All free-text fields (captions, comments, future bio) are scanned by a PII/identity filter
  before publish; matches are blocked or redacted, not silently allowed.
- F2.4 — No feature surfaces another user's IP, device, or approximate location, directly or by
  inference (e.g. "3 people near you liked this" is prohibited).

### F3. Feed
- F3.1 — Feed is global; no region/country/city partition exists in the API or schema.
- F3.2 — Feed ordering is chronological or randomized-global only; no per-user behavioral ranking
  model is used to select or order content.

### F4. Social graph
- F4.1 — Following/blocking is scoped to anonymous handles only, never to any identity signal.
- F4.2 — Aggregate counts (likes, followers) are shown; identities of individual reactors are never
  exposed to the post owner or other users.

### F5. Trust & safety
- F5.1 — Every image is scanned for CSAM/NSFW/violent content prior to cartoonization; a positive
  match blocks publication, is logged for compliance reporting, and never reaches the
  cartoonization step or any human reviewer's general queue (routes to a restricted
  legal/compliance workflow instead).
- F5.2 — Reported content and comments enter a moderation queue with audit trail (what was
  reported, when, resolution) that contains no reviewer-facing "real identity" of the reported
  account — reviewers act on content and account/device signals only.
- F5.3 — Rate limiting on posts, comments, reports, and account creation per device-fingerprint/IP
  to blunt abuse from disposable anonymous accounts.
- F5.4 — Abuse actions (mute, shadow-limit, ban) are keyed to account ID + device signals, not
  identity, per [02-features.md](02-features.md)'s "abuse handling without identity" note.

### F6. Accounts
- F6.1 — Auth via email or phone + password (or passwordless OTP); the credential is used solely
  for login/account recovery and is never displayed to other users or exposed via any API to
  non-owners.
- F6.2 — Account deletion is self-service and results in hard-deletion of the credential and all
  posts/comments within a bounded SLA (see F8 data retention).

### F7. Global availability
- F7.1 — No feature gates functionality by region; the product launches globally, consistent with
  "no regional grouping" as a pillar, not a phased rollout plan.
- F7.2 — UI copy and content are English-first at launch; i18n architecture (externalized strings)
  is put in place from the start even if only one locale ships, so translation is additive later.

## Non-functional requirements

### N1. Security
- Encryption in transit (TLS everywhere) and at rest (DB + object storage).
- Secrets (DB credentials, API keys for the moderation/cartoonization services) in environment
  config, never committed.
- Standard web hardening: CSRF protection, input validation at every API boundary, output encoding
  to prevent XSS, parameterized queries only (no string-built SQL).
- Auth sessions use short-lived tokens with refresh, not long-lived static tokens.

### N2. Privacy & data minimization
- Collect the minimum data needed to run the product; no analytics SDK that fingerprints users
  across apps/sites.
- Data retention policy documented and enforced by a scheduled job (not "someone remembers to run
  a script"): original images purged immediately (F1.3), deleted accounts purged within a defined
  SLA (e.g. 30 days), moderation logs retained only as long as compliance requires.

### N3. Scalability & performance
- Stateless API layer so it can scale horizontally behind a load balancer.
- Cartoonization is CPU/GPU-heavy and must run as an async background job (queue-backed), never
  inline in the request/response cycle of the upload endpoint — the client polls or gets a
  push/webhook update when the post is ready.
- Object storage (images) separated from the primary relational database; served via CDN.
- Feed queries use cursor-based pagination; no unbounded `OFFSET` scans as data grows.

### N4. Reliability & observability
- Structured logging, error tracking, and metrics (queue depth for the cartoonization pipeline is
  a key operational signal — a backlog there directly delays every user's post).
- Health checks for every service; PM2 process management per the workspace's deploy convention
  (see this project's [CLAUDE.md](../CLAUDE.md) and the root CLAUDE.md it links to).

### N5. Accessibility & UX quality
- WCAG 2.1 AA as the baseline target: color contrast, keyboard navigation, screen-reader labels on
  all interactive elements.
- Full spec in [05-ui-styleguide.md](05-ui-styleguide.md).

### N6. Compliance posture (technical floor, not legal sign-off)
- Age-gate at signup (self-attested at MVP; flagged in [01-overview.md](01-overview.md) as needing
  real legal review before public launch).
- CSAM detection + mandatory reporting hook (F5.1) is a legal requirement in most jurisdictions for
  any UGC image platform — non-negotiable, ships with MVP, not deferred.
- Report/appeal path for moderation decisions, even for anonymous accounts.

## Explicit non-requirements (do not build)

- No requirement anywhere in this doc should be read as permitting location capture, regional
  segmentation, or behavioral-profiling-based content ranking — see
  [01-overview.md](01-overview.md)'s pillars, which these requirements exist to support, not
  override.
