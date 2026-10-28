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
    await expect(station(page, 'Make drinks')).toContainText('+1 worker')
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
    const runToEnd = async () => {
      await section.getByRole('button', { name: 'Play' }).click()
      // 30x speed: the slowest setup finishes at 15:39 of simulated time, about 31 s of fake real time.
      for (let i = 0; i < 6 && (await section.getByRole('button', { name: 'Finished' }).count()) === 0; i++) await page.clock.runFor(8_000)
      await expect(section.getByRole('button', { name: 'Finished' })).toBeDisabled()
    }

    await runToEnd()
    await expect(section).toContainText('18 of 30 coffees handed over by 10:00.')
    await expect(section).toContainText('Make drinks is the slowest step at 2 orders a minute, while 3 arrive.')
    await expect(tab(page, 'Original team')).toContainText('18 coffees by 10:00 · avg 3:34')

    await section.getByRole('button', { name: 'Try extra cashier next' }).click()
    await expect(section.getByRole('radio', { name: /Extra cashier/ })).toBeChecked()
    await runToEnd()
    await expect(section).toContainText('Waiting at the register went from 58 s to 0 s. Waiting at the drinks station went from 87 s to 145 s.')
    await expect(section).toContainText('Still 18 orders picked up by 10:00, the same as the original team.')
    await expect(tab(page, 'Extra cashier')).toContainText('18 coffees by 10:00 · avg 3:34')

    await section.getByRole('button', { name: 'Try extra barista next' }).click()
    await runToEnd()
    await expect(section).toContainText('23 orders are picked up by 10:00, 5 more than the original team.')
    await expect(tab(page, 'Extra barista')).toContainText('23 coffees by 10:00 · avg 2:07')
    await section.getByRole('button', { name: 'Try extra at pickup next' }).click()
    await runToEnd()
    await expect(section).toContainText('Pickup already had spare capacity, so the extra worker mostly stands idle.')
    await expect(tab(page, 'Extra at pickup')).toContainText('18 coffees by 10:00 · avg 3:34')
    await expect(section).toContainText('You have tried them all.')
    // The earlier results stay on their tabs.
    await expect(tab(page, 'Original team')).toContainText('18 coffees by 10:00')
  })

  test('the run bar stays in reach while you scroll through the controls', async ({ page }) => {
    const section = await open(page)
    await page.evaluate(() => document.querySelector('#experiment fieldset')!.scrollIntoView())
    await expect(section.getByRole('button', { name: 'Play' })).toBeInViewport()
    await expect(section.getByRole('button', { name: 'Restart this setup' })).toBeInViewport()
    await expect(section.locator('output')).toBeInViewport()
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
