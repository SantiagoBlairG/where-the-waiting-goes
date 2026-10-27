# Storyboard

Phase 1 deliverable. The copy lives in `src/story/storyBeats.ts`; this file records the intent and the review. Beat intents come from plan.md §7. A static version of all seven beats is built in `src/story/StoryStatic.tsx` and runs with `npm run dev`.

## The idea (Taste, step 4)

> On this page, **one customer's order** becomes **a single dot that the whole page follows**, from the counter to the cup, and later the same dot is the thing the visitor can help.

Competitor test: another coffee explainer would not have a dot that is both the story's character and the experiment's unit of work. The same dot appears in the opening, in every queue, and in the workspace.

## The seven beats

| Beat | Headline | Supporting line | What the stage shows |
| --- | --- | --- | --- |
| 1. A familiar moment | If ordering gets faster, why doesn’t your coffee? | 8:45. A quick coffee before work. | One dot, a register, a steaming cup. No metrics. "Scroll to follow one order", "Skip to experiment" |
| 2. One order, three stops | Order. Make. Pick up. | Every order makes the same three stops, in the same order. | Three named stations with arrows. One traced order is at stop 1; "Your order comes next" at stops 2 and 3 |
| 3. The rush | Now the morning rush arrives. | Thirty orders in ten minutes. One person at each stop, and orders arrive faster than they can be finished. | Original team at 5 minutes: waiting 3 / 2 / 0, 8 picked up, 8 still inside. Dot key appears here |
| 4. The obvious fix | Put another person on the register. | Replay the same rush with an extra cashier. The line at the register is gone. | "Same 30 orders. Same 10 minutes." Two rows at 10 minutes. Only the register queue is shown (4 versus 0). Downstream counts are held back for beat 5 |
| 5. The surprise | Ordering is faster. Your coffee isn’t. | Both cafés have handed over 18 drinks. With two cashiers, 9 orders are now waiting for coffee, up from 5. | Same two rows, drinks queue highlighted (5 versus 9). 18 picked up and 12 still inside in both |
| 6. The reveal | We didn’t remove the wait. We moved it. | One barista makes two drinks a minute, however fast orders arrive. That limiting step is the bottleneck. | Extra-cashier café, full cards. Drinks station highlighted: capacity 2 orders/min, 9 waiting |
| 7. Your turn | Where would you put the extra person? | Your turn. Start the same rush from the beginning. | The same three cards on the arc at t=0 (all empty), an extra worker on a bench. "A simplified coffee-shop simulation. Not a forecast for a real café." |

Rules held: one idea per beat, a headline plus at most one supporting sentence, labels appear when their concept appears, "bottleneck" first appears in beat 6.

## Numbers used (all from the plan's rules)

At t=300 original team: waiting 3/2/0, 8 done. At t=600: original 4/5/0, extra cashier 0/9/0, both 18 done and 12 inside. Currently hard-coded in `storySnapshots.ts` from an offline script that reproduced every plan fixture. Phase 2 replaces them with engine output.

## Narrative acceptance gate (plan.md §7)

Not yet tested with a real person. Self-check against the four questions, from the static page only:

| Question | Does the static page answer it? |
| --- | --- |
| What are the three steps? | Yes, beat 2 names them and every later card repeats them |
| What improved when the cashier was added? | Yes, beat 4 shows the register queue going from 4 to 0 |
| Why did total time fail to improve? | Yes, beats 5 and 6 show the queue moving to drinks and name the 2 drinks/min limit |
| What can I try next? | Yes, beat 7 |

Still needed: one unfamiliar reader should confirm. Do not skip this before Phase 3 polish.

## Review notes and open decisions

- **Opening headline on phones** is three lines at 36px (plan §6 sets 36–44px; Taste prefers two lines). Kept per the plan. Revisit if it feels heavy on a real phone.
- **Beat 2 headline** "Order. Make. Pick up." is the plan's own copy. Taste lists three-part fragments as a generic pattern; kept because it is also the process's real vocabulary.
- **Beat 6 "bottleneck"** is introduced with one sentence; check in the comprehension test that it lands.
- **Beats 4 and 5 are two stacked rows** that fit one 900px-tall desktop viewport but run long on a phone. In Phase 3 consider a toggle or a single row that swaps between the two cafés.
- **Illustrations** are simple isometric line stand-ins, built from one shared projection. Phase 2 refines or replaces them with Hairline assets.
