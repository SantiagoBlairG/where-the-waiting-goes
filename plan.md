# Where the waiting goes — Claude Code implementation plan

> Build a scroll-driven coffee-shop story first, then a single interactive experiment. This file is the product brief, implementation sequence, and acceptance contract. Read it completely before coding.
>
> Planning date: 27 October 2026. This is a fresh project, not a continuation of the earlier Second Purchase/Luma dashboard.

## 1. Outcome and non-negotiable sequence

Help a nontechnical visitor discover why making one step faster does not necessarily make the whole experience faster.

Opening question: **“If ordering gets faster, why doesn’t your coffee?”**

Core reveal: **“We didn’t remove the wait. We moved it.”**

The visitor must experience this order:

1. Enter directly into a readable, illustrated story.
2. Scroll to discover the coffee-shop process and the growing line.
3. Watch an extra cashier clear one queue while another grows.
4. Understand the bottleneck through the animation and a plain-language explanation.
5. Arrive at the same visual system, now unlocked as an interactive experiment.
6. Move one extra worker, run the same rush, and compare three scenarios.

Do not open with a dashboard, settings screen, card carousel, simulation controls, or generic marketing hero. The opening question is part of the story. Do not build the interactive module first and later attach decorative scrolling sections.

The visual experience should be elegant and playful, but comprehension is the primary success criterion. A visitor should be able to say: “Adding capacity at the wrong step just moves the queue. Helping the constrained step improves the whole process.”

The model is an educational illustration, not a forecast for a real café. Label it “A simplified coffee-shop simulation.” AI assists development; a runtime chatbot or AI API is not required. The original challenge image is not included in this file: verify any submission-specific rubric before final delivery rather than inventing requirements.

## 2. Scope

### Required first release

- One continuous page: scroll story followed by one interactive workspace.
- Three process stations: Order & pay, Make drinks, Pick up.
- Three comparable presets.
- One flexible extra worker, draggable between stations.
- Spatial station cards with modest perspective and a focused detail view.
- Order dots that consistently represent customers’ orders.
- Reliable calculations, understandable explanations, keyboard/touch alternatives.
- Desktop, tablet, mobile, and reduced-motion experiences.
- Static deployment; no account, database, backend, or paid API.

### Defer

Demand sliders, menu complexity, worker skill differences, random arrivals, equipment purchases, live data, persistent accounts, audio, WebGL, immersive environments, scenario builders, and social sharing. Do not add these to make the product appear more substantial.

## 3. Reference interpretation

These are inspiration links, not implementation dependencies. Pinterest and Instagram may require login or fail to load. The requirements below are sufficient to build without those services. Do not claim to have inspected inaccessible motion. If local screenshots/videos are available, inspect them before interpreting additional details.

| Reference | Intended contribution | Concrete application |
| --- | --- | --- |
| https://gsap.com/scroll/ | Scroll controls a visual explanation | A persistent stage changes as the visitor scrolls; transitions expose cause and effect |
| https://co.pinterest.com/pin/914019686865063560/ | Storytelling reference supplied by the user | Sequential narrative beats, one idea at a time, visual continuity between beats |
| https://co.pinterest.com/pin/954129871071537685/ | Style, scroll, hover, movement reference | Restrained depth, clear typography, responsive objects, intentional transitions |
| https://co.pinterest.com/pin/616359898996669512/ | Interaction inspiration | Tangible cards, understandable focus changes, details on demand |
| https://co.pinterest.com/pin/498421883783024507/ | Interaction inspiration | Direct manipulation with clear affordances and reversible actions |
| https://www.instagram.com/reel/Deq3PylStBF/?srtk=dDFodmRzbWpxZHJi | Spatial card arrangement discussed with user | Shallow curved card arrangement, drag to focus, tap to inspect; no immersive background required |

The discussed visual references include a fan/arc of cards with perspective and soft shadows. A later direction uses a white page, large centered dark typography, and generous space. Translate those qualities into the coffee story. Do not copy reference marketing text, navigation, pricing, or unrelated content.

**Desired composition:** an off-white stage; a concise headline above; three light station cards on a shallow arc; fine-line isometric coffee illustrations; visible dots connecting the stations. On desktop, all station names and key values remain visible together. Depth must never hide the process.

Earlier liquid-glass/bento ideas are subordinate to this restart. Use solid or lightly tinted surfaces. Large backdrop blurs, busy photographs, and glossy glass over data are not required.

## 4. Skill setup and division of responsibilities

Read the installed SKILL.md and referenced supporting instructions before using each skill. Record source revision/version in docs/dependencies.md. These tools evolve; confirm commands against the installed version. Do not invent slash commands, exports, or skill files.

Install into the project for Claude Code where supported. Choose one installation route per skill, not both a plugin and a duplicate local copy.

### Taste: art direction and composition

Source: https://github.com/leonxlnx/taste-skill

Documented installation:

```sh
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Select Claude Code and project scope in the installer. Current requirements include Node 22+ and Chrome, Edge, or Chromium.

Use Taste in Phase 1 to establish typography, spacing, silhouette, card composition, and visual consistency. Return to it for browser-based visual review once the story works. Its current version supports app screens as well as pages.

**Project override:** this is an educational story plus experiment, with bespoke line illustrations. Preserve the approved direction; do not substitute a randomized aesthetic, photo-led landing page, generic dashboard, or new sections.

### Hairline: simplified, responsive illustrations

Source: https://github.com/lucasmarkes/hairline

Documented skill installation:

```sh
npx skills add lucasmarkes/hairline
```

Use Hairline in Phase 2 to create/adapt the register, espresso equipment, pickup shelf, and worker figures. The repository documents /hairline-create and /hairline-adopt. Read their actual instructions first. Generated standalone HTML must be adapted into reusable project components; do not embed a separate mini-app iframe.

Runtime package, only if the selected implementation requires it:

```sh
npm install @lucasmarkes/hairline
```

Use small pointer responses and fine-line depth. Make operational activity respond to actual simulation state. Check available exports instead of assuming coffee assets exist. Respect its background/plate theming and add app-level reduced-motion behavior.

### Impeccable: product clarity and refinement

Source: https://github.com/pbakaus/impeccable

Documented project installation:

```sh
npx impeccable install --providers=claude --scope=project
```

Reload Claude Code after installation. Review installed hooks and record configuration. Current syntax is /impeccable <command> <target>; standalone /audit-style shortcuts are not assumed.

Use /impeccable init to establish PRODUCT.md, then /impeccable shape for the flow. After the storyboard, use clarify and critique. After functionality, use adapt, harden, audit, and optimize. Use polish last. Keep visual decisions in DESIGN.md.

### Operating rule across skills

The user’s brief and this plan govern scope. Skills improve implementation within it. Resolve conflicting recommendations by preserving story clarity, accessibility, truthful data, and the established visual direction, in that order.

Do not run three independent full redesigns. Taste defines the visual language; Hairline creates the illustrative vocabulary; Impeccable reviews the experience. A skill suggesting more effects is not permission to add them.

## 5. Stack and setup

| Layer | Choice | Reason |
| --- | --- | --- |
| Application | React + TypeScript + Vite | Small, typed, static app with fast local development |
| Styling | Tailwind CSS v4 + CSS custom properties | Shared tokens and responsive composition |
| Accessible controls | shadcn/ui using Radix primitives | Dialog, tooltip, tabs, and buttons; restyle to this design |
| Motion | GSAP, ScrollTrigger, Draggable, @gsap/react | One system for scroll and direct manipulation |
| Illustration | Custom SVG, Hairline where useful | Crisp, lightweight, editable, state-aware |
| Model | Pure TypeScript discrete-event simulation | Deterministic results independent of rendering |
| State | React reducer/context and simulation store | Explicit lifecycle without unnecessary state libraries |
| Verification | Vitest, Testing Library, Playwright | Model fixtures and meaningful interaction tests |
| Delivery | Static Vite build | Can deploy to a static host such as Vercel |

Use Node 24 LTS as the initial development target and npm. At setup, verify compatibility against current official package requirements. Pin the tested Node release, commit package-lock.json, and record exact dependency versions. Do not promise error-free development or silently bypass incompatible peer dependencies.

Scaffold in the existing project directory while preserving this plan:

```sh
npm create vite@latest . -- --template react-ts
npm install
npm install gsap @gsap/react
npm install tailwindcss @tailwindcss/vite
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test
```

If the scaffolder refuses a nonempty directory, create the scaffold in a temporary sibling directory and copy its generated files without replacing this plan. Never select an option that deletes existing files.

Follow the current official Tailwind v4 Vite setup and shadcn Vite installation guide. Configure the @/ alias in both TypeScript and Vite before adding components. Install only controls actually used. Do not mix Tailwind v3 configuration examples into v4.

Required scripts: dev, build, preview, typecheck, lint, test, test:e2e. Use npm ci for clean reproducibility. Use cross-platform npm scripts; avoid Bash-only build commands.

Do not add Next.js, a router, Three.js, React Three Fiber, a second animation library, smooth-scroll hijacking, an external chart library, or a backend without a demonstrated need.

## 6. Design system

Create DESIGN.md and a single token source before styling many components.

### Starting tokens

| Token | Initial value |
| --- | --- |
| Page | #F7F6F2 |
| Surface | #FFFFFF |
| Primary ink | #232A28 |
| Secondary ink | #59645F |
| Fine border | #DADFD9 |
| Active/selected | #176B60 |
| Active tint | #E5F0EC |
| Queue emphasis | #9A541B |
| Queue tint | #FBEDD9 |
| Card radius | 24px |
| Control radius | 12px |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64, 96px |
| Card shadow | 0 16px 40px rgba(35,42,40,0.08) |

Validate contrast in the rendered combinations. Labels, icons, outlines, and patterns supplement color.

Use self-hosted Geist or another explicitly approved sans-serif; one family is enough. Use tabular numerals for changing data. Starting type sizes: desktop opening 64–88px; mobile opening 36–44px; section headline 32–48px; body 16–18px; metric 28–36px; labels at least 12–14px. Fit real text without clipping.

### Component anatomy

Station card, from top to bottom:

1. Step number and station title.
2. Simplified line illustration.
3. Worker slots with clearly distinct worker figures.
4. “Waiting” count and “Capacity” value with units.
5. One short status, such as “Queue growing” or “Ready for the next order.”
6. Explicit “Look closer” action.

Do not make every sub-element another card. Use whitespace and rules inside a station card.

Illustrations use consistent isometric orientation, roughly 1–1.5px strokes at display size, minimal fills, and a common light direction. Keep lines visible on the actual surface. Include an accessible text equivalent; decorative SVG paths are hidden from assistive technology.

### Motion vocabulary

- Hover/focus response: 140–200ms; lift at most 4px.
- Focus/card transition: 300–450ms.
- Worker drop: 200–300ms with clear snap.
- Detail expansion: 300–450ms; reduced-motion version immediate or short fade.
- No elastic overshoot, perpetual card bobbing, spinning scenes, or unnecessary particle bursts.
- Scroll progression controls narrative motion. Hover never advances the story.
- No two animation engines write the same element’s transform.

## 7. Story specification — implement before the interactive workspace

### Layout and progression

Use ordinary browser scrolling. Desktop: a sticky illustration stage with adjacent or overlaid narrative sections; each section contains real semantic text. The illustration changes with section progress. Use seven meaningful beats, approximately one viewport per beat initially, then tune based on readability. Avoid long stretches of empty scrolling.

On narrow screens use readable text followed by a shorter sticky/inline stage; all text must remain accessible without motion. Avoid trapping the visitor in an oversized pinned scene.

The first screen immediately presents the question, a customer/order dot, and a coffee cue. Add a modest “Scroll to follow one order” instruction. A small “Skip to experiment” link is available for repeat visitors and accessibility.

### Beat-by-beat storyboard

| Beat | Narrative copy direction | Visual and causal change | Required understanding |
| --- | --- | --- | --- |
| 1. A familiar moment | “8:45. A quick coffee before work.” Then the opening question | One order dot approaches a simple counter; no dense metrics | This is a familiar wait, not an abstract business model |
| 2. One order, three stops | “Order. Make. Pick up.” | Trace that same dot through three named stations; introduce arrows | Every order must pass all three steps |
| 3. The rush | “Now the morning rush arrives.” | More dots enter. Show 30 arrivals over 10 minutes and one worker at each station | Work arrives faster than the café can finish it |
| 4. The obvious fix | “Put another person on the register.” | Compare the same rush with a second cashier. The ordering queue shrinks | Local improvement is real |
| 5. The surprise | “Ordering is faster. Your coffee isn’t.” | Hold overall output equal; highlight the larger drink queue | Work is waiting somewhere else |
| 6. The reveal | “We didn’t remove the wait. We moved it.” | Connect the moved dots to the drinks station; explain that its capacity is still two drinks/minute | The constrained step limits output |
| 7. Your turn | “Where would you put the extra person?” | Same three stations settle into the spatial workspace; controls appear only now | The visitor can test the explanation |

Keep each beat to a headline and, where needed, one short supporting sentence. Reveal labels when their concepts appear. Do not show all metrics in beat 1. Avoid jargon until the reveal: “That limiting step is the bottleneck.”

### Story data and scroll mechanics

Story mode is a deterministic visual timeline, not a running wall-clock simulation. Generate snapshots from the same model used by the interactive experiment. Scroll forward and backward must return to the same state.

For the comparison, label both views “Same 30 orders. Same 10 minutes.” Use baseline versus extra-cashier snapshots at t=600 seconds. Both have 18 completed and 12 still inside. Show changed queue distribution; never suggest customers disappeared.

Make the change of scenario explicit: “Replay the same rush with an extra cashier.” Use a brief reset/rewind visual or clearly labeled comparison transition. Do not silently splice different configurations into one supposedly continuous run.

When the visitor reaches beat 7, reveal the interactive workspace in place. Explain the reset: **“Your turn. Start the same rush from the beginning.”** Reset to baseline at t=0, paused. Keep station identities, illustration style, and process direction continuous. This makes the clock reset understandable without carrying a hidden partially completed simulation into the experiment.

The full output comparison is a later discovery; do not reveal the barista solution before the visitor has had a chance to try.

### Narrative acceptance gate

Before elaborate polish, a person unfamiliar with the project must be able to answer:

- What are the three steps?
- What improved when the cashier was added?
- Why did total time fail to improve?
- What can I try next?

If those answers are unclear, revise text and state transitions before adding effects.

## 8. Interactive workspace

### Spatial layout

One workspace, not a dashboard collection. At desktop sizes, display three station cards in a shallow arc with left-to-right process connectors. Suggested initial rotations: -4°, 0°, +4°; all primary information remains readable. Perspective is CSS only and modest.

Dragging the rail background or a dedicated card header changes focus slightly; release snaps to one of the three station focuses. The process order never changes. Bound movement, avoid an infinite carousel, and keep neighboring station names visible. Provide Previous/Next focus buttons and normal tab access.

A card’s “Look closer” button opens an accessible detail dialog. Desktop may use a large centered panel; mobile may use a full-screen sheet. Preserve station context, trap focus correctly, close with Escape, and restore focus to the trigger. Do not bind the whole card as a button containing other buttons.

### Worker interaction

Each station has one fixed worker. There is one flexible extra worker initially on an “Extra worker” bench beside the workspace.

- Drag the extra worker onto a station to assign them.
- Highlight valid worker slots and show proposed local capacity.
- On drop, commit the assignment and update model state.
- Invalid drop returns the worker to their previous assignment.
- A clear “Assign extra worker” control offers Order & pay, Make drinks, Pick up, and Off duty. This is a complete keyboard/touch alternative.
- During worker drag, freeze card-rail movement. Use a dedicated drag handle and a movement threshold to distinguish click from drag.
- Preview says “Capacity if assigned,” not a fabricated reduction in wait time.
- An idle worker moves immediately. A busy worker finishes the current order before moving; show “Finishing this order, then moving.”
- The pending destination can be changed; latest choice wins. Choosing the current station cancels the move. Going off duty also waits for current service completion.
- Pending workers count at their current station until the transfer happens.
- Orders stay at their actual stations; moving a worker never moves a queue.
- While paused, assignment can change, but a busy worker’s pending move waits until simulation resumes.

Show the extra worker as a small outlined person/token with a handle. It must not look like an order dot.

### Controls and progressive disclosure

Above the cards: compact scenario selector with three descriptive options. Under/near the stage: Play/Pause, Restart this setup, clock, speed, and worker assignment.

Default playback speed: 10× simulated time, labeled clearly; optional 1× for close inspection. Never change results with playback speed.

Show only three headline live metrics: Completed, Still in shop, and Active workers. Show “Average time for completed orders so far” as secondary detail, not as the principal comparison metric.

A compact comparison action opens an inline results view within this workspace. It compares the three predefined runs, not three separate dashboards. If shown before playback finishes, label it **“Full-run model results”**; calculate it independently of the current live run.

One contextual insight appears beneath the focused station. Explain the consequence of the user’s current setup, not generic encouragement. Examples:

- Extra cashier: “Orders reach the drinks station sooner, but drinks still finish at the same rate.”
- Extra barista: “Drinks can now keep up. Ordering becomes the next limit.”
- Extra pickup worker: “Pickup already has spare capacity. Another person here won’t increase output in this model.”

Do not promise no remaining queue after adding a barista: demand still exceeds ordering capacity.

### Details on demand

Station detail shows service time, worker count, capacity calculation, current queue versus in-service count, and one short explanatory example.

Click/tap an order dot to inspect its journey: arrival time, current station, waiting time by station, and completion time if finished. Use an accessible list alternative; do not force users to target tiny dots. Dot controls may have larger invisible hit targets without overlapping neighboring controls.

Explain simulated assumptions through a small “How this works” panel. Keep formulas and implementation jargon out of the main flow.

### Lifecycle

Explicit modes: story, experiment paused, experiment running, experiment complete.

- Selecting a preset resets its run to t=0 and pauses. Explain this next to the selector.
- Moving a worker creates a “Custom · based on [preset]” run and records the action/time.
- Restart this setup clears history and starts at t=0 with the currently requested allocation, paused. Pending transfers become that chosen starting allocation.
- The three preset comparison results remain immutable.
- Opening an order/station modal pauses the run. Closing resumes only if it was running before, and the page is visible.
- A hidden browser tab pauses without catch-up; returning stays paused until Play.
- Complete means all 30 orders have left, not merely that arrivals have stopped.
- Scrolling back into the story pauses and preserves the live experiment. Returning restores it; it does not reset it.
- “Replay story” and “Restart this setup” are distinct actions.

## 9. Simulation contract

### Assumptions

Thirty customers each place one identical order. Arrivals occur at t=0,20,40,...,580 seconds. The admission window ends at t=600; no later arrivals occur. Continue processing until all orders are complete.

Each order visits all three stations in order. Queues are FIFO, service is non-preemptive, travel time is zero, and queue space is unlimited. Each worker handles one order at a time. No breaks, abandonment, batching, randomness, or priority customers.

An additional worker has adequate equipment and workspace; this model does not represent two baristas sharing one constrained espresso machine. Make that assumption visible in the methodology.

| Station | Seconds/order/worker | Capacity per worker |
| --- | --- | --- |
| Order & pay | 24 | 2.5 orders/min |
| Make drinks | 30 | 2 orders/min |
| Pick up | 15 | 4 orders/min |

Station capacity = workers × 60 / service seconds. The smallest station capacity is the long-run system limit, not an exact finite-window completion count.

### Presets and verified fixtures

| Preset | Workers order/drinks/pickup | Total workers | Completed by t=600 inclusive | Still inside at t=600 | Mean arrival-to-pickup, all 30 | Last pickup |
| --- | --- | --- | --- | --- | --- | --- |
| Original team | 1 / 1 / 1 | 3 | 18 | 12 | 214 sec = 3m 34s | t=939 sec = 15m 39s |
| Extra cashier | 2 / 1 / 1 | 4 | 18 | 12 | 214 sec = 3m 34s | t=939 sec = 15m 39s |
| Extra barista | 1 / 2 / 1 | 4 | 23 | 7 | 127 sec = 2m 07s | t=765 sec = 12m 45s |

Additional checks: mean queue waiting by station is 58/87/0 seconds for baseline, 0/145/0 for extra cashier, and 58/0/0 for extra barista. Every order also receives 69 seconds of service.

The extra-barista preset completes five more orders within ten minutes and reduces full-cohort average time by 87 seconds, approximately 41%. The cashier-versus-barista comparison uses the same four-person staffing level. Clearly display that baseline has only three.

These fixtures follow the stated deterministic assumptions. Implement and test against them; do not hardcode UI outputs independently of the model.

### Time and event rules

Use integer simulated milliseconds. Events have stable ordering. At a shared timestamp:

1. Complete all service events.
2. Release completed orders into downstream queues, using order ID to break arrival ties.
3. Resolve pending worker transfers after their current work finishes.
4. Admit external arrivals scheduled for that timestamp.
5. Assign available workers to queued orders FIFO, breaking worker ties by worker ID.
6. Emit a snapshot after all same-time consequences are settled.

Metrics at t=600 include all events at that timestamp. Keep queue count separate from in-service count. Still in shop = arrived minus completed, including both queued and in-service orders.

Store per-order station arrival, service start, service end, and final departure. Store configuration and worker assignment events. Derive metrics from this history.

Use an event queue, not frame-by-frame service counters. Rendering samples the model; skipped frames cannot lose events or change results. Provide snapshotAt(time) for story fixtures and a runToCompletion helper for preset comparisons.

### Honest comparisons

“Average total time” always means arrival through pickup for all 30 orders after draining. An average over only the currently finished orders is biased toward earlier/easier completions; label it separately and do not compare it against final cohort averages.

Do not present theoretical capacity as measured throughput. Do not compare a live custom run partway through with a completed preset without clear timing/cohort labels. A custom reassignment mid-run does not inherit the extra-barista preset’s final result.

## 10. Motion and state architecture

Use one shared CoffeeStage and StationCard composition for both modes, with different controllers:

- Story controller selects precomputed narrative snapshots and scroll transitions.
- Experiment controller advances the live model and handles assignments.
- Presentation layer renders the supplied state without owning business rules.

Keep scroll progress, simulated time, and animation interpolation separate.

GSAP owns outer stage/card transforms. Hairline or custom SVG logic owns designated inner illustration groups. CSS owns hover styles only on wrappers not already transform-controlled. Maintain a motion-ownership note for every animated component.

Use useGSAP/context cleanup and React Strict Mode safely. Register plugins once, remove listeners/tickers on unmount, and refresh scroll measurements after fonts/assets resolve and on relevant resize. Avoid React state updates on every scroll pixel; use refs/timeline progress for visual interpolation.

Render order movement between truthful state anchors. Travel animation is presentation only and cannot delay model service. If the user scrolls quickly, snap to the correct snapshot rather than replaying every missed transition.

On reduced motion: remove perspective travel, pointer tilt, large parallax, and scroll scrubbing. Keep text, snapshots, state changes, and every interaction available. Library-level reduced-motion behavior alone may be insufficient.

## 11. Suggested repository structure

```text
plan.md
CLAUDE.md
PRODUCT.md
DESIGN.md
docs/
  storyboard.md
  simulation.md
  dependencies.md
  progress.md
src/
  app/
    App.tsx
  components/
    ui/
    CoffeeStage.tsx
    StationCard.tsx
    WorkerToken.tsx
    OrderDot.tsx
    StationDetail.tsx
    OrderDetail.tsx
  story/
    StoryExperience.tsx
    storyBeats.ts
    storySnapshots.ts
    useStoryTimeline.ts
  experiment/
    Experiment.tsx
    ExperimentControls.tsx
    ScenarioSelector.tsx
    ComparisonPanel.tsx
    useExperiment.ts
  simulation/
    types.ts
    config.ts
    engine.ts
    metrics.ts
    presets.ts
    engine.test.ts
  illustrations/
    Register.tsx
    EspressoStation.tsx
    PickupShelf.tsx
    Worker.tsx
  styles/
    tokens.css
    globals.css
tests/
  e2e/
public/
  fonts/
```

Adjust filenames if needed; preserve responsibilities. Do not place simulation formulas in UI components.

CLAUDE.md must instruct future sessions to read this plan, PRODUCT.md, DESIGN.md, and docs/progress.md; preserve story-first order; use the skills at their designated phases; run relevant checks; and record remaining work honestly.

## 12. Ordered implementation phases and gates

### Phase 0 — Establish the project

- Inspect existing files; preserve user work.
- Install/read skills and record versions.
- Scaffold and configure TypeScript, linting, styles, tests, and aliases.
- Run Impeccable init using this brief to fill known context.
- Create CLAUDE.md, PRODUCT.md, DESIGN.md, and docs/progress.md.
- Verify a clean install and production build.

**Exit:** application starts; no unresolved dependency or TypeScript errors.

### Phase 1 — Storyboard and visual direction

- Write the seven beats with exact copy and what changes on screen.
- Use Taste for the composition and tokens.
- Use Impeccable shape/clarify/critique to check comprehension.
- Build static beginning, reveal, and handoff compositions using real text.
- Record final choices; avoid presenting endless aesthetic alternatives.

**Exit:** the static sequence tells the story before animation exists.

### Phase 2 — Story assets and truthful snapshots

- Create reusable coffee illustrations with Hairline.
- Build the minimal pure simulation engine and verify preset fixtures. This is data groundwork, not permission to build the interactive UI first.
- Generate the story’s baseline and cashier snapshots.
- Build the shared stage and stationary cards.

**Exit:** illustrations are consistent; data supports the reveal; no invented counters.

### Phase 3 — Complete the scroll story

- Implement sticky layout, seven beats, transitions, reverse scroll, and mobile layout.
- Add the explicit same-rush replay and story-to-experiment reset message.
- Implement skip and reduced-motion routes.
- Test comprehension and refine copy/tempo.
- Capture browser screenshots at opening, rush, reveal, and handoff.

**Exit:** a complete, understandable scroll-driven narrative works independently. Do not proceed with an unfinished story.

### Phase 4 — Unlock the interactive workspace

- Reuse the story stage.
- Add scenario selection, clock, playback, reset, and live metrics.
- Add worker drag/drop and equivalent assignment controls.
- Implement busy-worker transfer rules and custom-run labeling.
- Add bounded card focusing and detail dialogs.
- Ensure controls do not compete for pointer/touch input.

**Exit:** a visitor can move the extra worker and see truthful consequences without instructions from a presenter.

### Phase 5 — Comparisons and explanations

- Add full-run preset comparison and methodology.
- Add contextual insights and inspectable order journeys.
- Explain fixed demand, same-staffing comparison, and emerging ordering constraint.
- Check that the interface reveals detail progressively.

**Exit:** the visitor can explain why extra cashier and extra barista produce different results.

### Phase 6 — Refinement and verification

- Use Impeccable adapt/harden/audit/optimize, then polish.
- Use Taste for a final visual review without restarting the design.
- Remove effects that distract from the process.
- Verify accessibility, model correctness, responsive layout, and lifecycle.
- Run clean install, typecheck, lint, tests, end-to-end tests, and production build.

**Exit:** all required acceptance checks pass or specific limitations are documented.

### Phase 7 — Handoff

- Write README with install/run/build instructions and model assumptions.
- Record implemented features, checks, known limitations, and AI/skill contribution.
- Prepare static deployment instructions; publish only when requested.
- Provide a short demo script: story reveal → move worker → compare equal-staffing scenarios.

## 13. Required verification

### Model tests

- All three exact fixtures above.
- Conservation: arrived = queued + in service + completed.
- No order in two places at once; no duplicate completion.
- FIFO and stable event ties.
- Busy transfer completes current service before moving.
- Retarget/cancel pending transfer.
- Off-duty transfer and zero active extra worker.
- Run output invariant across playback speed and frame batching.
- Reset clears history; preset comparison does not mutate.
- No arrivals at/after t=600.

### Interaction checks

- Story is the entry surface; experiment appears after story or explicit skip.
- Reverse scroll restores correct narrative state.
- Handoff resets once with visible explanation.
- Worker drag does not move rail; rail drag does not reassign worker.
- Invalid drops, keyboard assignments, and touch assignments work.
- Dialogs restore focus and appropriate playback state.
- Hidden-tab behavior and replay preserve a comprehensible state.
- Preset selection visibly resets; custom assignments are labeled.
- Scenario comparisons show consistent time windows and all-30 averages.

### Accessibility and responsive checks

Check 1440×900, 1024×768, 768×1024, and 390×844, plus a 320px-wide layout and 200% zoom. No page-level horizontal overflow, clipped labels, or hidden essential actions.

At narrow widths, flatten the arc into a readable vertical process. Retain explicit station order and assignment controls; do not require dragging between offscreen targets.

Use semantic headings, visible focus, 44px preferred touch targets, labeled controls, and dialog focus management. Announce deliberate assignments/results, not every animated dot movement. Hover information must also be accessible by focus/tap. Test reduced motion and keyboard-only completion.

### Performance checks

Aim for smooth motion on a normal laptop and usable mobile performance. Animate transforms/opacity where possible; avoid heavy filters, scroll-driven layout thrashing, and unbounded listeners. Profile a full story pass plus a complete run. No console errors, duplicate tickers, memory growth across repeated resets, or broken production asset paths.

## 14. Definition of done

- [ ] The opening feels like a story and introduces the question immediately.
- [ ] Scroll motion explains changes rather than decorating unrelated sections.
- [ ] The same dots and stations connect story to experiment.
- [ ] The reveal is supported by accurate model results.
- [ ] The interactive module is one coherent workspace.
- [ ] Three presets are easy to distinguish and compare.
- [ ] Moving a worker changes results according to the documented rules.
- [ ] Card movement and worker movement have separate, obvious affordances.
- [ ] Details are available without overcrowding the main view.
- [ ] Mobile, keyboard, and reduced-motion experiences are complete.
- [ ] Build and meaningful tests pass; limitations are stated honestly.
- [ ] Documentation lets another Claude Code session continue without guessing.

## 15. Documentation sources

Consult current official documentation during setup; pin the versions actually tested.

- Vite: https://vite.dev/guide/
- Tailwind + Vite: https://tailwindcss.com/docs/installation/using-vite
- shadcn + Vite: https://ui.shadcn.com/docs/installation/vite
- GSAP React: https://gsap.com/resources/React/
- ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Draggable: https://gsap.com/docs/v3/Plugins/Draggable/
- Claude Code skills: https://code.claude.com/docs/en/skills
- Taste: https://github.com/leonxlnx/taste-skill
- Hairline: https://github.com/lucasmarkes/hairline
- Impeccable: https://github.com/pbakaus/impeccable

## 16. Starting prompt for Claude Code

“Read plan.md completely. Treat it as the implementation contract. Start with Phase 0 and continue in the specified order. Read the installed Taste, Hairline, and Impeccable skill instructions before using them at the designated phases. Build the scroll story to its acceptance gate before creating the interactive workspace. Use the verified simulation assumptions and fixtures. Preserve the simple coffee-shop narrative, shared dots, three station cards, and draggable extra worker. Make routine implementation decisions autonomously, test each meaningful phase, and record progress and unresolved issues in docs/progress.md. Do not replace the experience with a generic dashboard or add unrelated features.”

