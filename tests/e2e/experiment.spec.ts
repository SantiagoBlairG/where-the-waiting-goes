import { expect, test, type Page } from '@playwright/test'

const seconds = (text: string) => {
  const [m, s] = text.trim().split(':').map(Number)
  return m * 60 + s
}

async function open(page: Page) {
  await page.goto('/')
  const section = page.locator('#experiment')
  await section.scrollIntoViewIfNeeded()
  await expect(section.getByRole('heading', { name: 'Move the extra person' })).toBeVisible()
  return section
}

test.describe('interactive workspace', () => {
  test('starts paused at 0:00 on the original team with the extra worker on the bench', async ({ page }) => {
    const section = await open(page)
    await expect(section.getByRole('radio', { name: /Original team/ })).toBeChecked()
    await expect(section.locator('output')).toHaveText('0:00')
    await expect(section.getByRole('button', { name: 'Play' })).toBeVisible()
    await expect(section.getByText('On the bench')).toBeVisible()
    await expect(section.getByText('Active workers').locator('..')).toContainText('3')
  })

  test('assigning with the keyboard control makes a labelled custom run and moves the worker', async ({ page }) => {
    const section = await open(page)
    const group = section.getByRole('group', { name: 'Assign extra worker' })
    await group.getByRole('radio', { name: /Make drinks/ }).check({ force: true })
    await expect(section.getByText('Custom · based on Original team')).toBeVisible()
    await expect(section.getByRole('article', { name: 'Make drinks' })).toContainText('2 workers')
    await expect(section.getByText('Working at Make drinks')).toBeVisible()
    await expect(section.getByText('Active workers').locator('..')).toContainText('4')
    // Moving back to off duty is also a choice, and the run stays custom.
    await group.getByRole('radio', { name: /Off duty/ }).check({ force: true })
    await expect(section.getByRole('article', { name: 'Make drinks' })).toContainText('1 worker')
    await expect(section.getByText('Custom · based on Original team')).toBeVisible()
  })

  test('choosing a setup resets the run and clears the custom label', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('group', { name: 'Assign extra worker' }).getByRole('radio', { name: /Pick up/ }).check({ force: true })
    await section.getByRole('button', { name: 'Play' }).click()
    await expect.poll(async () => seconds(await section.locator('output').innerText())).toBeGreaterThan(5)
    await section.getByRole('radio', { name: /Extra barista/ }).check({ force: true })
    await expect(section.locator('output')).toHaveText('0:00')
    await expect(section.getByRole('button', { name: 'Play' })).toBeVisible()
    await expect(section.getByText('Extra barista').first()).toBeVisible()
    await expect(section.getByText(/Custom/)).toHaveCount(0)
    await expect(section.getByRole('article', { name: 'Make drinks' })).toContainText('2 workers')
  })

  test('play advances the clock and pause stops it', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'Play' }).click()
    await expect.poll(async () => seconds(await section.locator('output').innerText())).toBeGreaterThan(8)
    await section.getByRole('button', { name: 'Pause' }).click()
    const paused = await section.locator('output').innerText()
    await page.waitForTimeout(900)
    expect(await section.locator('output').innerText()).toBe(paused)
    await expect(section.getByText('Paused.', { exact: true })).toBeVisible()
  })

  test('restart this setup keeps the chosen worker position and pauses at 0:00', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('group', { name: 'Assign extra worker' }).getByRole('radio', { name: /Order & pay/ }).check({ force: true })
    await section.getByRole('button', { name: 'Play' }).click()
    await expect.poll(async () => seconds(await section.locator('output').innerText())).toBeGreaterThan(5)
    await section.getByRole('button', { name: 'Restart this setup' }).click()
    await expect(section.locator('output')).toHaveText('0:00')
    await expect(section.getByRole('button', { name: 'Play' })).toBeVisible()
    await expect(section.getByRole('article', { name: 'Order & pay' })).toContainText('2 workers')
  })

  test('a station dialog pauses the run, closes with Escape, restores focus and resumes', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'Play' }).click()
    await page.waitForTimeout(600)
    const trigger = section.getByRole('button', { name: 'Look closer at Make drinks' })
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
    await expect.poll(async () => seconds(await section.locator('output').innerText())).toBeGreaterThan(seconds(during)) // resumed
  })

  test('the orders list is reachable from the dots lane and lists every arrived order', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'Play' }).click()
    await expect.poll(async () => seconds(await section.locator('output').innerText()), { timeout: 20_000 }).toBeGreaterThan(45)
    await section.getByRole('button', { name: 'Pause' }).click()
    await section.getByRole('button', { name: 'See the orders at Order & pay' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('table')).toBeVisible()
    await expect(dialog.getByRole('row')).not.toHaveCount(1)
    await expect(dialog).toContainText('#1')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('the full-run comparison shows the plan fixtures and is labelled', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'Compare the three setups' }).click()
    const panel = section.getByRole('region', { name: 'Full-run model results' })
    await expect(panel).toBeVisible()
    await expect(panel).toContainText('18 of 30')
    await expect(panel).toContainText('23 of 30')
    await expect(panel).toContainText('3:34') // 214 s
    await expect(panel).toContainText('2:07') // 127 s
    await expect(panel).toContainText('15:39')
    await expect(panel).toContainText('12:45')
    await expect(panel).toContainText('three people')
  })

  test('no horizontal scroll in the workspace', async ({ page }) => {
    await open(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})

test.describe('dragging the extra worker', () => {
  test.skip(({ isMobile }) => isMobile, 'touch devices use the assign control; the mouse drag is tested on desktop')

  async function drag(page: Page, toSelector: string, offsetY = 140) {
    const handle = page.locator('#experiment [aria-hidden="true"].cursor-grab')
    await handle.scrollIntoViewIfNeeded()
    const from = (await handle.boundingBox())!
    const to = (await page.locator(toSelector).boundingBox())!
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await page.mouse.down()
    await page.mouse.move(to.x + to.width / 2, to.y + offsetY, { steps: 14 })
    return { release: async () => { await page.mouse.up(); await page.waitForTimeout(500) } }
  }

  test('dropping on a station assigns the worker, previews capacity, and snaps the badge back', async ({ page }) => {
    const section = await open(page)
    const d = await drag(page, '#experiment [data-drop="pickup"]')
    await expect(section.locator('article p', { hasText: 'Capacity if assigned: 8 orders/min' })).toBeVisible() // preview while over the station
    await d.release()
    await expect(section.getByRole('article', { name: 'Pick up' })).toContainText('2 workers')
    await expect(section.getByText('Working at Pick up')).toBeVisible()
    await expect(section.getByText('Custom · based on Original team')).toBeVisible()
    const handle = page.locator('#experiment [aria-hidden="true"].cursor-grab')
    const transform = await handle.evaluate((el) => getComputedStyle(el).transform)
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform)
  })

  test('an invalid drop returns the worker and changes nothing', async ({ page }) => {
    const section = await open(page)
    const d = await drag(page, '#experiment-heading', 0)
    await d.release()
    await expect(section.getByText('On the bench')).toBeVisible()
    await expect(section.getByText(/Custom/)).toHaveCount(0)
    await expect(section.getByRole('article', { name: 'Make drinks' })).toContainText('1 worker')
  })

  test('dropping on the bench sends the worker off duty', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('group', { name: 'Assign extra worker' }).getByRole('radio', { name: /Make drinks/ }).check({ force: true })
    const d = await drag(page, '#experiment [data-drop="off"]', 60)
    await d.release()
    await expect(section.getByText('On the bench')).toBeVisible()
    await expect(section.getByRole('article', { name: 'Make drinks' })).toContainText('1 worker')
  })
})
