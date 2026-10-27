/**
 * Colour contrast audit that works where axe cannot (soft glows and grain make axe give up).
 * For every visible piece of text it blends the text colour (with its own and its ancestors'
 * opacity) over the nearest solid background, and compares with WCAG AA: 4.5:1 for normal text,
 * 3:1 for large text (24px, or 18.66px bold). The glows and grain are faint overlays, so the
 * result is an estimate; failures within 10% of a threshold are listed as "borderline".
 *   node .claude/skills/playwright-skill/run.js tests/qa/contrast.cjs
 */
const { chromium } = require('playwright')
const URL = process.env.TARGET_URL || 'http://localhost:4173'

function inPage() {
  // The browser can return colours as rgb(), color(srgb ...), oklab() and so on; a canvas turns any of them into plain sRGB.
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx2d = canvas.getContext('2d', { willReadFrequently: true })
  const parse = (c) => {
    if (!c || c === 'transparent') return null
    ctx2d.clearRect(0, 0, 1, 1)
    ctx2d.fillStyle = '#000'
    ctx2d.fillStyle = c
    ctx2d.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx2d.getImageData(0, 0, 1, 1).data
    return { r, g, b, a: a / 255 }
  }
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  })
  const lum = ({ r, g, b }) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  /** Solid background behind an element: walk up, stacking translucent layers until one is opaque. */
  const backdrop = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor)
      if (bg && bg.a > 0) layers.push(bg)
      if (bg && bg.a >= 1) break
    }
    let out = { r: 255, g: 255, b: 255, a: 1 }
    for (const l of layers.reverse()) out = over(l, out)
    return out
  }
  const opacityOf = (el) => {
    let o = 1
    for (let n = el; n; n = n.parentElement) o *= +getComputedStyle(n).opacity
    return o
  }
  const rows = []
  const leaves = [...document.querySelectorAll('body *')].filter(
    (el) => !el.closest('svg, .sr-only, [aria-hidden="true"] .grain') && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0),
  )
  for (const el of leaves) {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    if (cs.visibility === 'hidden' || cs.display === 'none' || r.width < 2 || r.height < 2) continue
    const bg = backdrop(el)
    const fgRaw = parse(cs.color)
    if (!fgRaw) continue
    const fg = over({ ...fgRaw, a: fgRaw.a * opacityOf(el) }, bg)
    const size = parseFloat(cs.fontSize)
    const bold = parseInt(cs.fontWeight, 10) >= 700
    const large = size >= 24 || (size >= 18.66 && bold)
    rows.push({
      text: el.textContent.trim().slice(0, 36),
      ratio: +ratio(fg, bg).toFixed(2),
      need: large ? 3 : 4.5,
      size: Math.round(size),
    })
  }
  return rows
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(URL)
  await page.waitForTimeout(1500)
  const all = []
  const collect = async (label) => {
    const rows = await page.evaluate(inPage)
    rows.forEach((r) => all.push({ ...r, label }))
  }
  await collect('page')
  const section = page.locator('#experiment')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('button', { name: 'Compare the three setups' }).click()
  await page.waitForTimeout(300)
  await collect('comparison open')
  await section.getByRole('group', { name: 'Assign extra worker' }).getByRole('radio', { name: /Make drinks/ }).check({ force: true })
  await section.getByRole('button', { name: 'Play' }).click()
  await page.waitForTimeout(2500)
  await collect('workspace running')
  await section.getByRole('button', { name: 'Look closer at Make drinks' }).click()
  await page.waitForTimeout(500)
  await collect('dialog open')
  await browser.close()

  const seen = new Set()
  const fails = [], borderline = []
  for (const r of all) {
    const key = `${r.text}|${r.ratio}|${r.size}`
    if (seen.has(key)) continue
    seen.add(key)
    if (r.ratio < r.need * 0.9) fails.push(r)
    else if (r.ratio < r.need) borderline.push(r)
  }
  console.log(`checked ${seen.size} distinct text styles across ${new Set(all.map((a) => a.label)).size} states`)
  const show = (list, title) => {
    console.log(list.length ? `${title} (${list.length}):` : `${title}: none`)
    list.sort((a, b) => a.ratio / a.need - b.ratio / b.need).slice(0, 25).forEach((r) => console.log(`  ${r.ratio}:1 (needs ${r.need}) ${r.size}px  "${r.text}"  [${r.label}]`))
  }
  show(fails, 'FAIL')
  show(borderline, 'BORDERLINE')
})()
