/**
 * Accessibility audit with axe-core, run through the playwright-skill executor:
 *   node .claude/skills/playwright-skill/run.js tests/qa/a11y.cjs
 * The plain layout (reduced motion) shows every room and the workspace fully visible, so axe can
 * measure real colors; the pinned layout is audited for structure (names, roles, landmarks).
 */
const fs = require('node:fs')
const { chromium } = require('playwright')
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js', { paths: [process.cwd()] }), 'utf8')

const URL = process.env.TARGET_URL || 'http://localhost:4173'
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function audit(page, label, options = {}) {
  await page.evaluate(axeSource)
  const result = await page.evaluate(async ({ tags, options }) => {
    return await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, ...options })
  }, { tags: TAGS, options })
  console.log(`\n--- ${label}: ${result.violations.length} violation rule(s), ${result.incomplete.length} needing review, ${result.passes.length} passed`)
  for (const v of result.violations) {
    console.log(` [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} element${v.nodes.length === 1 ? '' : 's'})`)
    v.nodes.slice(0, 4).forEach((n) => console.log('     ', n.target.join(' '), '|', (n.failureSummary || '').split('\n')[1]?.trim().slice(0, 110)))
  }
  for (const v of result.incomplete.filter((i) => i.id !== 'color-contrast')) console.log(` [review] ${v.id}: ${v.nodes.length} element(s)`)
  const cc = result.incomplete.find((i) => i.id === 'color-contrast')
  if (cc) console.log(` [review] color-contrast could not be computed for ${cc.nodes.length} element(s) (gradients, overlays)`)
  return result
}

;(async () => {
  const browser = await chromium.launch({ headless: true })

  // 1. Plain layout: every room and the workspace, colors included.
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  let page = await ctx.newPage()
  await page.goto(URL)
  await page.waitForTimeout(1500)
  await audit(page, 'plain layout (reduced motion), whole page, 1440x900')

  // 2. Workspace states.
  const section = page.locator('#experiment')
  await section.scrollIntoViewIfNeeded()
  await section.getByRole('button', { name: 'Compare the three setups' }).click()
  await page.waitForTimeout(400)
  await audit(page, 'comparison panel open')
  await section.getByRole('button', { name: 'Hide the comparison' }).click()
  await section.getByRole('button', { name: 'Look closer at Make drinks' }).click()
  await page.waitForTimeout(500)
  await audit(page, 'station dialog open')
  await page.keyboard.press('Escape')
  await section.getByRole('button', { name: 'See every order' }).click()
  await page.waitForTimeout(500)
  await audit(page, 'orders dialog open')
  await page.keyboard.press('Escape')
  await page.close()
  await ctx.close()

  // 3. Phone, plain layout.
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
  page = await ctx.newPage()
  await page.goto(URL)
  await page.waitForTimeout(1500)
  await audit(page, 'phone 390x844 (reduced motion), whole page')
  await ctx.close()

  // 4. Pinned layout with motion: structure only. Contrast is audited in the plain layout above.
  ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  page = await ctx.newPage()
  await page.goto(URL)
  await page.waitForTimeout(1500)
  await audit(page, 'pinned layout (motion on), structure only', { rules: { 'color-contrast': { enabled: false } } })
  await browser.close()
})()
