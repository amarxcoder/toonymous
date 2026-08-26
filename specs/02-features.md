# Toonymous — Feature Spec

Cross-reference: [01-overview.md](01-overview.md) for the pillars every feature below must respect.

## MVP (v1)

### Identity & onboarding
- Sign up with email or phone, no real name required anywhere in the flow.
- System issues a random anonymous handle (e.g. `quiet-fox-8123`) at account creation. Users may
  reroll the generated handle a limited number of times, but may **not** free-type a custom handle
  — free text here is exactly how people leak real names. (Revisit only with a strict profanity +
  PII filter if this constraint proves too rigid.)
- No profile photo upload of a real face. Profile avatar is either a system-generated abstract
  avatar or the user's own most recent cartoonized post — never a raw photo.
- No bio field with free-form long text at launch (high leak surface). If added later, it goes
  through the same text-scrubbing pipeline as comments (see Moderation below).

### Posting
- Capture or pick an image → client uploads original to a short-lived, encrypted intake location →
  server strips EXIF/metadata → server runs moderation pre-check → server runs cartoonization →
  original is deleted → cartoonized result is stored and becomes the post.
- Optional caption text, scrubbed by the same PII/identity filter as comments.
- No location tag, no "add place," no map — the field does not exist in the schema or the API.

### Feed
- Single global feed. No region tabs, no country filter, no "trending in your area."
- Ordering: reverse-chronological by default (simplest, most transparent, zero profiling
  surface). A "shuffle/random" global view is acceptable as a secondary tab since it still requires
  no per-user profiling. **No engagement-optimized ranking model, ever.**
- Infinite scroll with standard pagination (cursor-based), not an ML feed ranker.

### Engagement
- Like/react (anonymous — reactor identity never shown, only aggregate count).
- Comment (text only, scrubbed by the PII/identity filter; no comment-image uploads at MVP to
  limit moderation surface).
- Report post/comment (routes to moderation queue, see below).
- No DMs at MVP — private messaging between anonymous users is a major deanonymization and abuse
  vector; revisit post-launch only with strong safeguards (no image sharing in DM, no external
  contact info allowed through the same text filter).

### Moderation (critical, not optional — anonymous + image upload is a high-risk combination)
- Automated pre-publish scan for CSAM/NSFW/violent content on the **original image**, before
  cartoonization, using a hosted trust-and-safety API (e.g. a dedicated CSAM/NSFW detection
  service) — do not rely on the cartoonization model to be a safety filter.
- Automated PII/identity scan on all text (captions, comments): names, phone numbers, emails,
  physical addresses, social handles/links, so identity can't be leaked via text even though images
  are protected.
- Human moderation queue for reported content, with the ability to remove content and shadow-limit
  an anonymous account (see below — there's no "identity" to ban, only device/account signals).
- Rate limiting and anomaly detection to blunt spam/abuse from throwaway anonymous accounts.

### Abuse handling without identity
Since there is no real name/email requirement beyond a login credential, and no location, bans
must key off device fingerprint hashes, account-level signals, and rate-based heuristics rather
than "who this person is." Document this explicitly in the requirements doc — it is a real design
constraint, not an afterthought.

## v1.x / near-term follow-ups

- Saved/bookmarked posts (private to the user, never shown to others).
- Mute/block a handle (blocking is per-handle, not identity — a blocked user can still make a new
  anonymous account, which is an accepted tradeoff of true anonymity).
- Push notifications (likes/comments on your own posts only — never "someone near you posted").
- Multiple caricature style presets (e.g. "classic caricature," "anime," "pop-art") the user can
  pick at post time — still fully automatic conversion, just a style choice, never a way to skip
  conversion.

## Explicitly out of scope (do not build, ever)

- Regional/location-based feeds, filters, or "nearby" anything.
- Any recommendation/personalization engine that ranks content using behavioral profiling.
- Real-name fields, verified identity badges, phone-number-visible-to-others, or any "verify with
  government ID" flow.
- Raw photo storage or display, at any stage, for any user (including the poster themselves after
  the moment of capture).
- Friend-finder via contacts/address book (this is a deanonymization vector).
