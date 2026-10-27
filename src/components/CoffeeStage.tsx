import { Fragment, memo } from 'react'
import { cn } from '@/lib/utils'
import { STATIONS, type StationId } from '@/simulation/config'
import type { Snapshot } from '@/simulation/types'
import { OrderDot } from './OrderDot'
import { StationCard, type CardDetail, type TrailState } from './StationCard'

type CoffeeStageProps = {
  snapshot: Snapshot
  detail: CardDetail
  compact?: boolean
  emphasis?: { station: StationId; kind: 'queue' | 'capacity' | 'both' }
  /** The station whose last worker is the flexible extra worker. */
  extraAt?: StationId
  /** Beat 2: show where one traced order is, instead of counts. */
  trail?: Record<StationId, TrailState>
  trailMarker?: boolean
  /** Stations whose counts are shown. Others stay at "named" so a later beat can reveal them. */
  countsAt?: readonly StationId[]
  /** Show "Picked up" and "Still in the shop" under the tickets. */
  showTotals?: boolean
  className?: string
}

/**
 * Presentation of the process: renders whatever snapshot it is given and owns no business rules.
 * Each ticket sits in a [data-card] wrapper that the story's timeline may move; the tickets
 * themselves only ever respond to the pointer.
 */
function CoffeeStageBase({
  snapshot,
  detail,
  compact = false,
  emphasis,
  extraAt,
  trail,
  trailMarker,
  countsAt,
  showTotals = false,
  className,
}: CoffeeStageProps) {
  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <div className={cn('flex flex-col items-stretch gap-3 wide:flex-row wide:gap-1.5', compact ? 'wide:items-stretch' : 'wide:items-center')}>
        {STATIONS.map((station, index) => (
          <Fragment key={station.id}>
            {index > 0 ? <Connector compact={compact} /> : null}
            <div data-card={index} className="min-w-0 flex-1 basis-0">
              <StationCard
                station={station}
                snapshot={snapshot.stations[index]}
                detail={countsAt && !countsAt.includes(station.id) ? 'named' : detail}
                compact={compact}
                emphasis={emphasis?.station === station.id ? emphasis.kind : undefined}
                hasExtraWorker={extraAt === station.id}
                trail={trail?.[station.id]}
                trailMarker={trailMarker}
              />
            </div>
          </Fragment>
        ))}
      </div>

      {showTotals ? (
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-base">
          <p className="flex items-center gap-2">
            <OrderDot state="done" />
            <span className="opacity-80">Picked up</span>
            <span className="display text-2xl leading-none tabular">{snapshot.completed}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="opacity-80">Still in the shop</span>
            <span className="display text-2xl leading-none tabular">{snapshot.inShop}</span>
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Connector({ compact }: { compact: boolean }) {
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center opacity-80', compact ? 'wide:w-6' : 'wide:w-10')}>
      <svg viewBox="0 0 40 24" className="h-5 w-8 rotate-90 wide:rotate-0" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h30M26 5l8 7-8 7" />
      </svg>
    </span>
  )
}

export const CoffeeStage = memo(CoffeeStageBase)
