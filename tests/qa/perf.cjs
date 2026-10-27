/**
 * Performance and memory check, run with the playwright-skill executor:
 *   node .claude/skills/playwright-skill/run.js tests/qa/perf.cjs
 * Measures frame times during a real-wheel scroll of the whole story and during a live run, with
 * and without CPU throttling, counts long tasks, and checks heap growth over repeated restarts.
 */
const { chromium } = require('playwright')
const URL = process.env.TARGET_URL || 'http://localhost:4173'

const q = (d, p) => d[Math.min(d.length - 1, Math.floor(d.length * p))]
const summarize = (label, d) => {
  const s = [...d].sort((a, b) => a - b)
  console.log(`  ${label}: ${d.length} frames, median ${q(s, 0.5).toFixed(1)} ms, p95 ${q(s, 0.95).toFixed(1)} ms, p99 ${q(s, 0.99).toFixed(1)} ms, worst ${s.at(-1).toFixed(0)} ms, over 50 ms: ${s.filter((x) => x > 50).length}`)
}
const frames = (page) =>
  page.evaluate(() => {
    window.__d = []
    window.__long = 0
    let last = performance.now()
    const tick = (t) => { window.__d.push(t - last); last = t; window.__raf = requestAnimationFrame(tick) }
    window.__raf = requestAnimationFrame(tick)
    new PerformanceObserver((l) => { window.__long += l.getEntries().length }).observe({ entryTypes: ['longtask'] })
  })
const stop = (page) => page.evaluate(() => { cancelAnimationFrame(window.__raf); return { d: window.__d.slice(3), long: window.__long } })

;(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] })
  for (const rate of [1, 4]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const cdp = await ctx.newCDPSession(page)
    await page.goto(URL)
    await page.waitForTimeout(1500)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate })
    console.log(`\n=== CPU slowdown x${rate}`)

    await frames(page)
    await page.mouse.move(720, 450)
    const total = await page.evaluate(() => document.getElementById('experiment').offsetTop)
    for (let y = 0; y < total; y += 90) { await page.mouse.wheel(0, 90); await page.waitForTimeout(14) }
    let r = await stop(page)
    summarize('scroll the whole pinned story', r.d)
    console.log(`  long tasks (over 50 ms): ${r.long}`)

    const section = page.locator('#experiment')
    await section.scrollIntoViewIfNeeded()
    await section.getByRole('radio', { name: /Extra barista/ }).check({ force: true })
    await frames(page)
    await section.getByRole('button', { name: 'Play' }).click()
    await page.waitForTimeout(rate === 1 ? 12000 : 8000)
    await section.getByRole('button', { name: 'Pause' }).click()
    r = await stop(page)
    summarize('a live run at 10×', r.d)
    console.log(`  long tasks (over 50 ms): ${r.long}`)
    await ctx.close()
  }

  // Heap growth over repeated resets.
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await page.goto(URL)
  await page.waitForTimeout(1500)
  const section = page.locator('#experiment')
  await section.scrollIntoViewIfNeeded()
  const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage'); return (await cdp.send('Runtime.getHeapUsage')).usedSize / 1048576 }
  const cycle = async () => {
    await section.getByRole('radio', { name: /Extra cashier/ }).check({ force: true })
    await section.getByRole('button', { name: 'Play' }).click()
    await page.waitForTimeout(250)
    await section.getByRole('button', { name: 'Restart this setup' }).click()
    await section.getByRole('radio', { name: /Extra barista/ }).check({ force: true })
  }
  for (let i = 0; i < 5; i++) await cycle()
  const before = await heap()
  for (let i = 0; i < 40; i++) await cycle()
  const after = await heap()
  console.log(`\n=== memory: heap after 5 warm-up cycles ${before.toFixed(1)} MB, after 40 more resets ${after.toFixed(1)} MB (change ${(after - before).toFixed(1)} MB)`)
  const stats = await page.evaluate(() => ({ nodes: document.getElementsByTagName('*').length, svgs: document.querySelectorAll('svg').length }))
  console.log(`  DOM elements ${stats.nodes}, svg elements ${stats.svgs} (no growth means no leak of figures)`)
  await browser.close()
})()
