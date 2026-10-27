import { memo, useId, useMemo, useRef, type CSSProperties, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import { capacityPerMinute, type StationConfig, type StationId } from '@/simulation/config'
import type { StationSnapshot } from '@/simulation/types'
import { HairlineFigure } from '@/illustrations/hairline/HairlineFigure'
import { mountEspresso } from '@/illustrations/hairline/espressoFigure'
import { mountPickup } from '@/illustrations/hairline/pickupFigure'
import { mountRegister } from '@/illustrations/hairline/registerFigure'
import { Worker } from '@/illustrations/Worker'
import { OrderDot } from './OrderDot'

/** How much of the ticket is revealed. Concepts appear only when the story reaches them. */
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
  /** Draw a small dot beside the trail text. Off when a floating dot travels over the tickets. */
  trailMarker?: boolean
  className?: string
}

/** Each station has its own color so the three tickets are told apart without reading. */
const accents: Record<StationId, { numeral: string; bar: string; pad: string }> = {
  order: { numeral: 'text-cobalt', bar: 'bg-cobalt', pad: 'bg-active-tint' },
  // Coffee brown, so the drinks ticket stays distinct on the tomato and butter rooms.
  drinks: { numeral: 'text-[#7a4222]', bar: 'bg-[#7a4222]', pad: 'bg-[#f3e6d6]' },
  pickup: { numeral: 'text-green', bar: 'bg-green', pad: 'bg-green-tint' },
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

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function useTilt() {
  const ref = useRef<HTMLElement>(null)
  const frame = useRef(0)
  const rect = useRef<DOMRect | null>(null)
  const onEnter = () => {
    rect.current = ref.current?.getBoundingClientRect() ?? null
  }
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return
    const el = ref.current
    if (!el) return
    if (!rect.current) rect.current = el.getBoundingClientRect()
    const { clientX, clientY } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const r = rect.current
      if (!r) return
      const x = (clientX - r.left) / r.width
      const y = (clientY - r.top) / r.height
      el.style.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`)
      el.style.setProperty('--rx', `${((0.5 - y) * 7).toFixed(2)}deg`)
      el.style.setProperty('--gx', `${(x * r.width).toFixed(0)}px`)
      el.style.setProperty('--gy', `${(y * r.height).toFixed(0)}px`)
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(frame.current)
    rect.current = null
    const el = ref.current
    if (!el) return
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--rx', '0deg')
  }
  return [ref, { onPointerEnter: onEnter, onPointerMove: onMove, onPointerLeave: onLeave }] as const
}

/** The tilt and glare live on the ticket itself. GSAP only ever moves the wrapper around it. */
const tiltStyle: CSSProperties = {
  transform: 'perspective(1000px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) translateY(var(--ly, 0px))',
}

function StationCardBase({
  station,
  snapshot,
  detail,
  compact = false,
  emphasis,
  hasExtraWorker = false,
  trail,
  trailMarker = true,
  className,
}: StationCardProps) {
  const headingId = useId()
  const [tiltRef, tiltHandlers] = useTilt()
  const accent = accents[station.id]
  const figure = figures[station.id]
  const figureState = useMemo(
    () => ({ queue: snapshot.queue, inService: snapshot.inService }),
    [snapshot.queue, snapshot.inService],
  )
  const capacity = capacityPerMinute(station, snapshot.workers)
  const showCounts = detail !== 'named' && !trail
  const showCapacity = detail === 'full' && !compact
  const queueEmphasis = (emphasis === 'queue' || emphasis === 'both') && snapshot.queue > 0
  const capacityEmphasis = emphasis === 'capacity' || emphasis === 'both'

  const workers = (
    <div data-worker-row className="flex items-end gap-1.5">
      {Array.from({ length: snapshot.workers }, (_, i) => {
        const isExtra = hasExtraWorker && i === snapshot.workers - 1
        return (
          <Worker
            key={i}
            variant={isExtra ? 'extra' : 'fixed'}
            label={isExtra ? 'Extra worker' : `Worker ${i + 1}`}
            className={cn('text-ink', compact ? 'h-9' : 'h-10')}
          />
        )
      })}
    </div>
  )

  const dots = (
    <div aria-hidden="true" className="flex min-h-3.5 flex-wrap items-center gap-1.5">
      {Array.from({ length: snapshot.inService }, (_, i) => (
        <OrderDot key={`s${i}`} state="service" />
      ))}
      {snapshot.inService > 0 && snapshot.queue > 0 ? <span className="mx-1 h-4 w-px bg-line" /> : null}
      {Array.from({ length: snapshot.queue }, (_, i) => (
        <OrderDot key={`w${i}`} state="waiting" />
      ))}
    </div>
  )

  const waitingNumber = (
    <span
      className={cn(
        'display inline-block text-[3.4rem] leading-[0.9] tabular',
        queueEmphasis ? 'rounded-control bg-queue-tint px-2 py-1 text-queue' : 'text-ink',
      )}
    >
      {snapshot.queue}
    </span>
  )

  const surface =
    'relative flex w-full flex-col overflow-hidden bg-paper text-ink outline-none ' +
    'transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none ' +
    '[--ly:0px] hover:[--ly:-6px] focus-within:[--ly:-6px] group'

  const glare = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-10 size-[560px] opacity-0 transition-opacity duration-200 will-change-transform group-hover:opacity-100"
      style={{
        transform: 'translate3d(calc(var(--gx, 50%) - 280px), calc(var(--gy, 0px) - 280px), 0)',
        background: 'radial-gradient(closest-side, rgb(255 255 255 / 0.55), transparent)',
      }}
    />
  )

  if (compact) {
    return (
      <div className={cn('ticket-shadow h-full w-full', className)}>
        <article
          ref={tiltRef}
          aria-labelledby={headingId}
          {...tiltHandlers}
          style={tiltStyle}
          className={cn(surface, 'h-full gap-3 rounded-[18px] p-4 pl-5')}
        >
          {glare}
          <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1.5', accent.bar)} />
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className={cn('display w-10 text-center text-[3.4rem] leading-none', accent.numeral)}>
              {station.step}
            </span>
            <div className="min-w-0 flex-1">
              <h3 id={headingId} className="font-display text-lg font-bold leading-tight">
                {station.name}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                {workers}
                <p className="text-xs text-ink-2">{plural(snapshot.workers, 'worker', 'workers')}</p>
              </div>
            </div>
            {detail === 'named' ? (
              <div className="flex flex-col items-end gap-1 text-right">
                <p className="text-xs text-ink-2">Waiting</p>
                <span aria-label="not shown yet" className="display text-[3.4rem] leading-none text-line">
                  ?
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1 text-right">
                <p className="text-xs text-ink-2">Waiting</p>
                {waitingNumber}
              </div>
            )}
          </div>
          <div className="mt-auto flex min-h-6 items-center border-t-2 border-dashed border-line pt-2">
            {detail !== 'named' ? dots : null}
          </div>
        </article>
      </div>
    )
  }

  const stubHeight = detail === 'full' ? 164 : detail === 'counts' && !trail ? 132 : 92

  return (
    <div className={cn('ticket-shadow w-full', className)}>
      <article
        ref={tiltRef}
        aria-labelledby={headingId}
        {...tiltHandlers}
        style={{ ...tiltStyle, ['--notch-y' as string]: `calc(100% - ${stubHeight}px)` }}
        className={cn(surface, 'ticket rounded-card')}
      >
        {glare}
        <span aria-hidden="true" className={cn('absolute inset-x-0 top-0 h-2', accent.bar)} />

        <header className="flex items-center gap-3 px-5 pb-1 pt-5">
          <span aria-hidden="true" className={cn('display text-[3.6rem] leading-[0.85]', accent.numeral)}>
            {station.step}
          </span>
          <h3 id={headingId} className="font-display text-xl font-bold leading-[1.05]">
            {station.name}
          </h3>
        </header>

        <div className={cn('relative mx-3.5 mb-3 mt-2 overflow-hidden rounded-[18px]', accent.pad)}>
          <HairlineFigure
            mount={figure.mount}
            state={figureState}
            label={figure.label}
            className="relative z-[1] mx-auto w-full max-w-[min(310px,27svh)]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-[18%] bottom-[7%] h-[9%] bg-[radial-gradient(closest-side,rgb(29_18_13/0.22),transparent)]"
          />
        </div>

        <div
          className="flex flex-col justify-between border-t-2 border-dashed border-line px-5 pb-4 pt-3"
          style={{ height: stubHeight }}
        >
          <div className="flex items-end justify-between gap-3">
            {showCounts ? (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-ink-2">Waiting</span>
                {waitingNumber}
              </div>
            ) : (
              <p className="text-sm text-ink-2">
                {trail === 'now' ? 'Your order is here' : trail === 'past' ? 'Your order has moved on' : 'Your order comes next'}
              </p>
            )}
            <div className="flex flex-col items-end gap-1">
              {workers}
              <p className="text-xs text-ink-2">{plural(snapshot.workers, 'worker', 'workers')}</p>
            </div>
          </div>
          {showCounts ? (
            <>
              {dots}
              <div className="flex items-center justify-between gap-2">
                {showCapacity ? (
                  <span
                    className={cn(
                      'whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold tabular',
                      capacityEmphasis ? 'bg-active-tint text-active' : 'bg-line/40 text-ink',
                    )}
                  >
                    {capacity % 1 === 0 ? capacity : capacity.toFixed(1)} orders/min
                  </span>
                ) : (
                  <span />
                )}
                <p className={cn('text-sm', queueEmphasis ? 'font-semibold text-queue' : 'text-ink-2')}>
                  {statusFor(snapshot)}
                </p>
              </div>
            </>
          ) : trailMarker && trail ? (
            <OrderDot state={trail === 'next' ? 'waiting' : 'service'} />
          ) : null}
        </div>
      </article>
    </div>
  )
}

export const StationCard = memo(StationCardBase)
