import { describe, expect, it } from 'vitest'
import { PRESETS } from '@/simulation/presets'
import { snapshotAt } from '@/simulation/engine'
import { activeWorkers, capacityIfExtraAt, insightFor, mmss, placementLabel } from './helpers'

describe('capacity if assigned', () => {
  it('uses the model formula for each station', () => {
    expect(capacityIfExtraAt('order', 'off')).toBe(2.5)
    expect(capacityIfExtraAt('order', 'order')).toBe(5)
    expect(capacityIfExtraAt('drinks', 'off')).toBe(2)
    expect(capacityIfExtraAt('drinks', 'drinks')).toBe(4)
    expect(capacityIfExtraAt('pickup', 'pickup')).toBe(8)
    expect(capacityIfExtraAt('drinks', 'order')).toBe(2) // an extra worker elsewhere does not help drinks
  })
})

describe('active workers', () => {
  it('counts three, or four with the extra worker on duty', () => {
    expect(activeWorkers(snapshotAt(PRESETS[0].config, 0))).toBe(3)
    expect(activeWorkers(snapshotAt(PRESETS[1].config, 0))).toBe(4)
    expect(activeWorkers(snapshotAt(PRESETS[2].config, 0))).toBe(4)
  })
})

describe('insights', () => {
  it('says something specific for every placement, and never promises an empty queue', () => {
    for (const p of ['order', 'drinks', 'pickup', 'off'] as const) {
      const text = insightFor(p)
      expect(text.length).toBeGreaterThan(20)
      expect(text.toLowerCase()).not.toContain('no queue')
    }
    expect(insightFor('drinks')).toContain('Ordering becomes the next limit')
    expect(insightFor('pickup')).toContain('spare capacity')
  })

  it('quotes the drinks rate from the model, not from memory', () => {
    // The sentence says 2 orders a minute; the model agrees.
    expect(capacityIfExtraAt('drinks', 'off')).toBe(2)
    expect(insightFor('off')).toContain('2 orders a minute')
  })
})

describe('formatting', () => {
  it('formats clock times and station names', () => {
    expect(mmss(0)).toBe('0:00')
    expect(mmss(939)).toBe('15:39')
    expect(placementLabel('off')).toBe('Off duty')
    expect(placementLabel('drinks')).toBe('Make drinks')
  })
})
