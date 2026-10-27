import { Simulation } from '@/simulation/engine'
import { PRESETS, type Preset, type PresetId } from '@/simulation/presets'
import type { ExtraPlacement, Snapshot } from '@/simulation/types'

/**
 * The experiment's run lifecycle, with no React and no clock of its own: the caller feeds it
 * elapsed real milliseconds. Playback speed only scales how fast simulated time advances; it
 * can never change a result, because the engine settles every event in a fixed order.
 *
 * Modes (plan.md §8): paused, running, complete. ("Story" mode belongs to the page.)
 */
export type RunMode = 'paused' | 'running' | 'complete'
export type Speed = 1 | 10

export type RunAction = { timeMs: number; to: ExtraPlacement }

/** Real time is clamped per tick so a stalled frame can never make the run jump ahead. */
export const MAX_TICK_MS = 100

export function presetById(id: PresetId): Preset {
  return PRESETS.find((p) => p.id === id) as Preset
}

export class ExperimentSession {
  presetId: PresetId
  /** True once the visitor has moved the extra worker. The run is then "Custom". */
  custom = false
  speed: Speed = 10
  /** The visitor's own intent: Play was pressed and not undone. */
  private playing = false
  /** Temporary reasons not to advance (a dialog is open). Cleared when they end. */
  private holds = new Set<string>()
  private sim: Simulation
  private simMs = 0
  private requestedExtra: ExtraPlacement
  readonly actions: RunAction[] = []

  constructor(presetId: PresetId = 'original') {
    this.presetId = presetId
    this.requestedExtra = presetById(presetId).config.extra
    this.sim = new Simulation({ extra: this.requestedExtra })
  }

  get mode(): RunMode {
    if (this.sim.isComplete) return 'complete'
    return this.playing && this.holds.size === 0 ? 'running' : 'paused'
  }

  get label(): string {
    const base = presetById(this.presetId).name
    return this.custom ? `Custom · based on ${base}` : base
  }

  get timeMs(): number {
    return this.sim.now
  }

  /** The extra worker's allocation if you restarted now (a pending move counts as chosen). */
  get requestedPlacement(): ExtraPlacement {
    return this.requestedExtra
  }

  snapshot(): Snapshot {
    return this.sim.snapshot()
  }

  get orders() {
    return this.sim.history
  }

  /** Choosing a setup resets its run to t=0 and pauses. */
  selectPreset(id: PresetId): void {
    this.presetId = id
    this.custom = false
    this.actions.length = 0
    this.reset(presetById(id).config.extra)
  }

  /** Restart this setup: clear history, t=0, paused, with the allocation the visitor has chosen. */
  restart(): void {
    this.reset(this.requestedExtra)
  }

  play(): void {
    if (this.sim.isComplete) return
    this.playing = true
  }

  pause(): void {
    this.playing = false
  }

  setSpeed(speed: Speed): void {
    this.speed = speed
  }

  /** A dialog opened: stop advancing, but remember that the run was playing. */
  hold(reason: string): void {
    this.holds.add(reason)
  }

  /** The dialog closed: the run continues only if it was playing before. */
  release(reason: string): void {
    this.holds.delete(reason)
  }

  /** Move the extra worker. Allowed while paused; a busy worker waits for service to finish. */
  assignExtra(target: ExtraPlacement): void {
    this.sim.setExtraWorker(target)
    this.requestedExtra = target
    this.custom = true
    this.actions.push({ timeMs: this.sim.now, to: target })
  }

  /** Advance by elapsed real milliseconds. Returns true if anything may have changed. */
  tick(realMs: number): boolean {
    if (this.mode !== 'running') return false
    this.simMs += Math.min(Math.max(realMs, 0), MAX_TICK_MS) * this.speed
    this.sim.advanceTo(Math.floor(this.simMs))
    return true
  }

  private reset(extra: ExtraPlacement): void {
    this.sim = new Simulation({ extra })
    this.simMs = 0
    this.requestedExtra = extra
    this.playing = false
  }
}
