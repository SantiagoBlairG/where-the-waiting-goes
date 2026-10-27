# Dependencies and tooling

Recorded 2026-10-27. Reproduce with `npm ci` on Node 24. `package-lock.json` is committed.

## Runtime

| Package | Version | Note |
| --- | --- | --- |
| node | 24.13.1 | `engines` in package.json: `>=24 <25` |
| npm | 11.8.0 | |
| react / react-dom | 19.3.1 | |
| gsap | 3.15.0 | ScrollTrigger and Draggable ship inside the gsap package |
| @gsap/react | 2.1.2 | `useGSAP` |
| tailwindcss / @tailwindcss/vite | 4.3.3 | Tailwind v4, Vite plugin, no `tailwind.config` |
| @fontsource-variable/geist | 5.3.0 | Geist, bundled into our build |
| radix-ui | 1.8.1 | Primitives for shadcn components |
| lucide-react | 1.62.0 | Icons used by shadcn |
| class-variance-authority | 0.7.1 | shadcn variants |
| cn | 0.5.0 | shadcn's class-name merge helper (maintainer: shadcn, repo shadcn-ui/cn) |
| tw-animate-css | 1.4.0 | shadcn animations |

## Build and test

| Package | Version |
| --- | --- |
| vite | 8.3.5 |
| @vitejs/plugin-react | 6.1.2 |
| typescript | 7.0.2 |
| oxlint | 1.90.0 |
| vitest | 5.0.5 |
| jsdom | 29.1.1 |
| @testing-library/react | 16.3.3 |
| @testing-library/jest-dom | 7.0.1 |
| @testing-library/user-event | 14.6.8 |
| @playwright/test | 1.64.1 (uses installed Google Chrome) |
| shadcn (CLI) | 4.23.0, style `radix-nova`, remapped to project tokens |

`create-vite` 9.3.3 produced the scaffold (react-ts template). The scaffold was generated in a temporary folder and copied in without touching `plan.md`.

## Skills (installed per project in `.claude/skills/`, copied not symlinked)

| Skill | Source | Revision | Installed via |
| --- | --- | --- | --- |
| design-taste-frontend (Taste) | github.com/Leonxlnx/taste-skill | 12af471f62 (2026-10-24) | `npx skills add ... --skill design-taste-frontend` |
| hairline-create, hairline-adopt | github.com/lucasmarkes/hairline | 37d2e78dcb (2026-10-14) | `npx skills add lucasmarkes/hairline` |
| impeccable | github.com/pbakaus/impeccable | d34c87e1a0 (2026-10-27), skill 4.8.0, engine 0.1.18 | `npx impeccable install --providers=claude --scope=project` |
| playwright-cli | github.com/microsoft/playwright-cli | b1a5903c5b (2026-10-19), CLI 0.1.22 | `npm i -g @playwright/cli` then `playwright-cli install --skills` |

| playwright-skill | github.com/lackeyjb/playwright-skill (MIT) | 5.0.0 | `npx skills add lackeyjb/playwright-skill --skill playwright-skill -a claude-code -y --copy`, then `npm run setup` inside the skill folder (installs its own Playwright and a headless Chromium) |

Dev dependency added for the accessibility audit: `axe-core` 4.14.0 (MPL-2.0).

Content hashes for the first two are in `skills-lock.json`. Each skill was installed by one route only (no duplicate plugin copy).

## Impeccable hooks (reviewed)

`.claude/settings.local.json` registers three hooks that all run `.claude/skills/impeccable/scripts/impeccable hook`: on session start, after every Edit/Write, and on Stop (30s deep pass). The file is git-ignored (`*.local`), so each clone must run `npx impeccable install --providers=claude --scope=project` again. The engine binary `impeccable.exe` lives under `.claude/skills/impeccable/scripts/bin/`.

## Vendored code

- `src/illustrations/hairline/kernel.js`: the Hairline kernel (MIT, Copyright 2026 Lucas Marques) copied from `.claude/skills/hairline-create/kernel.js`, skill revision 37d2e78dcb, kernel sha256 346b48bd. Unchanged except a final `export default HL`. The npm package `@lucasmarkes/hairline` does not export this kernel, so figures for new objects (register, espresso machine, pickup shelf) need the vendored copy.
- The kernel needs `IntersectionObserver` and `matchMedia`; `src/test-setup.ts` stubs both for jsdom.

## Not installed (not needed yet)

`@lucasmarkes/hairline` runtime package: the shipped figures are not coffee-related, so it was not added.
