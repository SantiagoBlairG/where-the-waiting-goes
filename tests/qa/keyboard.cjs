/**
 * Keyboard-only walkthrough, run with the playwright-skill executor:
 *   node .claude/skills/playwright-skill/run.js tests/qa/keyboard.cjs
 * Tabs through the whole page recording every stop (name, role, visible focus indicator, on screen),
 * then operates the workspace without a mouse.
 */
const { chromium } = require('playwright')
const URL = process.env.TARGET_URL || 'http://localhost:4173'
const [width, height] = (process.env.VIEWPORT || '1440x900').split('x').map(Number)

/** Runs in the page: describes the focused element and whether a focus indicator is visible. */
function describeFocus() {
  const el = document.activeElement
  if (!el || el === document.body) return null
  const name = (el.getAttribute('aria-label') || el.labels?.[0]?.innerText || el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48)
  const role = el.getAttribute('role') || el.tagName.toLowerCase() + (el.type ? `[${el.type}]` : '')
  // A visually hidden input shows its focus on the label that wraps it.
  const holder = el.matches('input.sr-only') ? el.closest('label') : el
  // The indicator may be on the element, or on a child that reacts to its focus (the rail's dots).
  const shows = (n) => { const c = getComputedStyle(n); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (c.boxShadow && c.boxShadow !== 'none') }
  const outline = shows(holder) || [...holder.querySelectorAll('*')].some(shows)
  const ring = false
  const r = holder.getBoundingClientRect()
  const onScreen = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
  return { name, role, indicator: outline || ring, onScreen, y: Math.round(scrollY) }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width, height } })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(URL)
  await page.waitForTimeout(1500)

  // 1. Tab through everything.
  const stops = []
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab')
    await page.waitForTimeout(60)
    const f = await page.evaluate(describeFocus)
    if (!f) break
    if (stops.length && stops.at(-1).name === f.name && stops.at(-1).role === f.role && i > 3) {
      // Same stop twice in a row: probably a trap or the end of the page.
      if (stops.length > 3 && stops.at(-2).name === f.name) break
    }
    stops.push(f)
  }
  console.log(`\n=== ${width}x${height}: ${stops.length} tab stops`)
  console.log('first stops:', stops.slice(0, 6).map((s) => `${s.role} "${s.name}"`).join(' | '))
  const noIndicator = stops.filter((s) => !s.indicator)
  const offscreen = stops.filter((s) => !s.onScreen)
  const unnamed = stops.filter((s) => !s.name)
  console.log(noIndicator.length ? `NO VISIBLE FOCUS INDICATOR on ${noIndicator.length}:` : 'every stop shows a visible focus indicator')
  noIndicator.slice(0, 10).forEach((s) => console.log(`   ${s.role} "${s.name}"`))
  console.log(offscreen.length ? `FOCUS LEFT THE SCREEN on ${offscreen.length}:` : 'focus stayed on screen at every stop')
  offscreen.slice(0, 10).forEach((s) => console.log(`   ${s.role} "${s.name}"`))
  console.log(unnamed.length ? `STOPS WITHOUT A NAME: ${unnamed.length}` : 'every stop has an accessible name')

  // 2. Operate the workspace with the keyboard only.
  const section = page.locator('#experiment')
  await section.getByRole('link', { name: 'Skip to run controls' }).focus()
  await page.keyboard.press('Enter')
  const results = []
  const check = (label, ok, detail = '') => results.push({ label, ok, detail })

  const speedBefore = await section.getByRole('radio', { name: /10× faster/ }).isChecked()
  check('run bar reached through the skip link, speed starts at 10×', speedBefore)

  await section.getByRole('radio', { name: /Extra barista/ }).focus()
  await page.keyboard.press('Space')
  check('a setup is chosen with the keyboard', await section.getByRole('radio', { name: /Extra barista/ }).isChecked())
  check('the choice resets the run to 0:00', (await section.locator('output').innerText()) === '0:00')

  const assign = section.getByRole('group', { name: 'Assign extra worker' })
  await assign.getByRole('radio', { name: /Pick up/ }).focus()
  await page.keyboard.press('Space')
  check('the extra worker is assigned with the keyboard', (await section.getByText('Custom · based on Extra barista').count()) > 0)

  await section.getByRole('button', { name: 'Play' }).focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1500)
  const clock = await section.locator('output').innerText()
  check('Play works from the keyboard and the clock advances', clock !== '0:00', clock)
  await page.keyboard.press('Space') // the focused button is now Pause
  const paused = await section.locator('output').innerText()
  await page.waitForTimeout(700)
  check('Space pauses it', (await section.locator('output').innerText()) === paused, paused)

  const look = section.getByRole('button', { name: 'Look closer at Make drinks' })
  await look.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  check('Look closer opens a dialog', await page.getByRole('dialog').isVisible())
  const trapped = await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]'))
  check('focus moved into the dialog', trapped)
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab')
  check('Tab stays inside the dialog (focus trap)', await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')))
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  check('Escape closes it', !(await page.getByRole('dialog').isVisible().catch(() => false)))
  check('focus returns to the button that opened it', await look.evaluate((el) => el === document.activeElement))

  const slider = section.getByRole('slider', { name: 'Focus station' })
  await slider.focus()
  await page.keyboard.press('Home')
  check('the focus rail moves with Home', (await slider.getAttribute('aria-valuetext')) === 'Order & pay')

  console.log('\nkeyboard-only workspace:')
  results.forEach((r) => console.log(` ${r.ok ? 'pass' : 'FAIL'}  ${r.label}${r.detail ? ` (${r.detail})` : ''}`))
  console.log(errors.length ? 'CONSOLE ERRORS:\n  ' + errors.join('\n  ') : 'no console errors')
  await browser.close()
})()
