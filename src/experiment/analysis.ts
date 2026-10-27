import { ARRIVAL_INTERVAL_SECONDS, STATIONS, type StationId } from '@/simulation/config'
import type { FullRunResult, Preset } from '@/simulation/presets'
import type { ExtraPlacement } from '@/simulation/types'
import { capacityIfExtraAt } from './helpers'

/**
 * Plain-language explanations of the results, built only from the model's own numbers: the fixed
 * demand, each station's capacity, and the measured waits. Nothing here is typed in by hand, so
 * the words cannot drift from the simulation.
 */

/** Orders arriving per minute: fixed in every setup. */
export const DEMAND_PER_MINUTE = 60 / ARRIVAL_INTERVAL_SECONDS

export type StationLoad = { id: StationId; name: string; perMinute: number; keepsUp: boolean }

/** Capacity of each station with the extra worker at `placement`, against the fixed demand. */
export function stationLoads(placement: ExtraPlacement): StationLoad[] {
  return STATIONS.map((s) => {
    const perMinute = capacityIfExtraAt(s.id, placement)
    return { id: s.id, name: s.name, perMinute, keepsUp: perMinute >= DEMAND_PER_MINUTE }
  })
}

/** The station with the smallest capacity: the one that limits the whole process. */
export function slowestStep(placement: ExtraPlacement): StationLoad {
  return stationLoads(placement).reduce((a, b) => (b.perMinute < a.perMinute ? b : a))
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/** The register is called "the register" in plain speech. */
const spoken = (id: StationId, name: string) => (id === 'order' ? 'the register' : id === 'drinks' ? 'the drinks station' : name.toLowerCase())

/**
 * Three short sentences for one setup: what limits it, what happened to the waits compared with
 * the original team, and what it means for the number of orders picked up.
 */
export function explainPreset(preset: Preset, result: FullRunResult, baseline: FullRunResult): string[] {
  const placement = preset.config.extra
  const slow = slowestStep(placement)
  const lines = [
    `${slow.name} is the slowest step at ${fmt(slow.perMinute)} orders a minute, while ${fmt(DEMAND_PER_MINUTE)} arrive.`,
  ]
  if (preset.id === 'original') {
    lines.push('One person at each step, so the register and the drinks both fall behind.')
  } else {
    const changes = STATIONS.map((s, i) => ({ s, before: Math.round(baseline.queueWaitSeconds[i]), after: Math.round(result.queueWaitSeconds[i]) })).filter(
      (c) => c.before !== c.after,
    )
    lines.push(
      changes.length
        ? changes.map((c) => `Waiting at ${spoken(c.s.id, c.s.name)} went from ${c.before} s to ${c.after} s.`).join(' ')
        : 'No station’s waiting time changed.',
    )
  }
  const diff = result.completedAtClose - baseline.completedAtClose
  lines.push(
    preset.id === 'original'
      ? `${result.completedAtClose} orders are picked up by 10:00.`
      : diff === 0
        ? `Still ${result.completedAtClose} orders picked up by 10:00, the same as the original team.`
        : `${result.completedAtClose} orders are picked up by 10:00, ${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} than the original team.`,
  )
  return lines
}

/** The share of all waiting that happened at each station, for the "where the waiting went" bars. */
export function waitShares(result: FullRunResult): { id: StationId; name: string; seconds: number }[] {
  return STATIONS.map((s, i) => ({ id: s.id, name: s.name, seconds: result.queueWaitSeconds[i] }))
}
