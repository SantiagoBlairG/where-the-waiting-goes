import { ARRIVAL_INTERVAL_SECONDS, STATIONS, capacityPerMinute, type StationId } from '@/simulation/config'
import type { Snapshot } from '@/simulation/types'
import type { TileChip } from '@/components/StationTile'
import { SAME_RUSH_LABEL, beats } from './storyBeats'
import { baselineAtClose, cashierAtClose, startOfRush } from './storySnapshots'

/**
 * What the one stage shows on each beat. Pure data from the model, shared by the pinned story
 * and the plain layout. Every beat changes one thing on the same three tiles, and the track
 * under the stage says that one thing in words.
 */
export type TileFrame = {
  id: StationId
  /** False only on the first beat, where the other two stops are still to come. */
  visible: boolean
  waiting: number | null
  inService: number
  workers?: number
  was?: number
  chip?: TileChip
  dim: boolean
  highlight: boolean
}

export type TrackFrame =
  /** One order travels the three stops. Position is set from the scroll, not from here. */
  | { kind: 'trace'; caption: string }
  /** The ten-minute rush clock. */
  | { kind: 'clock'; seconds: number; caption: string }
  /** A plain caption under the stage. */
  | { kind: 'caption'; caption: string }

export type StageFrame = { tiles: TileFrame[]; track: TrackFrame | null; /** The first chapter shows the walk-in picture instead of tiles. */ opening?: boolean }

const IDS: readonly StationId[] = ['order', 'drinks', 'pickup']
const [order, drinks, pickup] = STATIONS
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
const ARRIVALS_PER_MINUTE = 60 / ARRIVAL_INTERVAL_SECONDS

const tile = (id: StationId, over: Partial<TileFrame> = {}): TileFrame => ({
  id,
  visible: true,
  waiting: null,
  inService: 0,
  dim: false,
  highlight: false,
  ...over,
})

/** Everything a tile shows for one station at one moment: waiting, being served, workers. */
const countsFrom = (snap: Snapshot, id: StationId) => {
  const s = snap.stations[IDS.indexOf(id)]
  return { waiting: s.queue, inService: s.inService, workers: s.workers }
}

/** The traced order: where it is and how long that stop takes. */
export function stopCaption(stop: number): string {
  const s = STATIONS[Math.max(0, Math.min(2, stop))]
  return `Your order is at ${s.name.toLowerCase()}. It takes about ${s.serviceSeconds} seconds here.`
}

/** The rush, in three phases, one sentence each. */
export function rushCaption(snap: Snapshot): string {
  if (snap.timeSeconds < 100)
    return `Each ring is one customer's order waiting. A new customer comes every ${ARRIVAL_INTERVAL_SECONDS} seconds; the register needs about ${order.serviceSeconds}.`
  if (snap.timeSeconds < 600) return 'Customers arrive faster than orders can be taken and drinks made, so both lines grow.'
  return `10:00. ${snap.completed} coffees handed over, ${snap.inShop} customers still waiting.`
}

export function frameFor(beat: number, opts: { stop?: number; rush?: Snapshot } = {}): StageFrame {
  const stop = opts.stop ?? 0
  const at = (snap: Snapshot, id: StationId, over: Partial<TileFrame> = {}) => tile(id, { ...countsFrom(snap, id), ...over })
  switch (beats[beat]?.id) {
    case 'familiar':
      return {
        tiles: IDS.map((id) => tile(id, { visible: false })),
        track: null,
        opening: true,
      }
    case 'three-stops':
      return {
        tiles: IDS.map((id, i) => tile(id, { highlight: i === stop, dim: i !== stop })),
        track: { kind: 'trace', caption: stopCaption(stop) },
      }
    case 'rush': {
      const snap = opts.rush ?? startOfRush
      return {
        tiles: IDS.map((id) => at(snap, id)),
        track: { kind: 'clock', seconds: snap.timeSeconds, caption: rushCaption(snap) },
      }
    }
    case 'fix':
      return {
        tiles: IDS.map((id) =>
          id === 'order'
            ? at(cashierAtClose, id, { was: countsFrom(baselineAtClose, id).waiting, chip: { text: '+1 cashier', tone: 'active' }, highlight: true })
            : at(cashierAtClose, id, { dim: true }),
        ),
        track: { kind: 'caption', caption: `${SAME_RUSH_LABEL} Shown at 10:00.` },
      }
    case 'surprise':
      return {
        tiles: IDS.map((id) =>
          id === 'drinks'
            ? at(cashierAtClose, id, { was: countsFrom(baselineAtClose, id).waiting, highlight: true, chip: { text: 'Longer line', tone: 'queue' } })
            : at(cashierAtClose, id, { dim: true, chip: id === 'order' ? { text: '+1 cashier', tone: 'neutral' } : undefined }),
        ),
        track: { kind: 'caption', caption: `${SAME_RUSH_LABEL} Shown at 10:00.` },
      }
    case 'reveal':
      return {
        tiles: IDS.map((id) =>
          id === 'drinks'
            ? at(cashierAtClose, id, { highlight: true, chip: { text: `${fmt(capacityPerMinute(drinks, 1))} drinks a minute`, tone: 'queue' } })
            : at(cashierAtClose, id, { dim: true }),
        ),
        track: { kind: 'caption', caption: `${fmt(ARRIVALS_PER_MINUTE)} customers arrive a minute. The drinks can only finish ${fmt(capacityPerMinute(drinks, 1))}.` },
      }
    case 'pickup':
      return {
        tiles: IDS.map((id) =>
          id === 'pickup'
            ? at(baselineAtClose, id, { highlight: true, chip: { text: `${fmt(capacityPerMinute(pickup, 1))} a minute on average`, tone: 'active' } })
            : at(baselineAtClose, id, { dim: true }),
        ),
        track: { kind: 'caption', caption: 'A slow handover now and then makes a short line. Then it clears.' },
      }
    default:
      return { tiles: IDS.map((id) => at(startOfRush, id)), track: null }
  }
}

export { mmss as clockText }

/** Centre of tile i as a share of the row, for a position from 0 (first tile) to 2 (last). */
export const traceShare = (position: number) => (position * 2 + 1) / 6
