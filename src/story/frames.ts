import { ARRIVAL_INTERVAL_SECONDS, STATIONS, capacityPerMinute, type StationId } from '@/simulation/config'
import type { Snapshot } from '@/simulation/types'
import type { TileChip } from '@/components/StationTile'
import { SAME_RUSH_LABEL } from './storyBeats'
import { baselineAtClose, cashierAtClose, startOfRush } from './storySnapshots'

/**
 * What the one stage shows on each beat. Pure data from the model, shared by the pinned story
 * and the plain layout. The rule for this pass: every beat changes one thing on the same three
 * tiles, and the line under the stage says that one thing in words.
 */
export type TileFrame = {
  id: StationId
  /** False only on the first beat, where the other two stops are still to come. */
  visible: boolean
  waiting: number | null
  inService: number
  was?: number
  chip?: TileChip
  dim: boolean
  highlight: boolean
}

export type TrackFrame =
  /** Beat 2: one order travels the three stops. Position is set from the scroll, not from here. */
  | { kind: 'trace'; caption: string }
  /** Beat 3: the ten-minute rush clock. */
  | { kind: 'clock'; seconds: number; caption: string }
  /** A plain caption under the stage. */
  | { kind: 'caption'; caption: string }

export type StageFrame = { tiles: TileFrame[]; track: TrackFrame | null }

const IDS: readonly StationId[] = ['order', 'drinks', 'pickup']
const drinks = STATIONS[1]
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`

const tile = (id: StationId, over: Partial<TileFrame> = {}): TileFrame => ({
  id,
  visible: true,
  waiting: null,
  inService: 0,
  dim: false,
  highlight: false,
  ...over,
})

const countsFrom = (snap: Snapshot, id: StationId) => {
  const s = snap.stations[IDS.indexOf(id)]
  return { waiting: s.queue, inService: s.inService }
}

/** Beat 2: the caption for the stop the traced order is at. */
export function stopCaption(stop: number): string {
  const s = STATIONS[Math.max(0, Math.min(2, stop))]
  return `Your order is at ${s.name.toLowerCase()}. It takes ${s.serviceSeconds} seconds here.`
}

/** Beat 3: three phases of the rush, one sentence each. */
export function rushCaption(snap: Snapshot): string {
  const order = STATIONS[0]
  if (snap.timeSeconds < 100) return `A new order every ${ARRIVAL_INTERVAL_SECONDS} seconds, but each one takes ${order.serviceSeconds} at the register.`
  if (snap.timeSeconds < 600) return 'Orders arrive faster than they can be made. Lines grow at the register and the drinks.'
  return `10:00. ${snap.completed} coffees handed over, ${snap.inShop} people still waiting.`
}

export function frameFor(beat: number, opts: { stop?: number; rush?: Snapshot } = {}): StageFrame {
  const stop = opts.stop ?? 0
  switch (beat) {
    case 0:
      return {
        tiles: IDS.map((id, i) => tile(id, { visible: i === 0, highlight: i === 0, chip: i === 0 ? { text: 'Your order', tone: 'active' } : undefined })),
        track: null,
      }
    case 1:
      return {
        tiles: IDS.map((id, i) => tile(id, { highlight: i === stop, dim: i !== stop })),
        track: { kind: 'trace', caption: stopCaption(stop) },
      }
    case 2: {
      const snap = opts.rush ?? startOfRush
      return {
        tiles: IDS.map((id) => tile(id, countsFrom(snap, id))),
        track: { kind: 'clock', seconds: snap.timeSeconds, caption: rushCaption(snap) },
      }
    }
    case 3:
      return {
        tiles: IDS.map((id) =>
          id === 'order'
            ? tile(id, { ...countsFrom(cashierAtClose, id), was: countsFrom(baselineAtClose, id).waiting, chip: { text: '+1 cashier', tone: 'active' }, highlight: true })
            : tile(id, { dim: true }),
        ),
        track: { kind: 'caption', caption: SAME_RUSH_LABEL },
      }
    case 4:
      return {
        tiles: IDS.map((id) =>
          id === 'drinks'
            ? tile(id, { ...countsFrom(cashierAtClose, id), was: countsFrom(baselineAtClose, id).waiting, highlight: true, chip: { text: 'Longer line', tone: 'queue' } })
            : id === 'order'
              ? tile(id, { ...countsFrom(cashierAtClose, id), chip: { text: '+1 cashier', tone: 'neutral' }, dim: true })
              : tile(id, { dim: true }),
        ),
        track: { kind: 'caption', caption: SAME_RUSH_LABEL },
      }
    case 5:
      return {
        tiles: IDS.map((id) =>
          id === 'drinks'
            ? tile(id, { ...countsFrom(cashierAtClose, id), highlight: true, chip: { text: `${fmt(capacityPerMinute(drinks, 1))} drinks a minute`, tone: 'queue' } })
            : tile(id, { dim: true }),
        ),
        track: null,
      }
    default:
      return { tiles: IDS.map((id) => tile(id, countsFrom(startOfRush, id))), track: null }
  }
}

export { mmss as clockText }

/** Centre of tile i as a share of the row, for a position from 0 (first tile) to 2 (last). */
export const traceShare = (position: number) => (position * 2 + 1) / 6
