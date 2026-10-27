import { expect, it } from 'vitest'
import { beats } from './storyBeats'
import { baselineAtClose, baselineMidRush, cashierAtClose, startOfRush } from './storySnapshots'

const queues = (s: typeof baselineAtClose) => s.stations.map((st) => st.queue)

/** The beat copy states numbers; they must match what the engine produces. */
it('story snapshots match the figures quoted in the beat copy', () => {
  expect(queues(baselineMidRush)).toEqual([3, 2, 0])
  expect(baselineMidRush.completed).toBe(8)
  expect(baselineMidRush.inShop).toBe(8)

  expect(baselineAtClose.stations[0].queue).toBe(4)
  expect(baselineAtClose.stations[1].queue).toBe(5)
  expect(cashierAtClose.stations[0].queue).toBe(0)
  expect(cashierAtClose.stations[1].queue).toBe(9)
  for (const s of [baselineAtClose, cashierAtClose]) {
    expect(s.completed).toBe(18)
    expect(s.inShop).toBe(12)
  }
  expect(startOfRush.arrived).toBe(1) // the first order arrives at t = 0
})

it('keeps the copy honest about those numbers', () => {
  const text = Object.fromEntries(beats.map((b) => [b.id, `${b.support ?? ''} ${b.stageDescription}`]))
  expect(text.rush).toContain('3 orders wait at Order and pay')
  expect(text.surprise).toContain('9 orders are now waiting for coffee, up from 5')
  expect(text.surprise).toContain('18')
  expect(text.reveal).toContain('9 orders waiting')
})
