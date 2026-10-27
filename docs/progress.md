# Progress

Last updated: 2026-10-27

## Phase 0 — Establish the project: DONE

- [x] Inspected folder; only `plan.md` and skill installs existed. `plan.md` untouched.
- [x] Skills installed (project scope, one route each); revisions recorded in `docs/dependencies.md`.
- [x] Vite + React + TypeScript scaffolded via a temp folder; `@/` alias in `tsconfig` and `vite.config.ts`.
- [x] Tailwind v4 via the Vite plugin; tokens in `src/styles/tokens.css`; Geist bundled.
- [x] shadcn/ui initialised (radix-nova) and remapped to project tokens. Only `button` is installed so far.
- [x] Scripts: dev, build, preview, typecheck, lint, test, test:e2e.
- [x] `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`, `docs/*` written.
- [x] Verified: `npm ci`, typecheck, lint, 1 smoke test, production build all pass.

### Honest notes

- `PRODUCT.md` was filled from plan.md without a live interview, because the plan already answers the init questions. Every fact is traceable to the plan.
- Tests so far: an App smoke test and a station-capacity test. The simulation engine and its fixtures do not exist yet (Phase 2).
- Playwright config exists, but no e2e tests are written yet, and `npm run test:e2e` has not been run.
- The project folder is inside OneDrive. `node_modules` here syncs slowly and can cause file-lock errors; consider moving the repo outside OneDrive or excluding `node_modules`.
- Color contrast of token pairs is not validated yet.
- Impeccable `init` was done by reading `reference/init.md` and following it, not by the `/impeccable init` slash command (the skill loads after a session reload). Optional: run `/impeccable init` after reloading to let it also configure live mode.
- The Impeccable hooks and `.claude/settings.local.json` are git-ignored; see `docs/dependencies.md`.

## Phase 1 — Storyboard and visual direction: DONE (pending a human comprehension check)

- [x] Seven beats written with exact copy: `src/story/storyBeats.ts`, summarised in `docs/storyboard.md`.
- [x] Static sequence built (`src/story/StoryStatic.tsx`): opening, three stops, rush, fix, surprise, reveal, handoff. No scroll animation yet.
- [x] Shared pieces built for reuse: `CoffeeStage`, `StationCard`, `OrderDot`, `Worker`, three isometric illustrations.
- [x] Checked in the browser at 1024px and 390px wide, and for horizontal overflow at 320px. No overflow; headlines fit.
- [x] Verified the plan's fixtures with a throwaway script (not the real engine). All matched.

### Honest notes (Phase 1)

- The story numbers in `src/story/storySnapshots.ts` are hard-coded from that throwaway script. Phase 2 must replace them with engine output and test them.
- The Taste skill's direction draw and inspector were not run; Impeccable shape/clarify/critique were applied by reading their instructions, with the plan standing in for the interview. No automated design inspection has been run yet.
- The narrative acceptance gate needs a real unfamiliar reader; only a self-check is done.
- Not yet checked: 1440x900 and 768px screenshots in a clean viewport, 200% zoom, keyboard-only pass, reduced motion (nothing animates yet), color contrast numbers.
- The "Look closer" button, scenario selector, playback and the worker drag are not present (Phases 3 and 4). The bench in beat 7 is a static picture.

## Phase 2 — Story assets and truthful snapshots: DONE

- [x] Pure TypeScript engine in `src/simulation/` (`engine.ts`, `metrics.ts`, `presets.ts`, `config.ts`, `types.ts`): event queue, integer milliseconds, the plan's same-timestamp order, worker moves (idle moves at once, busy finishes first, latest choice wins, off duty), `snapshotAt` and `runToCompletion`.
- [x] `engine.test.ts`: all three preset fixtures match exactly (completed 18/18/23, still inside 12/12/7, means 214/214/127 s, last pickup 939/939/765 s, queue waits 58/87/0, 0/145/0, 58/0/0), 69 s service per order, conservation every second for every preset, FIFO, no arrivals at or after t=600, identical results however time is batched, presets immutable, and the worker-move rules.
- [x] `storySnapshots.ts` now calls the engine. `storySnapshots.test.ts` checks that the numbers quoted in the beat copy match engine output.
- [x] Hairline: kernel vendored as an ES module (`src/illustrations/hairline/kernel.js`, unchanged apart from one export line), a React host (`HairlineFigure`), and three coffee figures written to Hairline's rules: register, espresso station, pickup shelf.
- [x] The figures respond to live state: the espresso station shows one ticket per waiting order (up to nine) and lowers its group head while a drink is made; the register opens its drawer and prints a receipt while serving; the pickup shelf lifts a cup being handed over. All three answer the pointer with springs.
- [x] Old placeholder SVG illustrations deleted. Opening scene uses the Hairline register.

### Honest notes (Phase 2)

- Hairline's own `look.mjs` / `validate.mjs` checks were **not** run: they assume one standalone HTML figure on its bench. The figures were checked by eye in the browser pane (1100px wide), by a scripted pointer test (hover changes the drawing, leave returns it, one thing bright at a time), and for console errors (none).
- `hairline-create`'s concept-choice step was skipped: the plan already fixes the objects.
- Worker figures stay a small plain SVG (`Worker.tsx`), not Hairline: they must read as people, not scene objects.
- Not yet checked: the figures at 390px and 320px wide, touch behavior (the kernel sets `touch-action: pan-y`), reduced motion (the kernel lands springs at once under `prefers-reduced-motion`; unverified here), contrast numbers.
- The interactive controller (`useExperiment`) does not exist yet; the engine supports it (Phase 4).
- 23 tests pass: 21 simulation, 1 story-copy-versus-engine, 1 App smoke test (plus a station capacity test).

## Next: Phase 3 — Complete the scroll story

Sticky stage, scroll-linked transitions between the seven beats, text reveals, depth and hover effects, reverse scroll, mobile layout, the explicit replay and handoff reset, skip link and reduced-motion routes, then screenshots at opening, rush, reveal and handoff. This is where the motion the user asked for lands.