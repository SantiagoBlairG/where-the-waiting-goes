import { expect, test, type Page } from '@playwright/test'

const seconds = (text: string) => {
  const [m, s] = text.trim().split(':').map(Number)
  return m * 60 + s
}

async function open(page: Page) {
  await page.goto('/')
  const section = page.locator('#experiment')
  await page.evaluate(() => document.getElementById('experiment')!.scrollIntoView())
  await expect(section.getByRole('heading', { name: 'Run the rush yourself' })).toBeVisible()
  return section
}

const tab = (page: Page, name: string) => page.locator('#experiment fieldset label', { hasText: name })
const station = (page: Page, name: string) => page.locator('#experiment').getByRole('button', { name: new RegExp(`^${name}`) })

test.describe('the experiment', () => {
  test('starts paused at 0:00 on the original team, with nothing run yet', async ({ page }) => {
    const section = await open(page)
    await expect(section.getByRole('radio', { name: /Original team/ })).toBeChecked()
    await expect(section.locator('output')).toHaveText('0:00')
    await expect(section.getByRole('button', { name: 'Play' })).toBeVisible()
    for (const name of ['Original team', 'Extra cashier', 'Extra barista', 'Extra at pickup']) await expect(tab(page, name)).toContainText('Not run yet')
    await expect(station(page, 'Make drinks')).toContainText('1 worker')
    await expect(station(page, 'Pick up')).toContainText('Drinks to hand over')
  })

  test('choosing a setup resets the run and moves the extra person', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'Play' }).click()
    await expect.poll(async () => seconds(await section.locator('output').innerText())).toBeGreaterThan(5)
    await section.getByRole('radio', { name: /Extra barista/ }).check({ force: true })
    await expect(section.locator('output')).toHaveText('0:00')
    await expect(section.getByRole('button', { name: 'Play' })).toBeVisible()
    await expect(station(page, 'Make drinks')).toContainText('2 workers')
    await expect(station(page, 'Make drinks')).toContainText('See details')
  })

  test('play advances the clock, pause stops it, restart returns to 0:00', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'Play' }).click()
    await expect.poll(async () => seconds(await section.locator('output').innerText())).toBeGreaterThan(20)
    await section.getByRole('button', { name: 'Pause' }).click()
    const paused = await section.locator('output').innerText()
    await page.waitForTimeout(900)
    expect(await section.locator('output').innerText()).toBe(paused)
    await expect(section.getByRole('button', { name: 'Resume' })).toBeVisible()
    await section.getByRole('button', { name: 'Restart this setup' }).click()
    await expect(section.locator('output')).toHaveText('0:00')
    await expect(section.getByRole('button', { name: 'Play' })).toBeVisible()
  })

  test('Play brings the whole stage into view above the run bar', async ({ page, isMobile }) => {
    test.skip(isMobile, 'on a phone the stacked stage is taller than the screen')
    const section = await open(page)
    await section.getByRole('button', { name: 'Play' }).click()
    await page.waitForTimeout(1200)
    await expect(station(page, 'Order & pay')).toBeInViewport({ ratio: 1 })
    const bar = (await section.getByRole('group', { name: 'Run controls' }).boundingBox())!
    const tileBottom = (await station(page, 'Order & pay').boundingBox())!
    expect(tileBottom.y + tileBottom.height).toBeLessThanOrEqual(bar.y + 1)
  })

  test('a station opens its details, pauses the run, closes with Escape, restores focus and resumes', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'Play' }).click()
    await page.waitForTimeout(600)
    const trigger = station(page, 'Make drinks')
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Service time')
    await expect(dialog).toContainText('30 s')
    const during = await section.locator('output').innerText()
    await page.waitForTimeout(900)
    expect(await section.locator('output').innerText()).toBe(during) // held while open
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect.poll(async () => seconds(await section.locator('output').innerText())).toBeGreaterThan(seconds(during))
  })

  test('each finished run writes the model result on its own tab, so the four compare side by side', async ({ page }) => {
    test.setTimeout(300_000)
    await page.clock.install()
    const section = await open(page)
    // A run started from the results card plays by itself; otherwise press Play.
    const runToEnd = async (alreadyRunning = false) => {
      if (!alreadyRunning) await section.getByRole('button', { name: 'Play' }).click()
      // 45x speed: the slowest setup finishes at 16:22 of simulated time, about 22 s of fake real time.
      for (let i = 0; i < 6 && (await section.getByRole('button', { name: 'Finished' }).count()) === 0; i++) await page.clock.runFor(8_000)
      await expect(section.getByRole('button', { name: 'Finished' })).toBeDisabled()
    }

    await runToEnd()
    const results = section.getByRole('region', { name: 'Results' })
    // The finished run's result is brought into view by itself.
    await expect(results).toBeInViewport()
    await expect(results).toContainText('Original team: 17 of 30 coffees handed over by 10:00.')
    await expect(results).toContainText('All 30 coffees served in 16:22')
    await expect(results).toContainText('Make drinks is the slowest step at 2 orders a minute, while 3 arrive.')
    await expect(tab(page, 'Original team')).toContainText('17 coffees by 10:00 · avg 3:51')

    await section.getByRole('button', { name: 'Run extra cashier next' }).click()
    // The card's button selects the setup, brings the stage back into view and starts the run.
    await expect(section.getByRole('button', { name: 'Pause' })).toBeVisible()
    await expect(station(page, 'Order & pay')).toBeInViewport()
    await expect(section.getByRole('radio', { name: /Extra cashier/ })).toBeChecked()
    await runToEnd(true)
    await expect(results).toContainText('Waiting at the register went from 58 s to 0 s. Waiting at the drinks station went from 91 s to 130 s.')
    await expect(results).toContainText('18 orders are picked up by 10:00, 1 more than the original team.')
    await expect(results).toContainText('All 30 coffees served in 16:12 · 0:10 sooner than the original team')
    await expect(tab(page, 'Extra cashier')).toContainText('18 coffees by 10:00 · avg 3:32')

    await section.getByRole('button', { name: 'Run extra barista next' }).click()
    await runToEnd(true)
    await expect(results).toContainText('21 orders are picked up by 10:00, 4 more than the original team.')
    await expect(results).toContainText('All 30 coffees served in 13:40 · 2:42 sooner than the original team')
    await expect(tab(page, 'Extra barista')).toContainText('21 coffees by 10:00 · avg 2:21')
    await section.getByRole('button', { name: 'Run extra at pickup next' }).click()
    await runToEnd(true)
    await expect(results).toContainText('Waiting at pick up went from 10 s to 0 s.')
    await expect(tab(page, 'Extra at pickup')).toContainText('17 coffees by 10:00 · avg 3:42')
    await expect(results).toContainText('You have tried them all.')
    // The earlier results stay on their tabs, and the card switches between them in place.
    await expect(tab(page, 'Original team')).toContainText('17 coffees by 10:00')
    await results.getByRole('button', { name: 'Extra barista' }).click()
    await expect(results).toContainText('Extra barista: 21 of 30 coffees handed over by 10:00.')
    // The explanation folds away and back.
    await results.getByRole('button', { name: 'Hide why' }).click()
    await expect(results.getByText('Order & pay is the slowest step')).toBeHidden()
    await results.getByRole('button', { name: 'Show why' }).click()
    await expect(results.getByText('Order & pay is the slowest step')).toBeVisible()
  })

  test('the run bar stays in reach while you scroll through the controls', async ({ page }) => {
    const section = await open(page)
    await page.evaluate(() => document.querySelector('#experiment fieldset')!.scrollIntoView())
    await expect(section.getByRole('button', { name: 'Play' })).toBeInViewport()
    await expect(section.getByRole('button', { name: 'Restart this setup' })).toBeInViewport()
    await expect(section.locator('output')).toBeInViewport()
  })

  test('the results card suggests a setup not yet run, even when another one is selected', async ({ page }) => {
    test.setTimeout(120_000)
    await page.clock.install()
    const section = await open(page)
    await section.getByRole('radio', { name: /Extra barista/ }).check({ force: true })
    await section.getByRole('button', { name: 'Play' }).click()
    for (let i = 0; i < 6 && (await section.getByRole('button', { name: 'Finished' }).count()) === 0; i++) await page.clock.runFor(8_000)
    const results = section.getByRole('region', { name: 'Results' })
    await expect(results).toContainText('Extra barista: 21 of 30')
    // Not run yet: the original team comes first.
    await expect(results.getByRole('button', { name: 'Run original team next' })).toBeVisible()
    // Selecting a different setup that has not been run does not change the suggestion to a played one.
    await section.getByRole('radio', { name: /Extra cashier/ }).check({ force: true })
    await expect(results.getByRole('button', { name: 'Run original team next' })).toBeVisible()
  })

  test('how this works opens and closes', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'How this works' }).click()
    await expect(page.getByRole('dialog')).toContainText('30 customers')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('no horizontal scroll in the experiment', async ({ page }) => {
    await open(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
