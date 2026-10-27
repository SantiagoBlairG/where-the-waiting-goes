# Where the waiting goes

Scroll-driven coffee-shop story followed by one interactive bottleneck experiment. React + TypeScript + Vite, Tailwind v4, shadcn/ui, GSAP. Static site, deployed on Vercel from GitHub.

## Read first, every session

1. `plan.md` is the product brief and implementation contract. Read it fully.
2. `PRODUCT.md` (product truth), `DESIGN.md` (visual decisions), `docs/progress.md` (where we are, what is unresolved).

## Rules

- **Story first.** Build and finish the scroll story (plan.md §7) before the interactive workspace. Never open with a dashboard, settings or controls.
- **Skills at their phases**, not all at once: Taste (art direction, Phase 1 and final review), Hairline (illustrations, Phase 2), Impeccable (shape/clarify/critique in Phase 1; adapt/harden/audit/optimize then polish in Phase 6). Read the installed `SKILL.md` before using each. Conflicts resolve in this order: story clarity, accessibility, truthful data, established visual direction. A skill suggesting more effects is not permission to add them.
- **Simulation is pure TypeScript** in `src/simulation/`, with no formulas in UI components. UI numbers must come from the model, never hardcoded. Fixtures in plan.md §9 must pass.
- **One animation engine** (GSAP). No two engines write the same element's transform. Keep a motion-ownership note per animated component.
- **Out of scope** (do not add): Next.js, router, Three.js, a second animation library, smooth-scroll hijacking, chart library, backend, demand sliders and the other items in plan.md §2 "Defer".
- Tailwind v4 only (no v3 config). Alias `@/` maps to `src/`.

## Commands

```sh
npm ci            # clean install (Node 24)
npm run dev       # dev server
npm run typecheck && npm run lint && npm test
npm run build     # production build to dist/
npm run test:e2e  # Playwright (builds and serves preview on :4173)
```

## Before you finish a task

Run the relevant checks above. Update `docs/progress.md` honestly: what is done, what is verified, what remains. Do not publish or deploy unless the user asks.
