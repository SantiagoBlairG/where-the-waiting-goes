# Simplification pass (v4), 2026-10-28

Client brief: a welcome hero that the camera zooms into; a story that is far easier to follow (about 90% less information on the busy screens); a calmer experiment without the up-and-down comparison; consistent card sizes; liquid-glass chrome (nav, chapter dots, buttons) with micro-interactions. Story order and copy stay.

## What a visitor actually saw (walk at 1440x900, 36 stops)

| Screen | Problem |
| --- | --- |
| Opening | A small card on the right that later becomes three larger cards of a different size and place. |
| Three stops | Every card carries a status strip, "Next stop", a worker badge and "1 worker"; the speech-bubble note floats over the row and moves with the step. |
| The rush | About ten screens of near-identical frames. Each frame shows a giant clock, picked up / still in shop, three waiting numbers, three dot rows, three worker badges, three status lines and a bubble: around 40 changing items. |
| Fix and surprise | A 2 x 3 grid of mini cards with "?" placeholders, two row titles, a replay icon and a summary line. The one number that matters (4 to 0, then 5 to 9) is lost. |
| Reveal | Full cards with capacity pills, status, workers and dots everywhere, although only one card matters. |
| Experiment | Setup cards, stations on an arc, a bench to drag from, a focus rail, a "this run" card, an assign-worker panel, three stat tiles, an average sentence, a compare toggle with a panel far below, two more dialog buttons and a sticky bar. To compare you run a setup, scroll down to the panel, scroll back up, change, and repeat. |

## Principles for this pass

1. **One stage, one question per screen.** The three stations sit in the same place, at the same size, from the first story screen to the experiment. Each beat changes one thing on it.
2. **A card shows one number.** Name, illustration, and how many orders are waiting (as a number and a small stack of dots). Anything else appears only on the beat that is about it, as a single chip: "+1 cashier", "was 5", "2 drinks a minute".
3. **Progress lives in one fixed place.** The speech bubbles are gone. A slim progress track under the stage carries the step: during "three stops" the order dot travels along it with a one-line caption; during the rush it becomes the ten-minute clock bar.
4. **Comparisons are before and after on the same card**, not a second row of cards.
5. **The experiment compares in place.** Three setup tabs, one stage, one Play. Each finished run writes its result onto its own tab, so after three runs the comparison is just the three tabs side by side. Tapping a station still opens its details.
6. **Glass only on floating chrome** (nav, chapter dots, primary buttons, setup tabs, run bar), never on content cards, and never glass on glass. Solid fallbacks for reduced transparency.

## Removed

Opening card, floating notes, rush clock headline and counters, compare grid, bench animation and rewind, focus rail, drag-and-drop bench, assign-worker panel, stat tiles, compare panel and its button, speed toggle (runs play at a fixed fast speed), "see every order" entry point.
