import { describe, expect, it } from 'vitest'
import { BEAT_COUNT, RUSH_STEPS, beatStart, locate, rushStepIndex, travelPosition } from './timeline'

describe('scroll timeline', () => {
  it('maps the ends and every beat start to the right beat', () => {
    expect(locate(0)).toEqual({ beat: 0, local: 0 })
    expect(locate(1)).toEqual({ beat: BEAT_COUNT - 1, local: 1 })
    for (let b = 0; b < BEAT_COUNT; b++) expect(locate(beatStart(b) + 1e-9).beat).toBe(b)
  })

  it('never goes backwards as scroll increases, and is the same on the way back', () => {
    let last = -1
    for (let i = 0; i <= 1000; i++) {
      const { beat, local } = locate(i / 1000)
      const pos = beat + local
      expect(pos).toBeGreaterThanOrEqual(last)
      last = pos
    }
    expect(locate(0.4321)).toEqual(locate(0.4321))
  })

  it('clamps scroll outside 0 to 1', () => {
    expect(locate(-3).beat).toBe(0)
    expect(locate(9).beat).toBe(BEAT_COUNT - 1)
  })
})

describe('rush playback', () => {
  it('has a snapshot every 20 s from 0 to 600, from the engine', () => {
    expect(RUSH_STEPS).toHaveLength(31)
    expect(RUSH_STEPS[0].timeSeconds).toBe(0)
    expect(RUSH_STEPS[30].timeSeconds).toBe(600)
    expect(RUSH_STEPS[30].completed).toBe(17)
    expect(RUSH_STEPS[30].inShop).toBe(13)
  })

  it('starts at t=0, ends at t=600, and only moves forward with scroll', () => {
    expect(rushStepIndex(0)).toBe(0)
    expect(rushStepIndex(1)).toBe(30)
    let last = 0
    for (let i = 0; i <= 200; i++) {
      const idx = rushStepIndex(i / 200)
      expect(idx).toBeGreaterThanOrEqual(last)
      last = idx
    }
  })
})

describe('traced order', () => {
  it('rests on each station and ends on the last one', () => {
    expect(travelPosition(0)).toBe(0)
    expect(travelPosition(0.5)).toBeCloseTo(1, 5)
    expect(travelPosition(1)).toBeCloseTo(2, 5)
  })
})
