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

test.describe('focus rail and run bar', () => {
  test('the rail starts on Make drinks, and the arrow keys move focus within its bounds', async ({ page }) => {
    const section = await open(page)
    const slider = section.getByRole('slider', { name: 'Focus station' })
    await expect(slider).toHaveAttribute('aria-valuetext', 'Make drinks')
    await slider.focus()
    await page.keyboard.press('ArrowRight')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Pick up')
    await page.keyboard.press('ArrowRight') // bounded: no wrap-around
    await expect(slider).toHaveAttribute('aria-valuetext', 'Pick up')
    await page.keyboard.press('Home')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Order & pay')
    await page.keyboard.press('ArrowLeft')
    await expect(slider).toHaveAttribute('aria-valuetext', 'Order & pay')
    // The insight follows the focus.
    await expect(section.locator('[data-rail-card="0"]')).toContainText('What this setup means')
    await expect(section.locator('[data-rail-card="1"]')).not.toContainText('What this setup means')
  })

  test('clicking a station name, and the previous and next buttons, change focus', async ({ page }) => {
    const section = await open(page)
    const slider = section.getByRole('slider', { name: 'Focus station' })
    await section.getByRole('button', { name: 'Pick up', exact: true }).click()
    await expect(slider).toHaveAttribute('aria-valuetext', 'Pick up')
    await expect(section.getByRole('button', { name: 'Focus the next station' })).toBeDisabled()
    await section.getByRole('button', { name: 'Focus the previous station' }).click()
    await expect(slider).toHaveAttribute('aria-valuetext', 'Make drinks')
  })
})

test.describe('focus rail dragging and the arc', () => {
  test.skip(({ isMobile }) => isMobile, 'the arc and the rail handle drag are for wide screens')

  test('dragging the handle to either end snaps to that station', async ({ page }) => {
    const section = await open(page)
    const slider = section.getByRole('slider', { name: 'Focus station' })
    const thumb = (await slider.boundingBox())!
    const trackBox = (await slider.locator('xpath=..').boundingBox())!
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2)
    await page.mouse.down()
    await page.mouse.move(trackBox.x + trackBox.width - 4, thumb.y + thumb.height / 2, { steps: 12 })
    await page.mouse.up()
    await expect(slider).toHaveAttribute('aria-valuetext', 'Pick up')
    const t2 = (await slider.boundingBox())!
    await page.mouse.move(t2.x + t2.width / 2, t2.y + t2.height / 2)
    await page.mouse.down()
    await page.mouse.move(trackBox.x + 4, t2.y + t2.height / 2, { steps: 12 })
    await page.mouse.up()
    await expect(slider).toHaveAttribute('aria-valuetext', 'Order & pay')
  })

  test('the tickets lean away from the focused one and settle when focus moves', async ({ page }) => {
    const section = await open(page)
    const matrix = (i: number) => section.locator(`[data-rail-card="${i}"]`).evaluate((el) => getComputedStyle(el).transform)
    const identity = ['none', 'matrix(1, 0, 0, 1, 0, 0)']
    await page.waitForTimeout(700)
    expect(await matrix(1)).not.toBe('none') // the middle one sits level, with perspective
    expect(await matrix(0)).not.toBe(await matrix(2)) // the outer two lean opposite ways
    expect(identity).not.toContain(await matrix(0))
    await section.getByRole('button', { name: 'Pick up', exact: true }).click()
    await page.waitForTimeout(800)
    const focusedY = await section.locator('[data-rail-card="2"]').evaluate((el) => (el as HTMLElement).style.transform)
    expect(focusedY).not.toContain('rotateY(-') // the focused ticket has no lean
  })
})

test.describe('the run bar stays in reach', () => {
  test('Play, Restart and the clock stay on screen while you scroll through the workspace', async ({ page }) => {
    const section = await open(page)
    await page.evaluate(() => document.getElementById('experiment-heading')!.scrollIntoView())
    await expect(section.getByRole('button', { name: 'Play' })).toBeInViewport()
    await expect(section.getByRole('button', { name: 'Restart this setup' })).toBeInViewport()
    await expect(section.locator('output')).toBeInViewport()
    await page.evaluate(() => window.scrollBy(0, 700))
    await expect(section.getByRole('button', { name: 'Play' })).toBeInViewport()
    await section.getByRole('button', { name: 'Play' }).click()
    await expect.poll(async () => seconds(await section.locator('output').innerText())).toBeGreaterThan(3)
  })

  test('the skip link jumps to the run controls', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('link', { name: 'Skip to run controls' }).focus()
    await page.keyboard.press('Enter')
    await expect(section.getByRole('group', { name: 'Run controls' })).toBeInViewport()
  })
})

test.describe('explanations (Phase 5)', () => {
  test('the comparison explains why the extra cashier and the extra barista differ', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('button', { name: 'Compare the three setups' }).click()
    const panel = section.getByRole('region', { name: 'Full-run model results' })
    // The three plain-language ideas.
    await expect(panel).toContainText('The demand is fixed')
    await expect(panel).toContainText('The staffing is not')
    await expect(panel).toContainText('Only the slowest step counts')
    // Where the waiting went: text for every setup, not only bars.
    const waiting = panel.getByRole('figure')
    await expect(waiting).toContainText('Where the waiting went')
    await expect(waiting.getByRole('listitem').nth(1)).toContainText('Make drinks 145 s')
    await expect(waiting.getByRole('listitem').nth(1)).toContainText('Order & pay 0 s')
    await expect(waiting.getByRole('listitem').nth(2)).toContainText('Order & pay 58 s')
    await expect(waiting.getByRole('listitem').nth(2)).toContainText('Make drinks 0 s')
    // What happened, per setup, from the model's own numbers.
    await expect(panel).toContainText('Waiting at the register went from 58 s to 0 s. Waiting at the drinks station went from 87 s to 145 s.')
    await expect(panel).toContainText('Still 18 orders picked up by 10:00, the same as the original team.')
    await expect(panel).toContainText('Order & pay is the slowest step at 2.5 orders a minute, while 3 arrive.')
    await expect(panel).toContainText('23 orders are picked up by 10:00, 5 more than the original team.')
  })

  test('the comparison stays hidden until asked for, and the live run does not change it', async ({ page }) => {
    const section = await open(page)
    await expect(section.getByRole('region', { name: 'Full-run model results' })).toHaveCount(0)
    await section.getByRole('group', { name: 'Assign extra worker' }).getByRole('radio', { name: /Pick up/ }).check({ force: true })
    await section.getByRole('button', { name: 'Compare the three setups' }).click()
    const panel = section.getByRole('region', { name: 'Full-run model results' })
    await expect(panel).toContainText('23 of 30') // presets are unaffected by the custom run
    await section.getByRole('button', { name: 'Hide the comparison' }).click()
    await expect(panel).toHaveCount(0)
  })

  test('a finished custom run shows its own summary and is not compared with the presets', async ({ page }) => {
    test.setTimeout(120_000)
    await page.clock.install()
    await page.goto('/')
    const section = page.locator('#experiment')
    await section.scrollIntoViewIfNeeded()
    await section.getByRole('group', { name: 'Assign extra worker' }).getByRole('radio', { name: /Make drinks/ }).check({ force: true })
    await section.getByRole('button', { name: 'Play' }).click()
    // 10x speed: this setup finishes at 12:45 of simulated time, about 77 s of fake real time.
    for (let i = 0; i < 6 && (await section.getByRole('button', { name: 'Finished' }).count()) === 0; i++) await page.clock.runFor(20_000)
    await expect(section.getByRole('button', { name: 'Finished' })).toBeDisabled()
    const summary = section.getByRole('region', { name: 'This run, finished' })
    await expect(summary).toBeVisible()
    await expect(summary).toContainText('Custom · based on Original team')
    await expect(summary).toContainText('All 30 orders, run to the end')
    await expect(summary).toContainText('Picked up by 10:00')
    await expect(summary).toContainText('it is not compared with the three setups')
    await expect(section.getByText('Complete: all 30 orders have been picked up.')).toBeVisible()
  })

  test('the ordering constraint is explained: an extra barista still leaves the register below demand', async ({ page }) => {
    const section = await open(page)
    await section.getByRole('radio', { name: /Extra barista/ }).check({ force: true })
    await expect(section.getByText('Drinks can now keep up. Ordering becomes the next limit.')).toBeVisible()
    await section.getByRole('button', { name: 'Compare the three setups' }).click()
    const barista = section.getByRole('article').filter({ hasText: 'Extra barista' }).last()
    await expect(barista).toContainText('2.5 falls behind')
    await expect(barista).toContainText('4 keeps up')
  })
})
