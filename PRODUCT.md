# Product

<!-- impeccable:product-schema 1 -->

> Source: filled from `plan.md` (the user's written brief), not from a live interview. Every fact below is stated in that plan. Nothing was invented.

## Platform

web

## Stack

React + TypeScript + Vite, Tailwind CSS v4, shadcn/ui (Radix), GSAP. Static build, deployed to Vercel from a GitHub repo. User-specified in plan.md §5.

## Users

Nontechnical visitors who have never studied process bottlenecks. They arrive on a single page and should leave able to say: "Adding capacity at the wrong step just moves the queue. Helping the constrained step improves the whole process."

## Product Purpose

An educational scroll story followed by one interactive experiment. It shows why making one step of a coffee shop faster (ordering) does not make the whole experience faster, and lets the visitor test where one extra worker helps. Success is comprehension, not engagement metrics.

## Positioning

The story and the experiment share one visual system and one deterministic simulation. The same dots, stations and numbers that explain the idea in the story are the ones the visitor then manipulates. This is an illustration of a mechanism, not a dashboard or a marketing page.

## Operating Context

- Opening question: "If ordering gets faster, why doesn't your coffee?"
- Core reveal: "We didn't remove the wait. We moved it."
- Three stations in order: Order & pay, Make drinks, Pick up.
- Three presets: Original team (1/1/1), Extra cashier (2/1/1), Extra barista (1/2/1).
- 30 orders, one every 20 seconds for 10 minutes. Deterministic discrete-event model.

## Capabilities and Constraints

- One continuous page: scroll story (7 beats), then one interactive workspace.
- One flexible extra worker, draggable between stations, with a full keyboard and touch alternative.
- Label the model "A simplified coffee-shop simulation." It is not a forecast for a real café.
- No backend, accounts, database, paid API or runtime AI. Static deployment.
- Deferred: demand sliders, menu complexity, worker skill differences, random arrivals, equipment, live data, audio, WebGL, scenario builders, sharing.
- Undecided: whether the work is judged against a submission-specific rubric. plan.md says the original challenge image is not available, so verify any rubric before final delivery.

## Brand Commitments

Title: "Where the waiting goes". No logo, no existing brand. Voice is plain, warm and concrete. Avoid jargon until the reveal, where "bottleneck" is introduced (plan.md §7).

## Evidence on Hand

Verified simulation fixtures in plan.md §9 (completed by t=600: 18 / 18 / 23; mean arrival-to-pickup 214 / 214 / 127 seconds). No testimonials, customer data or real café data exist. Do not fabricate any.

## Product Principles

1. Story first. The visitor meets the question, not controls or metrics.
2. Comprehension over spectacle. Motion must show cause and effect.
3. Truthful numbers. Every figure comes from the model, with clear time windows and cohorts.
4. One visual system from story to experiment: same dots, stations and direction of flow.
5. Reveal detail progressively. Do not show every metric at once.

## Accessibility & Inclusion

Semantic text for every story beat; full keyboard and touch alternatives to drag; reduced-motion experience that keeps all content and interactions; visible focus; 44px preferred touch targets; checked at 320px, 390px, 768px, 1024px, 1440px and 200% zoom (plan.md §13).
