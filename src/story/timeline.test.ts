import { describe, expect, it } from 'vitest'
import { BEAT_COUNT, RUSH_STEPS, beatRest, beatStart, locate, restPoints, rushFreeRange, rushStepIndex, snapTarget, travelPosition } from './timeline'

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

describe('scroll magnet', () => {
  const points = [0, 10, 20, 40]

  it('settles forward on the next point, or back on one only just passed', () => {
    expect(snapTarget(13, points, 1)).toBe(20)
    expect(snapTarget(11, points, 1)).toBe(10) // 1 past 10 is under 12% of the gap: back
    expect(snapTarget(17, points, -1)).toBe(10)
    expect(snapTarget(19, points, -1)).toBe(20) // only just passed going back
    expect(snapTarget(14, points, 0)).toBe(10)
    expect(snapTarget(50, points, 1)).toBe(40)
  })

  it('leaves the rush free between its start and its end', () => {
    expect(snapTarget(25, points, 1, [22, 38])).toBe(25)
    expect(snapTarget(21, points, 1, [22, 38])).toBe(20) // just past the rush start, before the free part
    expect(snapTarget(39, points, 1, [22, 38])).toBe(40) // past the free part: on to the rush end
  })

  it('rests every chapter where its state is settled: once, at the three stops, or at the rush ends', () => {
    const r = restPoints()
    expect(r).toHaveLength(BEAT_COUNT + 3)
    expect([...r].sort((a, b) => a - b)).toEqual(r)
    for (let b = 0; b < BEAT_COUNT; b++) expect(locate(beatRest(b)).beat).toBe(b)
    // The traced order is standing still at each of its rest points.
    for (const p of r.slice(1, 4)) {
      const { local } = locate(p)
      expect(travelPosition(local)).toBeCloseTo(Math.round(travelPosition(local)), 5)
    }
    // The rush rests on 0:00 and on 10:00, and is free in between.
    const [a, b] = rushFreeRange()
    expect(rushStepIndex(locate(r[4]).local)).toBe(0)
    expect(rushStepIndex(locate(r[5]).local)).toBe(RUSH_STEPS.length - 1)
    expect(a).toBeGreaterThan(r[4])
    expect(b).toBeLessThan(r[5])
  })
})

describe('traced order', () => {
  it('rests on each station and ends on the last one', () => {
    expect(travelPosition(0)).toBe(0)
    expect(travelPosition(0.5)).toBeCloseTo(1, 5)
    expect(travelPosition(1)).toBeCloseTo(2, 5)
  })
})
