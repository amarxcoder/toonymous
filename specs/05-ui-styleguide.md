# Toonymous — UI, Theming & Style Guide

Single source of truth for all UI work on this app. Every UI change follows this guide unless a
future revision of this doc changes it. Cross-reference: [03-requirements.md](03-requirements.md)
N5 (accessibility baseline: WCAG 2.1 AA).

## Design principles

1. **Playful, not childish.** The product is built on cartoon/caricature art, so the UI can be
   warm and characterful — but the chrome around the content (nav, buttons, forms) stays clean,
   modern, and restrained so it reads as a serious, trustworthy, enterprise-grade product, not a
   novelty app.
2. **Content is the star.** Cartoonized images are colorful and expressive; the UI frame around
   them is neutral so posts don't have to compete with the interface.
3. **Anonymity feels safe, not sterile.** No identity cues anywhere (no name labels, no location
   pills, no "verified" badges) — but the app should still feel personal via handle, avatar style,
   and voice, not blank and corporate.
4. **Clarity over density.** Generous white space, one primary action per screen, no cluttered
   dashboards — this is a consumer social app, not an admin tool.

## Color system

Two themes, dark and light, both first-class (not light-only with a dark mode bolted on).

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg-base` | `#FAFAF9` | `#0F0F12` | App background |
| `--bg-surface` | `#FFFFFF` | `#18181C` | Cards, post containers |
| `--bg-elevated` | `#FFFFFF` (shadow) | `#212126` | Modals, popovers |
| `--border` | `#E7E5E4` | `#2A2A30` | Dividers, card borders |
| `--text-primary` | `#18181B` | `#F4F4F5` | Primary text |
| `--text-secondary` | `#6B6B70` | `#9A9AA2` | Timestamps, meta |
| `--accent-primary` | `#7C5CFC` | `#8B6BFF` | Primary brand accent (buttons, links, active states) — a violet chosen to feel modern/creative without leaning "corporate blue" |
| `--accent-primary-hover` | `#6B4CE0` | `#9C7FFF` | Hover/active state of accent |
| `--accent-success` | `#16A34A` | `#22C55E` | Success states |
| `--accent-danger` | `#DC2626` | `#EF4444` | Destructive actions, moderation warnings |
| `--accent-warning` | `#D97706` | `#F59E0B` | Report/flag states |
| `--accent-secondary` | `#D92A89` | `#FF4FA3` | Decorative only - logo mark, brand gradient, avatar ring. Never body text or a large fill. |
| `--accent-tertiary` | `#B06600` | `#FFB648` | Decorative only, same rule as `--accent-secondary` - the third stop in the brand gradient. |

Rules:
- No pure black (`#000`) or pure white (`#FFF`) as a large fill — use the tokens above for softer
  contrast that's easier on the eyes in a scroll-heavy feed app.
- Accent color used sparingly: primary actions and active/selected states only, never as large
  background fills that would compete with cartoonized post content.
- `--accent-secondary`/`--accent-tertiary` exist purely to give the brand a "young, creative" energy
  in a few fixed spots (the `.brand-gradient` mix of all three accents: logo mark, primary buttons,
  avatar ring, active nav icon) - they are never used for text or as a standalone large fill, so they
  don't need their own AA-text shade the way `--accent-primary-text` does.
- Both themes must independently pass WCAG AA contrast (4.5:1 body text, 3:1 large text/icons).

## Typography

- **Body/chrome font:** Inter for all UI chrome, nav, buttons, form fields, and body/caption text —
  no display/decorative font here, keeps the enterprise-grade feel.
- **Display font:** Space Grotesk, used only for the logo wordmark and large page headings (`<h1>`
  on auth/landing/feed-title screens) - never on functional chrome (buttons, nav, inputs, labels).
  This is the one deliberate "cool, modern" flourish in an otherwise restrained typographic system.
- Handles are set in the system monospace stack (`font-mono`) everywhere they appear (post header,
  captions, comments, the sidebar "you" chip) - a quiet way to make an anonymous handle read as an
  identifier without turning it into an identity cue.
- **Scale:** 12/14/16/20/24/32px, one consistent modular scale used everywhere (no ad hoc sizes).
- **Weight:** 400 body, 500 for emphasis/labels, 600-700 for headings only — avoid overusing bold,
  it reads as shouty in a social feed context.
- Line height 1.5 for body text, 1.2 for headings.

## Layout

- **Feed:** single-column, mobile-first, max content width ~600px even on desktop (matches the
  reading-width convention of every major social feed app — avoids an ugly overstretched card on
  wide screens).
- **Navigation:** bottom tab bar on mobile (Feed / Post / Notifications / Profile), left rail on
  desktop ≥1024px — same four destinations, no more, keeping the nav minimal on purpose (no
  location tab, no "explore/for-you" tab per the no-suggestions pillar).
- **Post card:** cartoonized image full-bleed within the card, handle + relative timestamp above,
  caption below image, like/comment/report actions in a single row beneath — no location line, no
  identity line, ever (structurally impossible to add without editing this card component, which
  is the point).
- **Spacing scale:** 4/8/12/16/24/32/48px, applied consistently (Tailwind's default spacing scale
  is a fine implementation vehicle for this if the frontend uses Tailwind).
- Responsive breakpoints: 0-639 mobile, 640-1023 tablet, 1024+ desktop.

## Components (baseline set)

- **Buttons:** primary is the one full-pill (`--r-pill`), `.brand-gradient`-filled shape in the app
  — the single "brand" surface, reserved for the one primary action per screen (post, submit, share
  to feed). Secondary (outline), ghost (text-only, e.g. "cancel"), and danger all stay a restrained
  10px corner radius rectangle so they read as calm chrome, not competing brand moments. This is a
  deliberate revision from an earlier all-8px-rectangle rule — the pill is reserved for exactly one
  role (primary CTA) so it stays a signal, not decoration.
- **Inputs:** clear focus ring using `--accent-primary`, label above field (not placeholder-as-label
  — placeholder-as-label fails accessibility and disappears when the user needs it most). 10px
  corner radius, matching secondary buttons.
- **Avatars:** always the generated abstract avatar or the user's latest cartoon — circular, 1px
  border in `--border` so it reads clearly against any post thumbnail behind it. In the post header
  and the sidebar "you" chip, wrap it in a 1.5px `.brand-gradient` ring instead of a plain border —
  the one place per screen the full gradient identity shows up beyond the primary button.
- **Cards:** `--bg-surface` background, 1px `--border`, 16px corner radius (post cards, profile
  card), subtle shadow (`--shadow-card`) in both themes now that it's a soft diffused shadow rather
  than a hard one — verify it still reads clean, not muddy, before reusing this shadow value anywhere
  new in dark theme.
- **Post card overflow menu:** Report and Block live behind a "more" (⋯) icon button on the post
  header, not as inline text buttons in the action row — keeps the primary row to just Like/Comment
  plus a visible Follow. Any icon-only button (the ⋯ menu, Like, Comment) needs an `aria-label`.
- **"Cartoonized" badge:** a small checkmark + label next to the timestamp on every post header,
  reinforcing the always-cartoonized pillar. This is always literally true for anything reaching the
  feed, so it's safe as a permanent trust cue — never add a similar badge for anything that isn't
  unconditionally true (no fake "verified"/"trending" badges, ever).
- **Theme toggle:** a manual sun/moon pill toggle (sidebar on desktop, top bar on mobile), not just
  `prefers-color-scheme`. Defaults to system preference on first visit, persists an explicit choice
  in `localStorage`, and is applied via `data-theme` on `<html>` (set before first paint by an inline
  script) so both themes stay first-class per the design principles above.
- **Toasts/inline errors:** never use a raw `alert()`; all feedback (e.g. "post scrubbed for
  personal info, please rephrase") is inline, calm, and actionable — this app will surface privacy
  filter interventions relatively often, so this messaging must feel protective, not punitive.

## Motion

- Short, purposeful transitions only: 150-200ms ease-out for hovers/taps, 250ms for
  modal/sheet open. No decorative animation that delays the user from posting or scrolling.
- Respect `prefers-reduced-motion` — disable non-essential transitions when set.

## Iconography

- One consistent icon set (outline style, 1.5-2px stroke) across the whole app — no mixing icon
  families. Implemented as inline SVG React components in `frontend/src/components/Icons.tsx`, no
  icon font/library dependency.
- No camera/location-pin icon repurposed anywhere near the compose flow (avoid any implicit visual
  suggestion that location is part of posting).

## Reference mock

`DOCS/References/toonymous-premium.html` is a static, standalone HTML/CSS/JS mock of this direction
(sidebar + rail layout, gradient brand identity, post card and compose dropzone patterns) — useful
as a quick visual reference, but it is not wired to real data (its stats, stories row, and multiple
nav destinations beyond the four real ones are illustrative only, not things to build). This
document and the actual `frontend/` implementation are the source of truth where the two diverge.

## Voice & tone (UI copy)

- Friendly, plain language, no corporate jargon, no forced cuteness.
- No em dashes in any UI copy (workspace-wide rule) — hyphens or restructured sentences.
- Copy never implies identity ("your friends," "people near you") — use neutral language ("the
  community," "everyone").

## Accessibility

- WCAG 2.1 AA baseline (contrast, focus states, keyboard nav, semantic HTML, ARIA labels on
  icon-only buttons, alt text on cartoonized images describing content generically since captions
  are user text).
- All interactive elements reachable and operable by keyboard alone; visible focus indicator using
  `--accent-primary` at all times, never `outline: none` without a replacement.
