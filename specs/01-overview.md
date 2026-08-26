# Toonymous — Product Overview

## What this is

A global, fully anonymous social media app. Users post images; the app automatically converts
every image into a cartoon/caricature rendering before it is ever stored or shown to anyone —
nobody ever sees, stores, or can recover the original photo. No real identity, no location, no
regional grouping, no algorithmic "suggested for you" feed. One global stream, everyone
represented as an illustrated version of themselves.

## Name

**Toonymous** (toon + anonymous). Chosen because it states the mechanic and the value prop in one
word, is short, brandable, and domain-friendly. Easy to change later — it only appears in this
folder name, the spec docs, and (once built) branding strings/config, so a rename is a mechanical
find-and-replace plus a folder rename, not an architecture change.

## Core idea

1. User captures or picks a photo.
2. Before anything is stored or shown to anyone (including the poster), the app runs it through an
   image-to-cartoon/caricature conversion pipeline server-side.
3. Only the cartoonized output is ever persisted and displayed. The original photo is discarded
   after conversion (see [03-requirements.md](03-requirements.md) for retention rules).
4. The post appears in a single global feed, attached to an anonymous, system-issued handle — never
   the user's name, photo, or location.

## Non-negotiable design pillars

These override convenience or growth-hack instincts anywhere else in the spec:

- **Anonymity is the product, not a feature.** No real photo, real name, comment text, or metadata
  may ever reveal a user's identity — enforced technically, not just by policy.
- **No location, anywhere.** No geotagging, no IP-derived region, no "near you," no country/city
  shown on a post or profile.
- **No regional grouping.** One global feed/namespace. No region-scoped tabs, filters, or servers.
- **No algorithmic post suggestions.** No personalization/recommendation engine that profiles a
  user to rank content. Feed ordering is chronological or randomized-global — see
  [02-features.md](02-features.md) for the exact rule.
- **Every image becomes a cartoon/caricature, always, no exceptions.** No path exists in the
  product for an unconverted image to reach storage or another user's screen.

## Target quality bar

Modern, enterprise-grade: production-hardened auth, abuse/CSAM-safe moderation pipeline (critical
given anonymous image upload), horizontally scalable architecture, observability, and a polished,
accessible, clean UI. See [03-requirements.md](03-requirements.md) and
[05-ui-styleguide.md](05-ui-styleguide.md).

## Scope note

This app is global from day one (no regional rollout gating), consistent with "no regional
grouping" as a product pillar, not just a launch-order choice.

## Open decisions (flagged, not blocking)

- **Cartoonization engine**: self-hosted OSS model (recommended default, see
  [04-conventions.md](04-conventions.md)) vs. third-party paid API. Revisit once real usage volume
  and budget are known.
- **Exact legal/compliance posture** (age gating, jurisdiction-specific content law, CSAM reporting
  obligations) needs a real legal review before public launch — this spec sets the technical floor
  (mandatory moderation pipeline, reporting hooks) but is not a substitute for that review.
