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

## Redesign pass after client feedback (2026-10-27)

The client judged the first Phase 3 build "terrible in every way": generic type, white cards and a lot of white space, choppy motion, text reveals that did not appear to work, no colour or depth. They also asked whether the front-end design skills were really being used. Honest answer: they were used lightly (Taste's copy rules and idea step, Impeccable's init), and the plan's restrained off-white direction was followed too literally. This pass loads `frontend-design` properly, plans against its defaults, and replaces the visual layer. See "Redesign" in `DESIGN.md`.

What was found and fixed:
- **Why reveals "did not work":** the preview pane is narrower than 1024px, so the visitor only ever saw the plain fallback layout, which had no reveals or scroll effects at all. The pinned experience now starts at 900px wide, and the fallback has its own scroll reveals, ticket entrances and ring parallax.
- **Why it was choppy:** the preview ran Vite's development build (React's dev runtime alone was about 1.7 s of CPU in a 160-step scroll at 4x throttle), on top of expensive paint work (a hover glare repainting a masked, blur-shadowed ticket on every pointer move, and blur filters re-running on every count change). Fixes: judge the production build (`npm run serve`, preview config `prod`), glare is now a translated gradient, shadows are static elements, tilt rectangles are cached, scenes are memoized, and GSAP follows the wall clock instead of crawling when frames are sparse.
- **Measured** in headless Chrome with CPU throttling, same scripted scroll (160 wheel steps plus pointer moves): production at 1x p95 14 ms, no frames over 50 ms; at 4x p95 28 ms; at 6x p95 49 ms (was 98 ms in dev); at 12x p95 119 ms. This is better, not perfect: at 6x and 12x slowdown frames over 50 ms still occur (33 and 134). The remaining cost is mostly browser style, layout and paint work in the pinned room.
- Not yet looked at by the client in a wide window. The in-app preview pane is often narrower than 900px, so use a normal browser window (or widen the pane) to see the pinned version.

## Phase 3 — Complete the scroll story: DONE (pending a human comprehension check)

- [x] Pinned story (`src/story/StoryExperience.tsx`) on screens at least 900px wide and 520px tall with motion allowed: one sticky stage, scroll position maps to a beat (`src/story/timeline.ts`, pure and tested). React state changes only on beat, rush-step or traced-stop changes, never per scroll pixel.
- [x] Scroll drives real content: in the rush beat the simulated clock follows the scroll through 31 engine snapshots (the line visibly grows, dots pop in); in beat 2 one order dot glides between the three cards and the cards say where it has been.
- [x] Text reveals: headlines slide up word by word from masks and exit the other way when scrolling back (`RevealText`). Supporting lines rise and fade in.
- [x] Depth and hover: cards on a GSAP-driven arc with perspective, pointer-linked tilt and per-card parallax; cards lift on hover and focus (CSS, on the card, not the GSAP wrapper); Hairline figures answer the pointer; chapter rail with labels on hover and focus.
- [x] Beat 4 shows the replay explicitly ("Replay the same rush with an extra cashier", a rewind icon turns) and holds back downstream counts so beat 5 can reveal them. Beat 7 rewinds the clock to the start and says "Start of the rush. Paused." while the extra worker steps onto a bench.
- [x] Reverse scroll restores the same state (unit test on the mapping, and an end-to-end check that the rush clock reads the same going forward and back).
- [x] Static route (`StoryStatic`) for phones, tablets and `prefers-reduced-motion`: every beat as ordinary sections with all text and states. Pinned mode exposes the story as plain ordered text for screen readers and hides the decorative pane. Keyboard skip link is the first tab stop.
- [x] Short windows: each scene scales down a little when it would not fit.
- [x] Screenshots at true size in `docs/screenshots/` (1440x900, plus a 390px opening). Regenerate with `CAPTURE=1 npx playwright test --project=desktop`.
- [x] Checks: 29 unit tests, 5 end-to-end tests (all seven beats with their words and numbers, reverse scroll, no console errors, no horizontal scroll, skip link by mouse and keyboard, 390px static story, reduced-motion route), typecheck, lint, build.

### Honest notes (Phase 3)

- **The comprehension test has not been done by a person.** This is the gate before Phase 3 can be called finished. Please show the page to someone unfamiliar and ask the four questions in `docs/storyboard.md`.
- Motion quality has been judged from stills and from tests of end states, not by watching real-time playback. Easing, tempo and the feel of the scroll still need a human look in a normal browser, and the user has asked for a high bar: plan on a refinement pass (Impeccable polish and a Taste visual review are scheduled for Phase 6).
- Not verified: touch and trackpad momentum behavior, 1024x768 and 1366x768 in a real browser (the fit-to-height scaling was measured in a 1024x700 window: beats 2 to 5 fit with at least 6px to spare; beat 7 still measured about 16px over the bottom of its area, so on windows that short its cards may touch the footer caption. Needs a fix in Phase 6), 200% zoom, a profile of a full scroll pass, memory over repeated passes.
- The pinned layout depends on viewport height. Below 560px tall, or under 1024px wide, visitors get the static story instead.
- GSAP's lag smoothing makes animations crawl when a browser pane throttles `requestAnimationFrame`. It is left at its default for visitors. `window.gsap` is exposed in development only, for checks.
- The old static page is still the mobile experience, so it has none of the pinned motion beyond CSS pop-in on dots and hover lift.
- Beat 3's replay row and the rewind are timed by beat change, not scrubbed, so they play once per entry.
- The interactive workspace, Look closer dialogs, worker drag, and playback do not exist yet (Phase 4). The bench in beat 7 is a picture.

## Next: Phase 4 — Unlock the interactive workspace

Reuse the story stage, add scenario selection, clock and playback, reset, live metrics, worker drag and drop with the keyboard and touch alternative, busy-worker transfer display, bounded card focusing, detail dialogs, and a `useExperiment` controller on top of the engine.
## Second design pass (2026-10-27)

Done after the client's second round of feedback; details in the "Second design pass" section of `DESIGN.md`.

- [x] Palette from the client's green reference; calm rooms; ember reserved for queues and pressure.
- [x] Opening illustration inside a card; worker badge from Lucide `user-round`; active-ticket state replaces the floating dot; Plus Jakarta Sans for body text; roomier padding; counter band and footer removed; tickets end 7% of the viewport above the bottom.
- [x] Designer review fixes: hidden-count tickets centred instead of empty, opening card anchored right, bench no longer steals 24px from the ticket row, "up next" ticket less washed out, stacked illustrations larger on narrow screens.
- [x] Checks: 29 unit tests, 5 end-to-end tests, typecheck, lint, build. Screenshots in `docs/screenshots/` (1440x900 and 800px wide).

Open items:
- The four Pinterest references could not be read by tooling; style, scroll, hover and movement ideas from them are not yet applied. Screenshots would fix that.
- The client's last message was cut off after "Can you"; the request is unknown.
- Still not checked: touch behaviour, 200% zoom, keyboard pass over the tickets, contrast numbers for every ticket combination, performance profile of the new background glow tween.

## Overlap fix (2026-10-27)

Client reported text overlapping on some beats (the comparison label ran into the subtitle). Cause: the stage began at a fixed 31% of the window height, but the headline plus subtitle is taller than that in shorter windows. Fixes: the stage now starts below whichever text group is showing (measured on every beat, on resize and when fonts load); headline and subtitle sizes follow the window height as well as its width; the pinned story now needs a window at least 660px tall (shorter ones get the plain layout); comparison tickets are slightly more compact. New end-to-end test `no overlapping text in the pinned story` checks, at 1440x900, 1280x720, 1100x700 and 960x680, that on every beat the stage starts below the text and stays inside the window. Run against the previous code it fails at three of the four sizes, so it detects the bug.

## Overlap, spacing and pacing pass (2026-10-27)

Client: some slides still overlapped text, some content sat too close to the text, some scroll sections were too fast, and the order-progress beat needed to be slower with a floating note explaining each step.

- **Overlap:** the stage position was measured once per beat, so any later reflow of the headline (a font finishing loading, a wrap change, a resize) left it stale. It is now re-measured by a ResizeObserver on every text group plus resize and font-loading events. The gap between text and stage is about 4.5% of the window height (at least 36px) and the scene fit leaves 32px of slack. The overlap test now also runs at 1752x666 and 1920x1080 (six sizes in all, every beat). A settled-state sweep of 30 window sizes between 900x660 and 1920x1080 found no overlap; the transient cause could not be reproduced in the sweep, so the observer fix is the evidence-based remedy, not a confirmed reproduction.
- **Pacing:** scroll length per beat went from [1, 1.2, 2.6, 1.3, 1.2, 1.3, 1] to [1.1, 2.4, 5, 1.8, 1.8, 2, 1.2] screens. The rush now takes five screens (about 150px of scroll per 20 simulated seconds) and the three-stops beat gives each stop about half a screen.
- **Floating notes** (`src/story/stepNotes.ts`, `FloatingNote`): in the three-stops beat one note per stop; in the rush one note per phase of the clock (first order, a line at the register, a second line for drinks, pickup keeps up, both lines grow, the last orders, ten minutes in). Each note sits above the ticket it is about with a tail pointing at it. All numbers come from the model constants or the snapshot, and a unit test checks every claim against the engine (for example that pickup never has a line).
- The rush totals (picked up, still in the shop) moved under the clock to free vertical space for the note.
- Fixed a rounding bug: `locate(1)` returned 0.9999999999999994 for the end of the last beat with the new weights.
- The Phase 3 note about total scroll length is now 15.3 screens.

## Phase 4 — Unlock the interactive workspace: DONE, with gaps listed below (2026-10-27)

What exists (`src/experiment/`, mounted after the story in `App.tsx`; `#experiment` and every "Skip to experiment" link point at it):

- **Session model** (`session.ts`, pure, 17 tests): modes paused, running, complete; presets reset to t=0 and pause; Restart keeps the chosen allocation and turns a pending move into the starting allocation; Play, Pause, speed 10× or real time; a dialog *holds* the run and releases it without starting a paused one; a stalled frame cannot make the run jump (real time is clamped per tick); the same finished run at either speed and any frame size; moving the worker labels the run "Custom · based on <preset>" and records the action and time; presets are immutable; a custom run never inherits a preset's result.
- **Controller** (`useExperiment.ts`): feeds the session from animation frames only while running, pauses on a hidden tab with no catch-up, announces assignments for screen readers.
- **Workspace** (`Experiment.tsx`): setup chooser (radio cards) with the "restarts the rush, paused" note; three tickets with Look closer buttons, focus highlight, and a whole-lane button over the order dots that opens the orders list; the extra worker's bench with a GSAP Draggable badge (8px threshold, drop on a station to assign, on the bench for off duty, anywhere else snaps back and changes nothing); valid stations highlight while dragging and the one under the pointer previews "Capacity if assigned"; busy workers show "Finishing this order, then moving to X" and the destination "Extra worker arrives after this order"; the "Assign extra worker" radio group is the full keyboard and touch alternative; Play/Pause, Restart this setup, speed, clock; three headline metrics (Completed of 30, Still in the shop, Active workers) with the so-far average as secondary text and a warning that it is not comparable with full-run averages; a contextual insight under the focused ticket; Previous/Next focus buttons.
- **Details on demand** (`Dialogs.tsx`, Radix): station detail (service time, workers, queue versus in service, the capacity calculation), orders list (every arrived order with arrival time, where it is now, wait at each station, completion), and "How this works" (assumptions). The run is held while any is open and focus returns to the button that opened it (a bug the end-to-end test caught: Radix returns focus only to a DialogTrigger, ours open from code).
- **Full-run comparison** (`ComparisonPanel.tsx`): the three presets each run to the end in a fresh simulation, labelled "Full-run model results", independent of the live run, showing 18/18/23 picked up, 3:34/3:34/2:07 averages, last pickups 15:39/15:39/12:45, waits per station, and "the original team has three people".
- **Pause rules:** scrolling the workspace out of view pauses the run and keeps it (Play resumes).
- Also this round: station tickets carry optional workspace props; the story's chapter rail now hides once the pinned story has scrolled away.

Checks: 55 unit tests (22 in `src/experiment`), 23 end-to-end tests on desktop (twice, no flakes) and 11 passing plus 12 intentionally skipped on the phone emulation. New `tests/e2e/experiment.spec.ts` covers the start state, keyboard assignment, setup reset clearing the Custom label, Play and Pause, Restart, the dialog hold, Escape and focus return, the orders list, the full-run fixtures, no horizontal scroll, and mouse drags (valid drop with the capacity preview, invalid drop, drop on the bench).

Gaps against plan.md §8, stated plainly:
- **No card rail.** Focus changes with the Previous/Next buttons or by clicking a ticket. There is no draggable, snapping, bounded rail, and the workspace tickets are flat, not on the story's shallow arc.
- **Order dots are not individually clickable.** The whole dots lane opens the orders list instead (larger target, same information).
- **Touch drag is untested.** Dragging was tested with a mouse; touch visitors have the assign control, which is tested.
- **Not end-to-end tested:** the hidden-tab pause, the scroll-out pause, and the story-to-experiment handoff as one flow (the session rules for them are unit-tested).
- **Phone layout:** the Play button and clock sit well below the three stacked tickets, so a phone visitor scrolls between them. A compact sticky run bar would fix it but needs distinct control names to avoid duplicate buttons; not done.
- **Handoff:** the pinned story's last beat rewinds the clock, then the workspace follows below as its own section starting at 0:00, paused. It is not the same stage "settling in place".
- Contrast numbers, 200% zoom, and a performance profile of a full run are still unchecked.

## Phase 4 gaps closed (2026-10-27)

- **Focus rail** (`FocusRail.tsx`): a dedicated handle on a three-stop rail (6px movement threshold), bounded with no wrap-around, snapping to the nearest stop on release; arrow keys, Home and End on the handle (it is a labelled slider), Previous and Next buttons, and clickable station names. The rail freezes while the extra worker is being dragged. The workspace tickets now sit on the story's shallow arc: they lean away from the focused ticket (4 degrees a step, outer tickets 12px lower) and the lean follows the handle while it is dragged and settles on release. Default focus is Make drinks so the arc is symmetric; the insight under the focused ticket follows the focus.
- **Run bar**: Play/Pause, Restart this setup, the clock and the speed choice now live in one bar that sticks to the bottom of the screen while the workspace is in view, at every screen size (previously Play sat far below the tickets on phones). It is the only copy of those controls, so there are no duplicate buttons. A skip link ("Skip to run controls") jumps to it, because it is last in the page order.
- Tests added: rail keyboard and bounds, clicking a station name, Previous and Next, dragging the handle to both ends, the arc leaning and settling, Play and Restart staying in view while scrolling, and the skip link. 29 desktop end-to-end tests pass (14 intentionally skipped on the phone emulation, 15 pass there).
- Still not covered by an automated test: the rail freezing during a worker drag, touch dragging of the rail handle, and the arc under reduced motion.

## Next: Phase 5 — Comparisons and explanations

Mostly present already (full-run comparison, insights, order journeys, methodology). Remaining: check that detail is revealed progressively, add an explanation of fixed demand and the emerging ordering constraint (why an extra barista leaves a line at the register), and make the cashier-versus-barista comparison explanation explicit.
