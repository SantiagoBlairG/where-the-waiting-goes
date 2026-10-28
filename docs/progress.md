# Progress

Last updated: 2026-10-28

## Where we stopped (resume here)

- **Pushed:** phases 0 to 5. **Local only, not pushed:** the Phase 6 self-testing commits, the Fixa-style pass, and the v4 simplification pass with the welcome hero (see the last section). Vercel is connected but this repo is **not** deployed or linked; deploy only when asked.
- **To run it:** `npm ci`, then `npm run serve` (production build at http://localhost:4173, what we judge). The Claude preview config `prod` runs the same thing. The pinned scroll story (and the hero zoom) need a window at least 900px wide and 660px tall; narrower or shorter windows and reduced motion get the plain layout.
- **To check it:** `npm run typecheck && npm run lint && npm test` (66 unit tests), `npm run test:e2e` (34 pass, 12 skipped by design), and the QA sweeps `npm run qa:layout`, `qa:a11y`, `qa:contrast`, `qa:keyboard`, `qa:perf` against `npm run serve` (see `tests/qa/README.md`).
- **Open:** the comprehension gate with a new person; Safari and Firefox; a real phone; a screen reader; Impeccable audit and Taste review on the v4 design; regenerate `docs/screenshots/`; Phase 7 (README, handoff, deployment instructions). The client said nav and chapter-dot micro-interactions will be discussed further.
- **The client's design preferences** (keep them): calm green palette (stone, mist, sage, sand, forest; ember only for queues); Bricolage Grotesque for titles and numbers with an Instrument Serif italic accent word, Plus Jakarta Sans for body; every illustration inside a card; generous padding; no text overlap at any size; the story must be easy to follow above all; liquid glass on floating chrome; native scrolling (no smooth-scroll hijacking).

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

## Phase 5 — Comparisons and explanations: DONE (2026-10-27)

The exit test is that a visitor can explain why an extra cashier and an extra barista give different results. Every explanation is generated from the model's own numbers (`src/experiment/analysis.ts`, 8 tests), so the words cannot drift from the simulation.

- **Fixed demand, same staffing, slowest step:** the comparison opens with three plain statements. The demand is fixed (an order every 20 seconds, 3 a minute, in every setup). The staffing is not (the original team has three people, the other two have four, so compare those two with each other). Only the slowest step counts (an extra person elsewhere just moves the wait).
- **Where the waiting went:** a bar per setup splitting average wait by station, with the numbers written beside each bar (never colour alone). The original team waits 58 s at the register and 87 s at the drinks. The extra cashier's bar is the same length with all 145 s at the drinks. The extra barista's bar is 58 s at the register only. This is the story's reveal, shown in data.
- **The emerging ordering constraint:** each setup card lists every station's capacity against the 3 a minute arriving, marked "keeps up" or "falls behind". With an extra barista, drinks go to 4 (keeps up) and the register stays at 2.5 (falls behind), which is why a line remains there. The live insight under the focused ticket says the same in one sentence.
- **What happened, per setup:** three generated sentences (what limits it; how the waits changed against the original team; how many orders are picked up by 10:00 compared with the original, for example "23 orders are picked up by 10:00, 5 more than the original team").
- **Finished-run summary** (`RunSummary.tsx`): appears only when a run completes, because only then is the all-30 average honest. It shows picked up by 10:00, the all-30 average, the last pickup, where orders waited and the slowest step. A custom run is explicitly not compared with the presets (the worker moved during the run). A finished Extra barista run reproduces the independent full-run numbers exactly (23, 2:07, 12:45).
- **Progressive disclosure review:** the comparison, every order and how it works stay behind buttons or dialogs; there are three headline metrics only; the so-far average is one short secondary line that says it is not the full-run average; one insight at a time under the focused ticket; the finished-run summary appears only at the end. The setup chooser, assign control and capacity previews are always visible by design because they are the controls.
- **Tests added:** 8 unit tests for the analysis and 4 end-to-end tests (the comparison's three ideas, bars and generated sentences; hidden until asked and unaffected by a custom run; a finished custom run played through a fake clock; the ordering constraint). Totals: 63 unit tests, 33 desktop end-to-end tests, 19 passing and 14 intentionally skipped on the phone emulation. The finished-run test takes about a minute because it plays the whole rush through a fake clock.

Not done or not checked: a person has not yet been asked whether they can explain the difference from the page alone (the comprehension gate). Contrast numbers for the new panels, 200% zoom and a performance profile of the full workspace are still unchecked.

## Phase 6 — started: self-testing with the playwright-skill (2026-10-27)

The client asked me to test the site myself with the Playwright skill (github.com/lackeyjb/playwright-skill, MIT, installed per project in `.claude/skills/playwright-skill`; its setup downloaded a headless Chromium). Scripts live in `tests/qa/` (`.cjs`, because the project is ES modules) and run with `npm run qa:layout | qa:a11y | qa:contrast | qa:keyboard | qa:perf` against the production server (`npm run serve`, port 4173). They run headless; the skill defaults to a visible browser, which I did not use. See `tests/qa/README.md`.

What the testing covered and found:
- **Layout, as a visitor** (`explore.cjs`): real mouse-wheel scrolling through the whole page with a pause at every stop, at 1440x900, 1920x1080, 1366x768, 1100x700, 1024x768, 768x1024, 600x800, 390x844, 320x640 and 720x450 (about what 200% zoom of a laptop window leaves), with and without touch. It checks overlapping text per line of text, text outside the window, page-level horizontal scroll, tap targets under 36px, console errors and failed requests. Result after fixes: no overlap, clipping, small targets, console errors or failed requests at any stop. Fonts load (Plus Jakarta Sans, Bricolage Grotesque).
- **Real defects found and fixed:** (1) on phones the comparison label and its sentence were one paragraph mixing 24px and 16px type and wrapped tightly; they are now separate blocks that sit side by side on wide screens and stack on phones. (2) In the gap under the floating run bar, slivers of content peeked out; a soft fade now sits behind the bar. That fade first overflowed the column and caused page-level horizontal scroll in narrow desktop windows. The end-to-end suite caught it (my exploration script had only tried phones in touch mode); it is now contained and the section also clips horizontal overflow. (3) Contrast: the dimmed "up next" ticket dropped small text to 3.7:1, so it is now dimmed less (85%); the ghost "?" for hidden counts is darker; the primary button hover was lightened to 4.4:1 and now darkens. (4) Four `aria-label`s on plain spans (not allowed) became real hidden text. (5) The opening had two "Skip to experiment" tab stops in a row; the on-screen one is now mouse and touch only.
- **Accessibility, axe-core 4.14** (`a11y.cjs`, WCAG 2 A and AA, 2.1, 2.2 AA and best practice): zero violations on the whole page in the plain layout (1440 and 390 wide), with the comparison panel open, with the station dialog open, with the orders dialog open, and on the pinned layout (structure only). Axe could not compute colour contrast for about 130 to 225 elements per state because of the soft glows and grain, so contrast is **not** proven by axe.
- **Contrast, my own check** (`contrast.cjs`): blends every visible text style over its nearest solid background (opacity included) in four states (page, comparison open, workspace running, dialog open). 247 distinct text styles: no failures and nothing borderline against 4.5:1 (3:1 for large text). It is an estimate, because the faint glows and grain are ignored.
- **Keyboard only** (`keyboard.cjs`): 29 tab stops, every one with a visible focus indicator, every one named, none off screen. Without a mouse: choose a setup, assign the worker, Play, Pause, open "Look closer", focus stays trapped in the dialog, Escape closes it, focus returns to the button, the focus rail moves with Home.
- **Performance and memory** (`perf.cjs`, headless Chromium on this computer): scrolling the whole pinned story and a live run at 10x show no frame over 50 ms and no long task at normal speed; with a 4x CPU slowdown the scroll has 8 frames slightly over 50 ms (worst 67 ms), the live run none. 40 extra restart cycles grew the JavaScript heap by 0.4 MB and the page by no elements, so no leak of figures or listeners.

What this does not cover (still open): any test in Firefox or Safari (Chromium only); a real screen reader (axe and the keyboard run are not the same as listening to one); real phones and touch dragging (emulation only); judging motion by eye in real time (frame timing only); the comprehension gate with a person unfamiliar with the project; the Impeccable adapt, harden, audit, optimize and polish commands and the Taste visual review, which have not been run in this phase; a 200% browser zoom (approximated by a 720x450 window); WCAG 2.5.8 target size is checked only as "under 36px" in the sweep.

Housekeeping: `docs/qa/` (generated screenshots, about 56 MB) is git-ignored; `docs/screenshots/` is 17 MB of committed PNGs and could be compressed. New dev dependency: `axe-core` (MIT).

## Next: Phase 6 — Refinement and verification (remaining)

Impeccable adapt, harden, audit, optimize, then polish; a Taste visual review without restarting the design; remove effects that distract from the process; verify accessibility, model correctness, responsive layout and lifecycle; clean install, typecheck, lint, tests, end-to-end tests and a production build.

## Style pass from the fixaplan.com reference (2026-10-27)

Done: serif italic accent words, lighter headline type, floating pill nav (skip link kept first), rounded overlapping sheets, flat cards. Verified on the production build: typecheck, lint, 63 unit tests, 52 end-to-end passes (14 skipped by design), axe 0 violations, contrast audit no fails (249 styles), keyboard walk passes, layout sweep clean at 1440x900, 1100x700, 390x844 and 320x640. The sweep ignores the opaque nav as an overlay, like the run bar; scrolling text passes under it by design. Not done: scroll-triggered stat bars, a photo hero, a dark finale; real sticky stacking of the pinned story's sheets (only the overlap is in). Not re-run since this pass: perf script.

## Simplification pass (v4) with a welcome hero (2026-10-28)

Client asked for: a hero card the camera zooms into, a story about 90% simpler, a calmer experiment without the up-and-down comparison, consistent card sizes, and liquid-glass chrome. Brief, findings and principles: `docs/redesign-v4.md`. Skills used: Emil Kowalski's (installed this session; easing tokens, press feedback, transitions not keyframes for UI, transform-only motion, glass rules from apple-design), plus the playwright-skill for every check.

Built:
- **Hero** (`src/story/Hero.tsx`): a full-width rounded forest card with the title, one caption, a "See the story" glass button and a small picture of orders piling up before the middle stop. Scrolling scrubs the zoom: the card grows to the window edges, the words rush past, its green washes to the first room and it dissolves into the story, which is already pinned underneath. The button drives the same zoom (GSAP ScrollToPlugin). Phones and reduced motion get the same card as a first screen; the button scrolls to the story.
- **One stage for the whole story** (`frames.ts`, `StoryStage.tsx`, `StationTile.tsx`): the same three tiles at the same size from the first chapter to the experiment (the first chapter shows only the first tile, in its final place). A tile shows its name, picture and the waiting count; anything else is one chip on the beat that is about it. Fix and surprise are "was 4 → 0" and "was 5 → 9" on one tile instead of a 2 x 3 grid. Tiles a beat is not about step back (translucent card, faded picture, text at full contrast). On phones those tiles are hidden, so each chapter shows only the tile it is about.
- **Progress in one fixed place:** the speech-bubble notes are gone. A track under the stage holds the traced order (a dot that glides between the three tiles with the scroll) or the ten-minute rush bar, plus one caption in a glass pill. The rush beat is shorter (3.2 screens, was 5) and shows three numbers instead of about forty.
- **Experiment** (`Experiment.tsx`): three setup tabs, the same tiles (now with "1 person" / "2 people"), one run bar. A finished run writes its result on its tab, so after three runs the comparison is the three tabs side by side. The result card explains the run from the model's numbers and offers the next setup. Tapping a station opens its details. Runs play at 30x (about 30 seconds). Play scrolls the stage into view so the bar never covers the numbers.
- **Glass:** nav pill, chapter rail (a single indicator slides and stretches to the current chapter; labels in glass), the hero button, the caption pill, unselected setup tabs, the run bar. Solid fallback under `prefers-reduced-transparency`.
- **Removed:** opening card, floating notes, rush clock headline and counters, compare grid, bench and rewind, focus rail, drag-and-drop bench, assign-worker panel, stat tiles, comparison panel, speed toggle, orders table dialog (`git rm` of 9 files).

Verified on the production build (2026-10-28): typecheck and lint clean; 66 unit tests (new `frames.test.ts`); Playwright 34 passed, 12 skipped by design (desktop and Pixel 7), including the hero zoom, the call to action, every beat's one idea, reverse scroll, the chapter rail, the phone single-tile rule, and all three runs with their results on the tabs (fake clock). Layout sweep: no overlapping or clipped text, no tap target under 36px, no console errors at 1440x900, 1920x1080, 1366x768, 1100x700, 768x1024, 720x450, 390x844 and 320x640 (touch and not). axe: 0 violations in six states. Contrast audit: no fails (140 text styles; hero text on its gradient is skipped by the script and was checked by hand against the darkest and lightest stops). Keyboard: all stops named and visibly focused, the experiment fully operable. Performance: no frame over 50 ms at normal speed; heap grew 0.5 MB over 40 restarts.

Not verified / open: Safari and Firefox (and `backdrop-filter` look there); a real phone; a screen reader; the comprehension gate with a new person; the Impeccable audit and Taste review were not formally run this pass (Emil's review checklist was applied instead); `docs/screenshots/` still shows the old design (regenerate with `CAPTURE=1 npx playwright test story --project=desktop`). The perf script's labels still say 10x for the live run.
