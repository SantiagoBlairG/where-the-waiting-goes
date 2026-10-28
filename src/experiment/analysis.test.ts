import { describe, expect, it } from 'vitest'
import { PRESETS, fullRunResult } from '@/simulation/presets'
import { DEMAND_PER_MINUTE, explainPreset, slowestStep, stationLoads, waitShares } from './analysis'

const [original, cashier, barista] = PRESETS
const results = Object.fromEntries(PRESETS.map((p) => [p.id, fullRunResult(p)]))

describe('demand versus capacity', () => {
  it('demand is three orders a minute in every setup', () => {
    expect(DEMAND_PER_MINUTE).toBe(3)
  })

  it('shows which station limits each setup', () => {
    expect(stationLoads('off').map((l) => l.perMinute)).toEqual([2.5, 2, 3])
    expect(slowestStep('off').id).toBe('drinks')
    expect(slowestStep('order').id).toBe('drinks') // an extra cashier does not help the drinks
    expect(slowestStep('drinks').id).toBe('order') // an extra barista makes ordering the next limit
    expect(slowestStep('pickup').id).toBe('drinks')
  })

  it('an extra barista still leaves ordering below demand, which is why a line remains at the register', () => {
    const order = stationLoads('drinks')[0]
    expect(order.perMinute).toBe(2.5)
    expect(order.perMinute).toBeLessThan(DEMAND_PER_MINUTE)
    expect(order.keepsUp).toBe(false)
    expect(stationLoads('drinks')[1].keepsUp).toBe(true)
  })

  it('the model agrees: the register still has a measured wait with an extra barista', () => {
    expect(results.barista.queueWaitSeconds[0]).toBeGreaterThan(0)
    expect(results.barista.queueWaitSeconds[1]).toBe(0)
    expect(results.cashier.queueWaitSeconds[0]).toBe(0)
    expect(results.cashier.queueWaitSeconds[1]).toBeGreaterThan(results.original.queueWaitSeconds[1])
  })
})

describe('explanations', () => {
  const explain = (p: (typeof PRESETS)[number]) => explainPreset(p, results[p.id], results.original)

  it('explains the original team', () => {
    const lines = explain(original)
    expect(lines[0]).toContain('Make drinks is the slowest step at 2 orders a minute, while 3 arrive.')
    expect(lines[2]).toContain('17 orders are picked up by 10:00')
  })

  it('explains the extra cashier: the wait moved to the drinks, and only one more coffee came out', () => {
    const lines = explain(cashier)
    expect(lines[0]).toContain('Make drinks is the slowest step')
    expect(lines[1]).toContain('the register went from 58 s to 0 s')
    expect(lines[1]).toContain('the drinks station went from 91 s to 130 s')
    expect(lines[2]).toContain('18 orders are picked up by 10:00, 1 more than the original team')
  })

  it('explains the extra barista: drinks keep up, the register becomes the limit, four more orders', () => {
    const lines = explain(barista)
    expect(lines[0]).toContain('Order & pay is the slowest step at 2.5 orders a minute, while 3 arrive.')
    expect(lines[1]).toContain('the drinks station went from 91 s to 0 s')
    expect(lines[1]).not.toContain('the register went')
    expect(lines[2]).toContain('21 orders are picked up by 10:00, 4 more than the original team')
  })

  it('wait shares add up to the measured waits', () => {
    const shares = waitShares(results.cashier)
    expect(shares.map((s) => Math.round(s.seconds))).toEqual([0, 130, 8])
  })
})
