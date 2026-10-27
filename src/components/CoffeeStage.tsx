import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { STATIONS, type StationId } from '@/simulation/config'
import type { Snapshot } from '@/simulation/types'
import { OrderDot } from './OrderDot'
import { StationCard, type CardDetail, type TrailState } from './StationCard'

type CoffeeStageProps = {
  snapshot: Snapshot
  detail: CardDetail
  compact?: boolean
  /** Shallow arc with modest perspective on wide screens (CSS only). */
  arc?: boolean
  emphasis?: { station: StationId; kind: 'queue' | 'capacity' | 'both' }
  /** The station whose last worker is the flexible extra worker. */
  extraAt?: StationId
  /** Beat 2: show where one traced order is, instead of counts. */
  trail?: Record<StationId, TrailState>
  /** Stations whose counts are shown. Others stay at "named" so a later beat can reveal them. */
  countsAt?: readonly StationId[]
  /** Show "Picked up" and "Still in the shop" under the cards. */
  showTotals?: boolean
  className?: string
}

/** Presentation of the process: renders whatever snapshot it is given, owns no business rules. */
export function CoffeeStage({
  snapshot,
  detail,
  compact = false,
  arc = false,
  emphasis,
  extraAt,
  trail,
  countsAt,
  showTotals = false,
  className,
}: CoffeeStageProps) {
  // Arc transforms sit on a wrapper per card so the card's own styles stay free for hover later.
  const arcClass = ['lg:[transform:perspective(1400px)_rotateY(5deg)_translateY(14px)]', '', 'lg:[transform:perspective(1400px)_rotateY(-5deg)_translateY(14px)]']

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center lg:gap-2">
        {STATIONS.map((station, index) => (
          <Fragment key={station.id}>
            {index > 0 ? <Connector compact={compact} /> : null}
            <div className={cn('min-w-0 flex-1', arc ? arcClass[index] : '')}>
              <StationCard
                station={station}
                snapshot={snapshot.stations[index]}
                detail={countsAt && !countsAt.includes(station.id) ? 'named' : detail}
                compact={compact}
                emphasis={emphasis?.station === station.id ? emphasis.kind : undefined}
                hasExtraWorker={extraAt === station.id}
                trail={trail?.[station.id]}
              />
            </div>
          </Fragment>
        ))}
      </div>

      {showTotals ? (
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-base text-ink">
          <p className="flex items-center gap-2">
            <OrderDot state="done" />
            <span className="text-ink-2">Picked up</span>
            <span className="font-semibold tabular">{snapshot.completed}</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-ink-2">Still in the shop</span>
            <span className="font-semibold tabular">{snapshot.inShop}</span>
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Connector({ compact }: { compact: boolean }) {
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center text-ink-2', compact ? 'lg:w-5' : 'lg:w-8')}>
      <svg viewBox="0 0 24 24" className="size-5 rotate-90 lg:rotate-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h17M14 6l6 6-6 6" />
      </svg>
    </span>
  )
}
