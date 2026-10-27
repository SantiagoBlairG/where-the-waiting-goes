# Simulation contract (summary)

Full contract: plan.md §9. This file is the working reference for `src/simulation/`.

## Assumptions

- 30 customers, one identical order each. Arrivals at t = 0, 20, 40, ... 580 s. No arrivals at or after t = 600 s. Processing continues until all 30 are complete.
- Each order visits Order & pay, Make drinks, Pick up, in that order.
- FIFO queues, non-preemptive service, zero travel time, unlimited queue space, one order per worker at a time. No breaks, abandonment, batching, randomness or priority.
- An extra worker has adequate equipment and workspace (this model does not represent two baristas sharing one machine).

| Station | Seconds per order per worker | Capacity per worker |
| --- | --- | --- |
| Order & pay | 24 | 2.5 orders/min |
| Make drinks | 30 | 2 orders/min |
| Pick up | 15 | 4 orders/min |

Station capacity = workers x 60 / service seconds.

## Verified fixtures (tests must match exactly)

| Preset (order/drinks/pickup) | Completed by t=600 | Still inside | Mean arrival-to-pickup (all 30) | Last pickup |
| --- | --- | --- | --- | --- |
| Original team 1/1/1 | 18 | 12 | 214 s | 939 s |
| Extra cashier 2/1/1 | 18 | 12 | 214 s | 939 s |
| Extra barista 1/2/1 | 23 | 7 | 127 s | 765 s |

Mean queue wait by station (order/drinks/pickup): baseline 58/87/0 s, extra cashier 0/145/0 s, extra barista 58/0/0 s. Every order gets 69 s of service.

## Rules to implement

- Integer simulated milliseconds, event queue (not frame counters), stable ordering.
- Same-timestamp order: (1) complete services, (2) release to downstream queues by order ID, (3) resolve pending worker transfers, (4) admit arrivals, (5) assign free workers FIFO with worker-ID tiebreak, (6) emit snapshot.
- Metrics at t=600 include everything at that timestamp. Still in shop = arrived minus completed.
- Busy workers finish the current order before moving. Latest destination choice wins. Pending workers count at their current station.
- API needed by the story: `snapshotAt(time)` and `runToCompletion`.
- "Average total time" always means arrival to pickup for all 30 orders after draining.

## Status

Implemented in `src/simulation/` and verified by `engine.test.ts` against every fixture above. UI code must read numbers from this engine (`snapshotAt`, `runToCompletion`, `fullRunResult`), never hardcode them.
