import { expect, test, type Page } from '@playwright/test'

/** Scroll length of each beat in viewport heights. Keep in sync with src/story/timeline.ts. */
const WEIGHTS = [1, 1.2, 2.6, 1.3, 1.2, 1.3, 1]
const TOTAL = WEIGHTS.reduce((a, b) => a + b, 0)
const HEADLINES = [
  'If ordering gets faster, why doesn’t your coffee?',
  'Order. Make. Pick up.',
  'Now the morning rush arrives.',
  'Put another person on the register.',
  'Ordering is faster. Your coffee isn’t.',
  'We didn’t remove the wait. We moved it.',
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
  await page.waitForTimeout(1900) // let the reveal and scene fade finish
}

test.describe('pinned story on a wide screen', () => {
  test.skip(({ isMobile }) => isMobile, 'phones get the static story')
  test.use({ viewport: { width: 1440, height: 900 } })

  test('shows the right words and numbers at every beat, and restores them in reverse', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/')
    await expect(page.locator('[data-text="0"]')).toContainText(HEADLINES[0])

    const shot = async (name: string) => {
      if (capture) await page.screenshot({ path: `docs/screenshots/${name}.png` })
    }
    const clock = () => page.locator('[data-clock]').innerText()

    await page.waitForTimeout(2000)
    await shot('1-opening')

    await goTo(page, 1, 0.5)
    await settle(page, 1)
    await expect(page.locator('[data-scene="process"]')).toContainText('Your order is here')
    await shot('2-three-stops')

    await goTo(page, 2, 0.55)
    await settle(page, 2)
    const forwardClock = await clock()
    expect(forwardClock).toContain('5:40')
    await goTo(page, 2, 0.97)
    await page.waitForTimeout(1200)
    await shot('3-rush')

    await goTo(page, 3, 0.6)
    await settle(page, 3)
    await expect(page.locator('[data-row2]')).toContainText('Replay the same rush with an extra cashier')
    await shot('4-fix')

    await goTo(page, 4, 0.6)
    await settle(page, 4)
    await expect(page.locator('[data-scene="compare"]')).toContainText('Both cafés: 18 picked up, 12 still in the shop.')
    await expect(page.locator('[data-scene="compare"]')).toContainText('9')
    await shot('5-surprise')

    await goTo(page, 5, 0.6)
    await settle(page, 5)
    await expect(page.locator('[data-scene="process"]')).toContainText('2 orders/min')
    await shot('6-reveal')

    await goTo(page, 6, 0.9)
    await settle(page, 6)
    await expect(page.locator('[data-clock]')).toContainText('Start of the rush. Paused.')
    await expect(page.locator('[data-bench]')).toBeVisible()
    await shot('7-your-turn')

    // Reverse scroll returns to exactly the same rush state.
    await goTo(page, 2, 0.55)
    await settle(page, 2)
    expect(await clock()).toBe(forwardClock)

    expect(errors, errors.join('\n')).toEqual([])
  })

  test('no page-level horizontal scroll, and the skip link reaches the experiment', async ({ page }) => {
    await page.goto('/')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.locator('[data-cue]').getByRole('link', { name: 'Skip to experiment' }).click()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(4000)
  })

  test('the skip link is the first thing keyboard users reach, and it works', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const link = page.getByRole('link', { name: 'Skip to experiment' }).first()
    await expect(link).toBeFocused()
    await page.keyboard.press('Enter')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(4000)
  })
})

test.describe('static story (phones, tablets, reduced motion)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('shows every beat as plain sections without overflow', async ({ page }) => {
    await page.goto('/')
    for (const headline of HEADLINES) await expect(page.getByRole('heading', { name: headline })).toBeAttached()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (capture) await page.screenshot({ path: 'docs/screenshots/mobile-opening.png' })
  })

  test('reduced motion gets the static story even on a wide screen', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.locator('[data-stage-area]')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: HEADLINES[6] })).toBeAttached()
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
  ]
  for (const size of sizes) {
    test(`${size.width}x${size.height}`, async ({ page }) => {
      test.setTimeout(90_000)
      await page.setViewportSize(size)
      await page.goto('/')
      await page.waitForTimeout(1500)
      const problems: string[] = []
      for (let beat = 0; beat < HEADLINES.length; beat++) {
        await goTo(page, beat, 0.5)
        await settle(page, beat)
        const m = await page.evaluate((beat) => {
          const text = document.querySelector<HTMLElement>(`[data-text="${beat}"]`)!.getBoundingClientRect()
          const scene = [...document.querySelectorAll<HTMLElement>('[data-scene]')].find((e) => +getComputedStyle(e).opacity > 0.9)!
          const inner = scene.firstElementChild!.getBoundingClientRect()
          const clock = document.querySelector<HTMLElement>('[data-clock]')?.getBoundingClientRect()
          return {
            textBottom: text.bottom,
            sceneTop: inner.top,
            sceneBottom: inner.bottom,
            sceneRight: inner.right,
            clockLeft: clock?.left ?? null,
            clockBottom: clock?.bottom ?? null,
            vw: window.innerWidth,
            vh: window.innerHeight,
          }
        }, beat)
        if (m.sceneTop < m.textBottom - 1) problems.push(`beat ${beat}: stage top ${Math.round(m.sceneTop)} is above text bottom ${Math.round(m.textBottom)}`)
        if (m.sceneBottom > m.vh + 1) problems.push(`beat ${beat}: stage bottom ${Math.round(m.sceneBottom)} is below the window ${m.vh}`)
        if (m.sceneRight > m.vw + 1) problems.push(`beat ${beat}: stage runs off the right edge`)
      }
      expect(problems, problems.join('\n')).toEqual([])
    })
  }
})
