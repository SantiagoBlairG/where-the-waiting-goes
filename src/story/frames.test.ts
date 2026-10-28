import { describe, expect, it } from 'vitest'
import { BEAT_COUNT } from './timeline'
import { frameFor, rushCaption, stopCaption, traceShare } from './frames'
import { baselineAtClose, cashierAtClose } from './storySnapshots'
import { RUSH_STEPS } from './timeline'

describe('story frames', () => {
  it('always shows the same three tiles, in order', () => {
    for (let b = 0; b < BEAT_COUNT; b++) expect(frameFor(b).tiles.map((t) => t.id)).toEqual(['order', 'drinks', 'pickup'])
  })

  it('opens with only the first stop, then all three', () => {
    expect(frameFor(0).tiles.map((t) => t.visible)).toEqual([true, false, false])
    for (let b = 1; b < BEAT_COUNT; b++) expect(frameFor(b).tiles.every((t) => t.visible)).toBe(true)
  })

  it('highlights the stop the traced order is at, and dims the others', () => {
    for (const stop of [0, 1, 2]) {
      const tiles = frameFor(1, { stop }).tiles
      expect(tiles.map((t) => t.highlight)).toEqual([0, 1, 2].map((i) => i === stop))
      expect(tiles.map((t) => t.dim)).toEqual([0, 1, 2].map((i) => i !== stop))
    }
    expect(stopCaption(1)).toContain('30 seconds')
  })

  it('reads the rush counts and clock from the engine', () => {
    const snap = RUSH_STEPS[15]
    const f = frameFor(2, { rush: snap })
    expect(f.tiles.map((t) => t.waiting)).toEqual(snap.stations.map((s) => s.queue))
    expect(f.track).toMatchObject({ kind: 'clock', seconds: snap.timeSeconds })
    expect(rushCaption(RUSH_STEPS[30])).toBe('10:00. 18 coffees handed over, 12 customers still waiting.')
  })

  it('shows the fix and the surprise as before and after on one tile', () => {
    const fix = frameFor(3).tiles[0]
    expect(fix).toMatchObject({ waiting: cashierAtClose.stations[0].queue, was: baselineAtClose.stations[0].queue, highlight: true })
    const surprise = frameFor(4).tiles[1]
    expect(surprise).toMatchObject({ waiting: 9, was: 5, highlight: true })
  })

  it('shows pickup working but never waiting, with its spare capacity', () => {
    const p = frameFor(6).tiles[2]
    expect(p).toMatchObject({ waiting: 0, inService: 1, workers: 1, highlight: true })
    expect(p.chip?.text).toBe('4 a minute, spare')
  })

  it('puts the reveal on the drinks, with its capacity from the model', () => {
    const drinks = frameFor(5).tiles[1]
    expect(drinks.chip?.text).toBe('2 drinks a minute')
    expect(frameFor(5).tiles.filter((t) => t.highlight)).toHaveLength(1)
  })

  it('centres the traced order on each tile', () => {
    expect([0, 1, 2].map(traceShare)).toEqual([1 / 6, 3 / 6, 5 / 6])
  })
})
