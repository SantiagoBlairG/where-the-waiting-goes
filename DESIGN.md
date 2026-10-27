# Design

Visual decisions for "Where the waiting goes". Source of values: `plan.md` §6. Tokens live in `src/styles/tokens.css` (single source). Update this file when a visual decision is made; do not restart the direction (plan.md §4).

## Direction

Off-white stage, large dark centered type, generous space. Three light station cards on a shallow arc with fine-line isometric coffee illustrations and dots connecting the stations. Solid or lightly tinted surfaces. No heavy glass, busy photography or large backdrop blurs. On desktop all station names and key values stay visible together: depth never hides the process.

## Color tokens

| Token (CSS var) | Value | Use |
| --- | --- | --- |
| `--wg-page` | #F7F6F2 | Page background |
| `--wg-surface` | #FFFFFF | Cards, dialogs |
| `--wg-ink` | #232A28 | Primary text |
| `--wg-ink-2` | #59645F | Secondary text |
| `--wg-border` | #DADFD9 | Fine rules and outlines |
| `--wg-active` | #176B60 | Active / selected / primary action |
| `--wg-active-tint` | #E5F0EC | Active tint |
| `--wg-queue` | #9A541B | Queue emphasis |
| `--wg-queue-tint` | #FBEDD9 | Queue tint |

Color never carries meaning alone: pair with labels, icons, outlines or patterns. Contrast of every rendered combination is still to be validated (tracked in docs/progress.md).

## Shape, space, shadow

Card radius 24px. Control radius 12px. Spacing scale 4, 8, 12, 16, 24, 32, 48, 64, 96px. Card shadow `0 16px 40px rgba(35,42,40,0.08)`.

## Typography

One family: Geist Variable, bundled through `@fontsource-variable/geist` (served from our own build, not a CDN). Tabular numerals for changing data. Sizes: desktop opening 64–88px, mobile opening 36–44px, section headline 32–48px, body 16–18px, metric 28–36px, labels at least 12–14px.

## Illustration

Consistent isometric orientation, roughly 1–1.5px strokes at display size, minimal fills, one light direction. Lines must stay visible on the actual surface. Each illustration has a text equivalent; decorative paths are hidden from assistive technology.

## Motion

- Hover/focus response 140–200ms, lift at most 4px.
- Focus/card transition 300–450ms. Worker drop 200–300ms with a clear snap. Detail expansion 300–450ms.
- No elastic overshoot, perpetual bobbing, spinning scenes or particle bursts.
- Scroll progression drives narrative motion. Hover never advances the story.
- No two animation engines write the same element's transform. GSAP owns outer stage/card transforms; illustration logic owns inner groups; CSS hover only on wrappers not transform-controlled.

## Components

Station card, top to bottom: step number and title; line illustration; worker slots; "Waiting" count and "Capacity" value with units; one short status; explicit "Look closer" button. Do not nest every sub-element in another card.

## Decisions log

- 2026-10-27: shadcn/ui initialised with the `radix-nova` preset, then remapped onto the project tokens above. Dark mode removed (not in scope).
