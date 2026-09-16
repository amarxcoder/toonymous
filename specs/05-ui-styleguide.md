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

Light-only. Four selectable accent themes (Violet default, Sunset, Ocean, Mint) rather than a
light/dark split — `--bg-base`/`--bg-surface`/`--border`/`--text-*` are identical across all four,
only the accent trio + `.brand-gradient` change, so switching themes is a personalization choice,
not a color-scheme mode.

| Token | Value | Usage |
|---|---|---|
| `--bg-base` | `#FAFAF9` | App background |
| `--bg-surface` | `#FFFFFF` | Cards, post containers |
| `--bg-elevated` | `#FFFFFF` (shadow) | Modals, popovers, bottom sheets |
| `--bg-subtle` | `#F4F4F2` | Hover/pressed wash on controls sitting on `--bg-surface`, skeleton base |
| `--border` | `#E7E5E4` | Dividers, card borders |
| `--text-primary` | `#18181B` | Primary text |
| `--text-secondary` | `#6B6B70` | Timestamps, meta |
| `--accent-success` | `#16A34A` | Success states |
| `--accent-danger` | `#DC2626` | Destructive actions, moderation warnings |
| `--accent-warning` | `#D97706` | Report/flag states |

Per-theme accent trio (each is `--accent-primary` / `--accent-primary-hover` = `--accent-primary-text`
/ `--accent-secondary` / `--accent-tertiary`):

| Theme | Primary | Hover/text shade | Secondary | Tertiary |
|---|---|---|---|---|
| Violet (default) | `#7C5CFC` | `#6B4CE0` | `#D92A89` | `#B06600` |
| Sunset | `#FB5607` | `#9A3412` | `#FF006E` | `#FFBE0B` |
| Ocean | `#3A86FF` | `#1D4ED8` | `#00B4D8` | `#8338EC` |
| Mint | `#06D6A0` | `#047857` | `#FFD60A` | `#118AB2` |

Rules:
- No pure black (`#000`) or pure white (`#FFF`) as a large fill — use the tokens above for softer
  contrast that's easier on the eyes in a scroll-heavy feed app.
- Accent color used sparingly: primary actions and active/selected states only, never as large
  background fills that would compete with cartoonized post content.
- `--accent-secondary`/`--accent-tertiary` exist purely to give the brand a "young, creative" energy
  in a few fixed spots (the `.brand-gradient` mix of all three accents: logo mark, primary buttons,
  avatar ring, active nav icon) - they are never used for text or as a standalone large fill, so they
  don't need their own AA-text shade the way `--accent-primary-text` does.
- Every theme's `--accent-primary-hover`/`--accent-primary-text` shade must independently pass WCAG
  AA contrast on `--bg-surface` (4.5:1 body text, 3:1 large text/icons) — adding a fifth theme means
  picking a text-safe shade of its primary hue, not reusing another theme's.

## Radii, elevation & motion tokens

All three are token scales in `globals.css`, exposed to Tailwind through `@theme inline` as
`rounded-*`, `shadow-*` and `ease-*` utilities. Nothing in the UI hardcodes a radius, shadow or
duration outside this table.

| Group | Tokens | Rule |
|---|---|---|
| Radii | `--r-sm` 8 / `--r-md` 10 / `--r-lg` 14 / `--r-xl` 18 / `--r-2xl` 24 / `--r-pill` | `--r-md` is the default chrome radius (buttons, inputs, list rows); `--r-2xl` is cards and sheets; `--r-pill` is reserved for the primary CTA and small status pills |
| Elevation | `--elev-xs` / `--elev-card` / `--elev-pop` / `--elev-modal` | Two-part shadows (tight contact + wide diffusion). Rises one step on hover for cards, never more. `--shadow-card` is kept as an alias of `--elev-card` |
| Motion | `--ease-out`, `--ease-spring`, `--dur-fast` 140ms, `--dur` 200ms, `--dur-slow` 280ms | `--ease-spring` only where an element should feel physical (sheet entrance, like tap); everything else uses `--ease-out` |

Named animations (`--animate-*`): `shimmer` (skeletons), `fade-in`, `rise` (list/card entrance),
`pop-in` (dialogs, popovers), `sheet-up` (mobile bottom sheet), `spin-slow` (spinner), `like-pop`
(heart tap), `indeterminate` (cartoonize progress bar).

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
  card), subtle diffused shadow (`--shadow-card`) — same value across all four themes since
  `--bg-surface` doesn't change.
- **Post card overflow menu:** Report and Block live behind a "more" (⋯) icon button on the post
  header, not as inline text buttons in the action row — keeps the primary row to just Like/Comment
  plus a visible Follow. Any icon-only button (the ⋯ menu, Like, Comment) needs an `aria-label`.
- **"Cartoonized" badge:** a small checkmark + label next to the timestamp on every post header,
  reinforcing the always-cartoonized pillar. This is always literally true for anything reaching the
  feed, so it's safe as a permanent trust cue — never add a similar badge for anything that isn't
  unconditionally true (no fake "verified"/"trending" badges, ever).
- **Theme picker:** four gradient swatch buttons (sidebar on desktop, top bar on mobile) — Violet,
  Sunset, Ocean, Mint. Defaults to Violet on first visit, persists an explicit choice in
  `localStorage`, applied via `data-theme` on `<html>` (set before first paint by an inline script,
  `THEME_INIT_SCRIPT` in `ThemeContext.tsx`) so there's no flash of the wrong accent. Light-only by
  design — no dark mode.
- **Overlays:** one `Sheet` primitive backs every modal in the app - a bottom sheet under 640px
  (thumb reach, with a grab-handle affordance) and a centered dialog above it. It traps Tab inside
  the panel, closes on Escape or backdrop click, locks body scroll, skips its own close button when
  placing initial focus (so a keyboard user lands in the field they came to fill), and hands focus
  back to the control that opened it - or to an explicit `returnFocusRef` when that control was a
  menu item that has since unmounted. `ConfirmDialog` wraps it for destructive confirmations and
  stays open with a spinner while the action runs, so nothing can be double-submitted.
- **Menus:** small anchored popover (`Menu`/`MenuItem`) for the post card's overflow only, closing
  on outside pointer-down, Escape, or item choice. A two-item menu never escalates to a full modal.
- **List rows:** grouped settings rows (`ListRow` inside `ListGroup`) with an icon, a label and a
  one-line explanation, used for the profile screen's destinations and account actions. Preferred
  over a stack of identical secondary buttons, which gives the eye nothing to aim at.
- **Page headers:** `PageHeader` renders the `<h1>` (display font) plus optional subtitle, an
  optional back control on secondary screens, and a slot for one action. The four nav destinations
  never show a back control.
- **Empty states:** every list renders `EmptyState` (icon, title, one explanatory line, optional
  action) rather than a bare sentence, so an empty feed reads as intentional rather than broken.
- **Tabs:** `SegmentedTabs` draws a single indicator that slides between options, so switching
  reads as one control rather than two independent buttons.
- **Toasts/inline errors:** never use a raw `alert()`; all feedback (e.g. "post scrubbed for
  personal info, please rephrase") is inline, calm, and actionable — this app will surface privacy
  filter interventions relatively often, so this messaging must feel protective, not punitive.

## Loading, empty & feedback states

Every asynchronous surface in the app has all four states designed, not just the happy one.

- **Loading:** skeletons, never a centered "Loading..." string. A skeleton mirrors the exact shape
  of the content it replaces (`PostCardSkeleton`, `CommentSkeleton`, `RowSkeleton`), so nothing
  shifts when real data lands. The group is announced once via `aria-busy` on its container rather
  than per placeholder. First load of a list shows skeletons; paging more into a list already on
  screen shows a spinner on the button instead.
- **Images:** a shimmer placeholder is held under every post image until it decodes, then the image
  fades in. A post that exists before its cartoon does renders an explicit "still cartoonizing"
  tile, not an empty gap.
- **Progress:** work with no real percentage (the cartoonize queue) gets an indeterminate bar.
  Never dress an unknown duration up as a fake percentage.
- **Optimistic actions:** the like button flips on the same frame as the tap and rolls back to the
  server's last known value if the request fails. An in-flight guard blocks a second request
  without visually disabling the control.
- **Toasts:** `info` / `success` / `error`, each with an icon and a dismiss control, at most three
  on screen at once. Used for the result of an action taken elsewhere on the page (follow, block,
  report sent). Failures a user fixes *in place* - a login error, a validation error - are reported
  inline next to the field instead, because that is where the fix happens.
- **Errors in a list:** a failure with nothing on screen replaces the list with an `EmptyState`
  carrying a retry action; a failure while paging keeps what is already loaded and reports the
  problem above the load-more control.

## Motion

- Short, purposeful transitions only: `--dur-fast` for hovers/taps, `--dur` for state changes,
  `--dur-slow` for modal/sheet open. No decorative animation that delays the user from posting or
  scrolling.
- Lists enter with a staggered `rise` (`.stagger`, 45ms apart, capped at 6 so a long list never
  lags at the end). Cards lift one elevation step on hover; buttons scale to 0.98 on press.
- Respect `prefers-reduced-motion` — when set, non-essential animation is disabled by collapsing
  duration **and** iteration count **and** delay. All three matter: a zeroed duration alone leaves
  an infinite animation spinning thousands of times a second, and a live delay leaves a staggered
  item sitting at its first keyframe (opacity 0) for the length of that delay, which turns an
  entrance into missing content.

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
