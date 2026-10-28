import { expect, test, type Page } from '@playwright/test'

/** Scroll length of each beat in viewport heights. Keep in sync with src/story/timeline.ts. */
const WEIGHTS = [1.7, 2.2, 3.2, 1.4, 1.4, 1.4, 1.3, 1]
const TOTAL = WEIGHTS.reduce((a, b) => a + b, 0)
const HEADLINES = [
  'If ordering gets faster, why doesn’t your coffee?',
  'Order. Make. Pick up.',
  'Now the morning rush arrives.',
  'Put another person on the register.',
  'Ordering is faster. Your coffee isn’t.',
  'We didn’t remove the wait. We moved it.',
  'And pickup? Only the odd hiccup.',
  'Where would you put the extra person?',
]
const capture = process.env.CAPTURE === '1'

async function goTo(page: Page, beat: number, local: number) {
  await page.evaluate(
    ({ beat, local, weights, total }) => {
      const track = document.querySelector<HTMLElement>('div[style*="svh"]')!
      const scrollable = track.offsetHeight - window.innerHeight
      const before = weights.slice(0, beat).reduce((a, b) => a + b, 0)
      window.scrollTo(0, track.getBoundingClientRect().top + window.scrollY + ((before + weights[beat] * local) / total) * scrollable)
    },
    { beat, local, weights: WEIGHTS, total: TOTAL },
  )
}

async function settle(page: Page, beat: number) {
  const group = page.locator(`[data-text="${beat}"]`)
  await expect(group).toHaveCSS('opacity', '1')
  await expect(group).toContainText(HEADLINES[beat])
  await page.waitForTimeout(1500) // let the reveal and tile transitions finish
}

const stage = (page: Page) => page.locator('[data-stage-area]')
const tile = (page: Page, name: string) => stage(page).locator('article', { hasText: name })

test.describe('welcome and pinned story on a wide screen', () => {
  test.skip(({ isMobile }) => isMobile, 'phones get the static story')
  test.use({ viewport: { width: 1440, height: 900 } })

  test('the hero zooms into the story when you scroll', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Where the waiting goes')
    if (capture) await page.screenshot({ path: 'docs/screenshots/0-hero.png' })
    const clip = () => page.locator('[data-hero-card]').evaluate((el) => getComputedStyle(el).clipPath)
    expect(await clip()).toContain('round 48px')
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.3))
    await expect.poll(clip).not.toContain('round 48px') // the card grows toward the edges
    await goTo(page, 0, 0.8)
    await expect(page.locator('[data-hero-frame]')).toBeHidden()
    await settle(page, 0)
  })

  test('the call to action carries you into the story', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'See the story' }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeGreaterThan(900)
    await settle(page, 0)
    await expect(stage(page)).toContainText('You walk in')
  })

  test('shows one idea per beat on the same three tiles, and restores them in reverse', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/')
    const shot = async (name: string) => {
      if (capture) await page.screenshot({ path: `docs/screenshots/${name}.png` })
    }
    const clock = () => page.locator('[data-clock]').innerText()

    await goTo(page, 0, 0.5)
    await settle(page, 0)
    await shot('1-opening')

    await goTo(page, 1, 0.5)
    await settle(page, 1)
    await expect(stage(page)).toContainText('Your order is at make drinks. Next: pick up.')
    await expect(tile(page, 'Make drinks')).toContainText('about 30 s each')
    await expect(tile(page, 'Make drinks')).toContainText('A barista makes your drink.')
    await shot('2-three-stops')

    await goTo(page, 2, 0.55)
    await settle(page, 2)
    const forwardClock = await clock()
    expect(forwardClock).toBe('5:40')
    await expect(stage(page)).toContainText('so both lines grow.')
    await goTo(page, 2, 0.99)
    await expect(stage(page)).toContainText('10:00. 17 coffees handed over, 13 customers still waiting.')
    await shot('3-rush')

    await goTo(page, 3, 0.6)
    await settle(page, 3)
    await expect(tile(page, 'Order & pay')).toContainText('+1 cashier')
    await expect(tile(page, 'Order & pay')).toContainText('was 4')
    await expect(stage(page)).toContainText('Same 30 orders. Same 10 minutes.')
    await shot('4-fix')

    await goTo(page, 4, 0.6)
    await settle(page, 4)
    await expect(tile(page, 'Make drinks')).toContainText('9')
    await expect(tile(page, 'Make drinks')).toContainText('was 5')
    await shot('5-surprise')

    await goTo(page, 5, 0.6)
    await settle(page, 5)
    await expect(tile(page, 'Make drinks')).toContainText('2 a minute')
    await shot('6-reveal')

    await goTo(page, 6, 0.6)
    await settle(page, 6)
    await expect(tile(page, 'Pick up')).toContainText('~3 a minute')
    await expect(tile(page, 'Pick up')).toContainText('1 being handed over')
    await shot('7-pickup')

    await goTo(page, 7, 0.6)
    await settle(page, 7)
    await expect(stage(page).locator('[data-clock]')).toHaveCount(0)
    await shot('8-your-turn')

    // Reverse scroll returns to exactly the same rush state.
    await goTo(page, 2, 0.55)
    await settle(page, 2)
    expect(await clock()).toBe(forwardClock)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('the chapter rail jumps between chapters and marks the current one', async ({ page }) => {
    await page.goto('/')
    await goTo(page, 1, 0.5)
    await settle(page, 1)
    const rail = page.getByRole('navigation', { name: 'Story chapters' })
    await expect(rail.getByRole('button', { name: 'One order, three stops' })).toHaveAttribute('aria-current', 'step')
    await rail.getByRole('button', { name: 'The reveal' }).click()
    await expect(page.locator('[data-text="5"]')).toHaveCSS('opacity', '1', { timeout: 5000 })
  })

  test('no page-level horizontal scroll, and the skip link is first and works', async ({ page }) => {
    await page.goto('/')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.keyboard.press('Tab')
    const link = page.getByRole('link', { name: 'Skip to experiment' }).first()
    await expect(link).toBeFocused()
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(4000)
  })
})

test.describe('static story (phones, tablets, reduced motion)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('shows the welcome and every beat as plain sections without overflow', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Where the waiting goes')
    for (const headline of HEADLINES) await expect(page.getByRole('heading', { name: headline })).toBeAttached()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (capture) await page.screenshot({ path: 'docs/screenshots/mobile-opening.png' })
  })

  test('on a phone the beat shows only the tile it is about', async ({ page }) => {
    await page.goto('/')
    await page.locator('#room-reveal').scrollIntoViewIfNeeded()
    const reveal = page.locator('#room-reveal').locator('..')
    await expect(reveal.locator('article', { hasText: 'Make drinks' })).toBeVisible()
    await expect(reveal.locator('article', { hasText: 'Order & pay' })).toBeHidden()
  })

  test('reduced motion gets the static story even on a wide screen', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.locator('[data-stage-area]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: HEADLINES[7] })).toBeAttached()
    await page.getByRole('button', { name: 'See the story' }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500)
  })
})

/** The headline and the stage must never overlap, at any window size the pinned story is used at. */
test.describe('no overlapping text in the pinned story', () => {
  test.skip(({ isMobile }) => isMobile, 'phones get the static story')
  const sizes = [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1100, height: 700 },
    { width: 960, height: 680 },
    { width: 1752, height: 666 },
    { width: 1920, height: 1080 },
  ]
  for (const size of sizes) {
    test(`${size.width}x${size.height}`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.setViewportSize(size)
      await page.goto('/')
      const problems: string[] = []
      for (let beat = 0; beat < HEADLINES.length; beat++) {
        await goTo(page, beat, 0.5)
        await settle(page, beat)
        const m = await page.evaluate((beat) => {
          const text = document.querySelector<HTMLElement>(`[data-text="${beat}"]`)!.getBoundingClientRect()
          const inner = document.querySelector<HTMLElement>('[data-stage-area] > div > div')!.getBoundingClientRect()
          return { textBottom: text.bottom, top: inner.top, bottom: inner.bottom, right: inner.right, vw: window.innerWidth, vh: window.innerHeight }
        }, beat)
        if (m.top < m.textBottom - 1) problems.push(`beat ${beat}: stage top ${Math.round(m.top)} is above text bottom ${Math.round(m.textBottom)}`)
        if (m.bottom > m.vh + 1) problems.push(`beat ${beat}: stage bottom ${Math.round(m.bottom)} is below the window ${m.vh}`)
        if (m.right > m.vw + 1) problems.push(`beat ${beat}: stage runs off the right edge`)
      }
      expect(problems, problems.join('\n')).toEqual([])
    })
  }
})
