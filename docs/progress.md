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

## Next: Phase 2 — Story assets and truthful snapshots

Refine illustrations with Hairline, build the pure simulation engine against the plan's fixtures, generate the baseline and cashier snapshots from it, and swap them into the stage.