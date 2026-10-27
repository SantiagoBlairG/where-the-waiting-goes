/**
 * Exploratory QA, run with the playwright-skill executor:
 *   node .claude/skills/playwright-skill/run.js tests/qa/explore.js
 * Env: TARGET_URL (default http://localhost:4173), VIEWPORT (e.g. 1440x900), TOUCH=1, REDUCED=1,
 *      PW_ARTIFACT_DIR (default docs/qa). Behaves like a visitor: real mouse-wheel scrolling,
 *      then reports overlap, clipping, console errors, failed requests and small tap targets.
 */
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')

const URL = process.env.TARGET_URL || 'http://localhost:4173'
const OUT = process.env.PW_ARTIFACT_DIR || 'docs/qa'
const [width, height] = (process.env.VIEWPORT || '1440x900').split('x').map(Number)
const tag = `${width}x${height}${process.env.TOUCH ? '-touch' : ''}${process.env.REDUCED ? '-reduced' : ''}`
fs.mkdirSync(OUT, { recursive: true })

/** Runs in the page: boxes of visible text that intersect other visible text. */
function pageChecks() {
  const visible = (el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.3 && r.width > 2 && r.height > 2 && !el.closest('.sr-only')
  }
  const textLeaves = [...document.querySelectorAll('body *')].filter((el) => {
    if (!visible(el) || el.closest('svg')) return false
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)
  })
  // One box per line of text (a wrapped span has one rectangle per line, not one big box).
  const boxes = textLeaves.flatMap((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    const inset = parseFloat(getComputedStyle(el).fontSize) * 0.2
    return [...range.getClientRects()].map((raw) => ({
      el,
      // Compare ink, not line boxes: tight display type has line boxes taller than its leading.
      r: { left: raw.left, right: raw.right, top: raw.top + inset, bottom: raw.bottom - inset, width: raw.width, height: raw.height - inset * 2 },
      text: el.textContent.trim().slice(0, 40),
    }))
  }).filter((b) => b.r.width > 2 && b.r.height > 2 && b.r.bottom > 0 && b.r.top < innerHeight)
  const overlaps = []
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j]
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue
      // The floating run bar is an overlay by design: check its own contents, not what scrolls beneath it.
      // The same goes for the floating page nav, which is fully opaque.
      const overlay = '#run-controls, nav[aria-label="Page"]'
      const barA = !!a.el.closest(overlay), barB = !!b.el.closest(overlay)
      if (barA !== barB) continue
      // Words of one headline, or the digits and label of one clock, are laid out together on purpose.
      const ga = a.el.closest('[data-text], [data-clock], h1, h2, h3')
      if (ga && ga === b.el.closest('[data-text], [data-clock], h1, h2, h3')) continue
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left)
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top)
      if (w > 3 && h > 3) {
        // Something solid on top (a floating bar) hides one of them: occluded, not colliding.
        const cx = Math.max(a.r.left, b.r.left) + w / 2
        const cy = Math.max(a.r.top, b.r.top) + h / 2
        const top = document.elementFromPoint(cx, cy)
        if (top && !a.el.contains(top) && !b.el.contains(top)) continue
      }
      if (w > 3 && h > 3) overlaps.push(`"${a.text}" x "${b.text}" (${Math.round(w)}x${Math.round(h)}px)`)
    }
  const clipped = boxes
    .filter((b) => b.r.left < -1 || b.r.right > innerWidth + 1)
    .map((b) => `"${b.text}" outside the window horizontally`)
  const small = [...document.querySelectorAll('a, button, [role="slider"], label:has(input)')]
    .filter((el) => visible(el))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.bottom > 0 && r.top < innerHeight && (r.width < 36 || r.height < 36))
    .map(({ el, r }) => `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
  return { overlaps, clipped, small, hscroll: document.documentElement.scrollWidth - innerWidth }
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: !!process.env.TOUCH,
    isMobile: !!process.env.TOUCH,
    deviceScaleFactor: process.env.TOUCH ? 2 : 1,
    reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference',
  })
  const page = await context.newPage()
  const problems = new Set()
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && problems.add(`console.${m.type()}: ${m.text().slice(0, 200)}`))
  page.on('pageerror', (e) => problems.add(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => problems.add(`request failed: ${r.url()}`))
  page.on('response', (r) => r.status() >= 400 && problems.add(`HTTP ${r.status()}: ${r.url()}`))

  const t0 = Date.now()
  await page.goto(URL, { waitUntil: 'load' })
  await page.waitForTimeout(1800)
  const loadMs = Date.now() - t0
  const mode = (await page.locator('[data-stage-area]').count()) ? 'pinned story' : 'plain layout'
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    return [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')))]
  })

  // Scroll like a visitor: wheel steps with pauses, checking each stop.
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  const step = Math.max(240, Math.round(height * 0.55))
  const stops = Math.ceil(total / step)
  const findings = []
  const seenText = new Set()
  await page.mouse.move(width / 2, height / 2)
  for (let i = 0; i <= stops; i++) {
    if (i > 0) await page.mouse.wheel(0, step)
    await page.waitForTimeout(i === 0 ? 300 : 1700) // let reveals and fades settle
    const heading = await page.evaluate(() => {
      const g = [...document.querySelectorAll('[data-text]')].find((e) => +getComputedStyle(e).opacity > 0.9)
      return g ? g.innerText.split('\n')[0] : (document.elementFromPoint(innerWidth / 2, 80)?.closest('section')?.querySelector('h1,h2')?.textContent ?? '')
    })
    const checks = await page.evaluate(pageChecks)
    const y = await page.evaluate(() => Math.round(scrollY))
    if (checks.overlaps.length || checks.clipped.length || checks.hscroll > 0) findings.push({ y, heading, ...checks })
    checks.small.forEach((s) => seenText.add(s))
    if (i % 4 === 0 || i === stops) await page.screenshot({ path: path.join(OUT, `${tag}-scroll-${String(i).padStart(2, '0')}.png`) })
  }

  console.log(`\n=== ${tag}: ${mode}, loaded in ${loadMs} ms, scroll height ${total}px, ${stops + 1} stops`)
  console.log('fonts loaded:', fonts.join(', '))
  console.log(findings.length ? `LAYOUT PROBLEMS at ${findings.length} stop(s):` : 'no overlapping or clipped text at any stop')
  findings.slice(0, 8).forEach((f) => {
    console.log(` y=${f.y} "${f.heading}"`)
    f.overlaps.slice(0, 4).forEach((o) => console.log('   overlap:', o))
    f.clipped.slice(0, 3).forEach((o) => console.log('   clipped:', o))
    if (f.hscroll > 0) console.log('   horizontal scroll by', f.hscroll, 'px')
  })
  console.log(`small tap targets seen (under 36px): ${seenText.size}`)
  ;[...seenText].slice(0, 8).forEach((s) => console.log('  ', s))
  console.log(problems.size ? 'CONSOLE/NETWORK PROBLEMS:\n  ' + [...problems].join('\n  ') : 'no console errors, warnings or failed requests')
  await browser.close()
})()
