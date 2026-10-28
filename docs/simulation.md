# Simulation contract (summary)

Original contract: plan.md §9. **Changed on 2026-10-28 at the client's request**: service times now vary per customer, so that every placement of the extra worker gives a different result. The numbers below replace the fixture table in plan.md §9. This file is the working reference for `src/simulation/`.

## Why it changed

With identical orders, only the slowest station (drinks) decides the output, so an extra worker anywhere else changes nothing: the extra cashier and the extra pickup worker gave exactly the original team's result. The client wanted the experiment's setups to differ, with the extra barista still the best. Real customers differ, so service times now follow a fixed repeating pattern with the same averages as before for ordering and drinks.

## Assumptions

- 30 customers, one order each. Arrivals at t = 0, 20, 40, ... 580 s. No arrivals at or after t = 600 s. Processing continues until all 30 are complete.
- Each order visits Order & pay, Make drinks, Pick up, in that order.
- FIFO queues, non-preemptive service, zero travel time, unlimited queue space, one order per worker at a time. No breaks, abandonment, batching, randomness or priority.
- Service time depends on the customer: customer `i` takes `pattern[i mod 3]` seconds at each station (deterministic, so the same setup always gives the same result).
- An extra worker has adequate equipment and workspace (this model does not represent two baristas sharing one machine).

| Station | Seconds per customer (repeating) | Average | Capacity per worker (from the average) |
| --- | --- | --- | --- |
| Order & pay | 12, 18, 42 (card, cash, a question) | 24 s | 2.5 orders/min |
| Make drinks | 18, 26, 46 (espresso to latte) | 30 s | 2 orders/min |
| Pick up | 6, 10, 44 (most instant, a name called twice) | 20 s | 3 orders/min |

Station capacity = workers x 60 / average service seconds.

The pattern was chosen by an exhaustive search over three-customer patterns with these averages, checked against a copy of the engine: it keeps drinks the slowest step, keeps the story's surprise (an extra cashier makes the drinks line longer), and separates all four setups.

## Verified fixtures (tests must match exactly)

| Preset (order/drinks/pickup) | Completed by t=600 | Still inside | Mean arrival-to-pickup (all 30) | Last pickup |
| --- | --- | --- | --- | --- |
| Original team 1/1/1 | 17 | 13 | 232 s (231.8) | 982 s |
| Extra cashier 2/1/1 | 18 | 12 | 213 s (212.5) | 972 s |
| Extra barista 1/2/1 | 21 | 9 | 142 s (141.8) | 820 s |
| Extra at pickup 1/1/2 | 17 | 13 | 222 s (222.2) | 982 s |

Mean queue wait by station (order/drinks/pickup), rounded: original 58/91/10 s, extra cashier 0/130/8 s, extra barista 58/0/10 s, extra at pickup 58/91/0 s. At t = 600 the original team has 4 / 5 / 1 waiting (plus one in service at each), the extra cashier 0 / 9 / 0.

The extra worker at pickup ends at the same last pickup as the original team (the last order never waits there); its difference is the shorter average.

## Rules to implement

- Integer simulated milliseconds, event queue (not frame counters), stable ordering.
- Same-timestamp order: (1) complete services, (2) release to downstream queues by order ID, (3) resolve pending worker transfers, (4) admit arrivals, (5) assign free workers FIFO with worker-ID tiebreak, (6) emit snapshot.
- Metrics at t=600 include everything at that timestamp. Still in shop = arrived minus completed.
- Busy workers finish the current order before moving. Latest destination choice wins. Pending workers count at their current station.
- API needed by the story: `snapshotAt(time)` and `runToCompletion`.
- "Average total time" always means arrival to pickup for all 30 orders after draining.

## Status

Implemented in `src/simulation/` and verified by `engine.test.ts` against every fixture above. UI code must read numbers from this engine (`snapshotAt`, `runToCompletion`, `fullRunResult`), never hardcode them. The experiment plays runs at 45x (about 22 seconds for the longest).
