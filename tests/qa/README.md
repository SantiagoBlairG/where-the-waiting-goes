# Exploratory QA scripts

These drive a real browser the way a visitor would, using the `playwright-skill` executor
(`.claude/skills/playwright-skill`, installed with `npx skills add lackeyjb/playwright-skill`;
run `npm run setup` once inside that folder to fetch Playwright and Chromium). They are
CommonJS (`.cjs`) because the project is ES modules, and they run headless.

Start the production site first:

```sh
npm run serve        # builds and serves http://localhost:4173
```

| Command | What it does |
| --- | --- |
| `npm run qa:layout` | Scrolls the whole page with the mouse wheel and checks every stop for overlapping or clipped text, horizontal scroll, small tap targets, console errors and failed requests. `VIEWPORT=390x844 TOUCH=1 npm run qa:layout` for other sizes (on Windows use `env VIEWPORT=... TOUCH=1 npm run ...`). |
| `npm run qa:a11y` | axe-core audit (WCAG 2 A/AA, 2.1, 2.2 AA, best practice) of the page, the comparison panel and both dialogs, on desktop and phone. |
| `npm run qa:contrast` | Contrast of every visible text style, blended over its real background, in four states. Works where axe cannot (glows and grain). |
| `npm run qa:keyboard` | Tabs through the page checking focus indicators and names, then operates the workspace with the keyboard only. |
| `npm run qa:perf` | Frame times and long tasks during a full scroll and a live run, at normal speed and 4x CPU slowdown, plus heap growth over repeated restarts. |

Output goes to the terminal; screenshots from `qa:layout` go to `docs/qa/` (git-ignored).
`TARGET_URL` changes the address. The Playwright end-to-end tests in `tests/e2e` are the
regression suite; these scripts are for finding problems nobody has written a test for yet.
