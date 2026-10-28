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
- 2026-10-27 (Phase 1): Stage composition fixed: centered large headline, three white station cards on a shallow CSS arc (rotateY ±5deg, 14px drop on the outer cards, desktop only), arrows between cards, vertical flow on narrow screens. Cards are separated from the page by shadow and tone; inside a card, one rule separates the illustration/workers from the live numbers.
- Order dots: solid green = being made, ring with warm tint = waiting, soft grey = picked up. Always paired with a text count. Workers are outlined people (extra worker: dashed green outline), never circles.
- Queue emphasis uses the warm tint and text; capacity emphasis uses the green tint. Both are paired with the numbers, not color alone.
- Illustrations: one isometric projection (`src/illustrations/iso-math.ts`), 1.25px non-scaling strokes, right face lightly shaded. Current register, espresso station and pickup shelf are Phase 1 stand-ins.
- Taste was used selectively: its copy rules and "find the idea" step. Its random direction draw and its bans on thin rules and boxed cards were not applied, because plan.md §4 fixes the direction (fine borders, light cards).
- 2026-10-27 (Phase 2): Illustrations are Hairline-style figures on the vendored kernel (single stroke, rounded solids, springs for pointer position, 700ms tween for choices). Palette comes from `--hairline-*` in `tokens.css`: plate = card surface, hi = ink, edge/mid/lo = ink tints. One bright place per figure at a time. State is shown as geometry (tickets for the queue, drawer and receipt for serving, a lifted cup for hand-over), while order dots stay in the card as the consistent unit.
- 2026-10-27 (Phase 3): Motion language. Words reveal by sliding up from masks (0.85s, power3.out, 50ms stagger), exit upward on the way out and reverse when scrolling back. Scenes cross-fade with a 28px offset against the scroll direction. Stage depth: cards on a GSAP arc (rotationY ±5, outer cards 14px lower), whole-stage tilt of at most 2.2deg by pointer, outer-card parallax of 10px. Hover on a card lifts it 4px with a deeper shadow (CSS, on the article). Order dots pop in (zoom 50% to 100%, 300ms). The traced order is a larger solid dot with a soft ring. Reduced motion and small screens skip the pinned stage entirely.
- Layout rule for the pinned pane: text zone is 27% of the viewport height (minimum 190px), the stage takes the rest; scene content scales down if it would not fit, with 30px of slack for the arc.

## Redesign, 2026-10-27 (client feedback: "terrible in every way")

This section **supersedes** the colour, type, card and motion decisions above. The plan's off-white palette and light cards were followed too literally and read as generic. The client asked for colour, depth, backgrounds, elevation, real effects and a typeface with personality.

- **Idea:** the room is the narrative. Full-bleed colour changes with the story: butter (calm morning), tomato (the rush; its background follows the rush clock from butter to tomato), cobalt (the fix), tomato (the surprise), espresso (the reveal), butter again (start over). Text colours pass contrast on each (ink on butter 13:1, ink on tomato 6:1, white on cobalt 7:1, paper on espresso 16:1).
- **Palette:** ink `#1D120D`, paper `#FFFAF0`, butter `#FFD84A`, tomato `#FF5A36`, cobalt `#2B3FE0`, green `#0E8C5B`, coffee brown `#7A4222` (drinks). Source: `src/styles/tokens.css` and `src/story/theme.ts`.
- **Type:** Bricolage Grotesque (variable: weight, width, optical size) for headlines, numerals and station names, 800 weight at 84% width with -0.018em tracking. Geist for small text. Headlines are left-aligned and oversized (beat 1 up to 9.4rem).
- **Cards are order tickets:** paper slips with a coloured top bar and numeral per station, a tinted illustration pad with a floor shadow, a dashed perforation with notched sides (CSS mask), and a stub with the live count. They stand on a counter band at the foot of the room.
- **Depth:** coffee-ring stains drifting against the scroll at two speeds, static grain, a counter with an edge highlight, pre-painted tinted shadows behind tickets, a slight arc with perspective.
- **Motion, two moments only:** (1) the room's colour and the rush clock follow the scroll; (2) headlines reveal word by word and tickets are pushed up over the counter when a scene arrives. Tickets answer the pointer with a tilt and a moving glare (compositor-only). No ambient bobbing.
- **Performance rules:** transform, opacity and background-color only; scenes memoized; glare is a translated gradient, not a repainted one; shadows are static elements, not blur filters; production build is what is judged.
- **Pinned layout** starts at 900px wide and 520px tall (was 1024 and 560). Narrower screens get the same rooms as ordinary sections, now with scroll reveals, ticket entrances and ring parallax of their own (still none for reduced motion).

## Second design pass, 2026-10-27 (client: "a lot of color", illustration floating, worker icon terrible, active dot weird, cards too close to the bottom, weird footer)

This section supersedes the Redesign section above where they differ.

- **Palette** is now the client's "Earthy Harmony" green reference: stone `#E2DFDA`, mist `#C8DED3`, sage `#88A49A`, sand `#D2C49E`, forest `#386255`, plus ink `#1B2622`, paper `#FBF9F4` and one warm accent, ember `#A8570F`, used only for queues and pressure so it means something. Tokens in `tokens.css`; room themes in `theme.ts`.
- **Rooms** are calm: stone, mist, stone warming toward sand during the rush (background follows the clock), sage, sand, one forest moment for the reveal, mist again. Two soft colour glows and ring stains give life without weight. Saturated yellow, tomato and cobalt are gone.
- **Illustration in a card:** the opening picture now sits on a mist pad inside a paper card (`OpeningCard`), like every other illustration. No floating line drawings on the room colour.
- **Workers** are a round badge with Lucide's `user-round` glyph (ISC licence). The extra worker is a forest badge with a dashed ring.
- **Active ticket** replaces the floating dot: the ticket the traced order is at lifts 14px, gets a forest outline and a forest label strip ("Your order is here"); tickets already passed get a quiet "Your order has moved on" strip; tickets still to come dim to 72%; the connector arrows darken as the order passes.
- **Type:** Bricolage Grotesque stays for titles and numbers. Body and UI text is now Plus Jakarta Sans (was Geist).
- **Space:** roomier padding throughout (tickets 24px sides, bigger numerals, larger gutters). The counter band and the bottom caption are removed; tickets now end 7% of the viewport height above the bottom edge. The simulation note is a small outlined pill at the top right.
- **References** (the four Pinterest links) could not be read by tooling: Pinterest returns no content to automated fetches. Screenshots of them would let me match their scroll, hover and movement ideas.

## Third design pass, 2026-10-27 (client reference: fixaplan.com)

Structure and feel taken from the reference, with our green palette kept (client's choice).

- **Type:** Bricolage Grotesque headlines are now medium weight (600), near-normal width, tracking -0.022em. One word or phrase per headline switches to Instrument Serif italic (`accent` in `storyBeats.ts`, `.accent-serif`), the same device the reference uses. Body stays Plus Jakarta Sans.
- **Floating pill nav** (`SiteNav`): centred at the top, opaque paper, brand link plus a "Try it" button. The skip link is first in tab order, ahead of it. Pinned headlines moved down to clear it.
- **Sheets:** the plain-layout rooms and the experiment are rounded-top (40px) sheets that overlap the one before by 40px, so each slides up over the previous.
- **Cards:** flat rounded cards (32px radius). The ticket notches, coloured top bar and dashed perforation are gone; a hairline rule and a softer shadow remain.
- **Scroll:** native scrolling kept (no Lenis; smooth-scroll hijacking is out of scope). Not done: stat bars filling over a photo, a full-bleed dark finale, a photo hero.

## Fourth pass, 2026-10-28: simplification and the welcome hero

Supersedes earlier passes where they differ. Details and reasons: `docs/redesign-v4.md`.

- **Hero:** inset rounded card (14px from the window, 40px radius), deep forest radial gradient with sand and mist glows and grain. Title in the display face with the serif accent ("Where the *waiting* goes"), one caption, a glass button with a forest arrow disc. The zoom is a scrubbed clip-path from inset to full bleed; content scales 1.32 and fades; the card washes to the first room colour and dissolves into the pinned story.
- **Station tile** replaces the ticket: name and numeral, picture pad, waiting count with a ring stack (max 12, then "+n"), optional "was n", one chip. Fixed shape everywhere. Highlight = forest ring and an 8px lift. Step back = translucent card and faded picture, never faded text.
- **Track:** a hairline with three stop ticks under the tiles and a forest order dot; or a 6px rush bar in the queue colour. Caption in a glass pill under it.
- **Glass material** (`.glass` in `globals.css`, components layer so utilities win): white 50% to 26% vertical veil, blur 18px with saturation 170%, inset top highlight, soft shadow, and a 1px gradient rim (bright at the top left, fading along the sides). Only on floating chrome. `.glass-dark` for glass on the forest hero.
- **Motion tokens:** `--ease-out` (0.23, 1, 0.32, 1), `--ease-in-out`, `--ease-drawer`. Press feedback `press` utility: scale 0.97 on `:active`. UI transitions are CSS transitions (interruptible); GSAP owns scroll-driven motion only.
