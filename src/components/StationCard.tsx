import { useId, useMemo, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import { capacityPerMinute, type StationConfig } from '@/simulation/config'
import type { StationSnapshot } from '@/simulation/types'
import { HairlineFigure } from '@/illustrations/hairline/HairlineFigure'
import { mountEspresso } from '@/illustrations/hairline/espressoFigure'
import { mountPickup } from '@/illustrations/hairline/pickupFigure'
import { mountRegister } from '@/illustrations/hairline/registerFigure'
import { Worker } from '@/illustrations/Worker'
import { OrderDot } from './OrderDot'

/** How much of the card is revealed. Concepts appear only when the story reaches them. */
export type CardDetail = 'named' | 'counts' | 'full'
export type TrailState = 'past' | 'now' | 'next'

type StationCardProps = {
  station: StationConfig
  snapshot: StationSnapshot
  detail: CardDetail
  compact?: boolean
  /** Draw attention to the waiting count or the capacity. */
  emphasis?: 'queue' | 'capacity' | 'both'
  /** The last worker here is the flexible extra worker. */
  hasExtraWorker?: boolean
  /** Beat 2: where the one traced order is. Replaces the dots. */
  trail?: TrailState
  /** Draw a small dot beside the trail text. Off when a floating dot travels over the cards. */
  trailMarker?: boolean
  /** Outer wrapper style. Motion ownership: later owned by GSAP, static CSS for now. */
  style?: CSSProperties
  className?: string
}

const figures = {
  order: { mount: mountRegister, label: 'Order and pay: a counter with a cash register, a card reader and a receipt slot' },
  drinks: { mount: mountEspresso, label: 'Make drinks: an espresso machine and grinder with a ticket rail, one ticket for each waiting order' },
  pickup: { mount: mountPickup, label: 'Pick up: a shelf of five lidded cups' },
} as const

/** Presentation-only wording from the numbers in the snapshot. */
function statusFor(snapshot: StationSnapshot): string {
  if (snapshot.queue >= 3) return 'Queue growing'
  if (snapshot.queue > 0) return 'A short wait'
  if (snapshot.inService > 0) return 'Keeping up'
  return 'Ready for the next order'
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export function StationCard({
  station,
  snapshot,
  detail,
  compact = false,
  emphasis,
  hasExtraWorker = false,
  trail,
  trailMarker = true,
  style,
  className,
}: StationCardProps) {
  const figure = figures[station.id]
  const figureState = useMemo(() => ({ queue: snapshot.queue, inService: snapshot.inService }), [snapshot.queue, snapshot.inService])
  const capacity = capacityPerMinute(station, snapshot.workers)
  const showCounts = detail !== 'named' && !trail
  const showCapacity = detail === 'full' && !compact
  const queueEmphasis = (emphasis === 'queue' || emphasis === 'both') && snapshot.queue > 0
  const capacityEmphasis = emphasis === 'capacity' || emphasis === 'both'
  const headingId = useId()

  return (
    <article
      aria-labelledby={headingId}
      style={style}
      className={cn(
        'relative flex w-full flex-col rounded-card bg-surface text-ink shadow-card',
        'transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none',
        'hover:-translate-y-1 hover:shadow-[0_24px_52px_rgb(35_42_40/0.13)] focus-within:-translate-y-1',
        compact ? 'gap-2.5 p-4' : 'gap-4 p-5 sm:p-6',
        className,
      )}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-active-tint text-sm font-semibold text-active tabular"
        >
          {station.step}
        </span>
        <h3 id={headingId} className={cn('font-semibold leading-tight', compact ? 'text-base' : 'text-lg')}>
          {station.name}
        </h3>
      </header>

      {compact ? null : (
        <HairlineFigure mount={figure.mount} state={figureState} label={figure.label} className="mx-auto w-full max-w-[min(300px,24svh)]" />
      )}

      <div data-worker-row className="flex items-end gap-2">
        {Array.from({ length: snapshot.workers }, (_, i) => {
          const isExtra = hasExtraWorker && i === snapshot.workers - 1
          return (
            <Worker
              key={i}
              variant={isExtra ? 'extra' : 'fixed'}
              label={isExtra ? 'Extra worker' : `Worker ${i + 1}`}
              className={cn('text-ink', compact ? 'h-8' : 'h-11')}
            />
          )
        })}
        <p className="ml-1 pb-0.5 text-sm text-ink-2">{plural(snapshot.workers, 'worker', 'workers')}</p>
      </div>

      {trail ? (
        <p className="flex items-center gap-2 text-sm text-ink-2">
          {trailMarker ? (
            <OrderDot state={trail === 'next' ? 'waiting' : 'service'} className={trail === 'next' ? 'opacity-60' : ''} />
          ) : null}
          {trail === 'now' ? 'Your order is here' : trail === 'past' ? 'Your order has moved on' : 'Your order comes next'}
        </p>
      ) : null}

      {compact && detail === 'named' && !trail ? (
        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ink-2">Waiting</span>
            <span aria-label="not shown yet" className="text-3xl font-semibold leading-none text-line">?</span>
          </div>
        </div>
      ) : null}

      {showCounts ? (
        <div className={cn("animate-in fade-in-0 slide-in-from-bottom-1 duration-500 motion-reduce:animate-none flex flex-col border-t border-line", compact ? "gap-2 pt-3" : "gap-3 pt-4")}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ink-2">Waiting</span>
            <span
              className={cn(
                'text-3xl font-semibold leading-none tabular',
                queueEmphasis ? 'rounded-control bg-queue-tint px-2 py-1 text-queue' : 'text-ink',
              )}
            >
              {snapshot.queue}
            </span>
          </div>
          <div aria-hidden="true" className="flex min-h-3.5 flex-wrap items-center gap-1.5">
            {Array.from({ length: snapshot.inService }, (_, i) => (
              <OrderDot key={`s${i}`} state="service" />
            ))}
            {snapshot.inService > 0 && snapshot.queue > 0 ? <span className="mx-1 h-4 w-px bg-line" /> : null}
            {Array.from({ length: snapshot.queue }, (_, i) => (
              <OrderDot key={`w${i}`} state="waiting" />
            ))}
          </div>
          {showCapacity ? (
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-2">Capacity</span>
              <span
                className={cn(
                  'whitespace-nowrap text-base font-semibold tabular',
                  capacityEmphasis ? 'rounded-control bg-active-tint px-2 py-1 text-active' : 'text-ink',
                )}
              >
                {capacity % 1 === 0 ? capacity : capacity.toFixed(1)} orders/min
              </span>
            </div>
          ) : null}
          <p className={cn('text-sm', queueEmphasis ? 'font-medium text-queue' : 'text-ink-2')}>
            {statusFor(snapshot)}
          </p>
        </div>
      ) : null}
    </article>
  )
}
