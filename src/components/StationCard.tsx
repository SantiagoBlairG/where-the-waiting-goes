import { memo, useId, useMemo, useRef, type CSSProperties, type PointerEvent } from 'react'
import { Check } from 'lucide-react'
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
/** Beat 2: where the one traced order is. "now" is the active ticket. */
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
  trail?: TrailState
  className?: string
}

/** Each station has its own accent so the three tickets are told apart without reading. */
const accents: Record<StationId, { numeral: string; bar: string; pad: string }> = {
  order: { numeral: 'text-forest', bar: 'bg-forest', pad: 'bg-[#d5e6dc]' },
  drinks: { numeral: 'text-ember', bar: 'bg-ember', pad: 'bg-[#f1e8d2]' },
  pickup: { numeral: 'text-[#5f8274]', bar: 'bg-sage', pad: 'bg-[#e1ebe6]' },
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
  const active = trail === 'now'

  const workers = (
    <div data-worker-row className="flex items-center gap-1.5">
      {Array.from({ length: snapshot.workers }, (_, i) => {
        const isExtra = hasExtraWorker && i === snapshot.workers - 1
        return (
          <Worker
            key={i}
            variant={isExtra ? 'extra' : 'fixed'}
            label={isExtra ? 'Extra worker' : `Worker ${i + 1}`}
            className={compact ? 'size-9' : 'size-10'}
          />
        )
      })}
    </div>
  )

  const dots = (
    <div aria-hidden="true" className="flex min-h-4 flex-wrap items-center gap-2">
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
        'display inline-block text-[3.6rem] leading-[0.9] tabular',
        queueEmphasis ? 'rounded-control bg-queue-tint px-2.5 py-1.5 text-queue' : 'text-ink',
      )}
    >
      {snapshot.queue}
    </span>
  )

  const surface = cn(
    'group relative flex w-full flex-col overflow-hidden bg-paper text-ink outline-none',
    'transition-[transform,opacity] duration-300 ease-out will-change-transform motion-reduce:transition-none',
    active ? '[--ly:-14px] hover:[--ly:-18px]' : '[--ly:0px] hover:[--ly:-6px]',
    'focus-within:[--ly:-6px]',
    trail === 'next' && 'opacity-[0.72]',
  )

  const glare = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-10 size-[560px] opacity-0 transition-opacity duration-200 will-change-transform group-hover:opacity-100"
      style={{
        transform: 'translate3d(calc(var(--gx, 50%) - 280px), calc(var(--gy, 0px) - 280px), 0)',
        background: 'radial-gradient(closest-side, rgb(255 255 255 / 0.5), transparent)',
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
          className={cn(surface, 'h-full gap-3 rounded-[20px] p-4 pl-6', detail === 'named' && 'justify-center')}
        >
          {glare}
          <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-2', accent.bar)} />
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className={cn('display w-10 text-center text-[3rem] leading-none', accent.numeral)}>
              {station.step}
            </span>
            <div className="min-w-0 flex-1">
              <h3 id={headingId} className="font-display text-lg font-bold leading-tight">
                {station.name}
              </h3>
              <div className="mt-2 flex items-center gap-2.5">
                {workers}
                <p className="text-sm text-ink-2">{plural(snapshot.workers, 'worker', 'workers')}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <p className="text-sm text-ink-2">Waiting</p>
              {detail === 'named' ? (
                <span aria-label="not shown yet" className="display text-[3.6rem] leading-[0.9] text-line">
                  ?
                </span>
              ) : (
                waitingNumber
              )}
            </div>
          </div>
          {detail !== 'named' ? (
            <div className="mt-auto flex min-h-7 items-center border-t-2 border-dashed border-line pt-3">{dots}</div>
          ) : null}
        </article>
      </div>
    )
  }

  const stubHeight = detail === 'full' ? 184 : detail === 'counts' && !trail ? 148 : 104
  const headerTop = trail === 'now' || trail === 'past' ? 'pt-14' : 'pt-7'

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

        {/* Active state: the ticket the traced order is at is lifted, outlined and labelled. */}
        {trail === 'now' ? (
          <>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 rounded-card border-[3px] border-forest" />
            <p className="absolute inset-x-0 top-0 z-10 flex h-10 items-center gap-2 bg-forest px-6 text-sm font-semibold text-paper">
              <span aria-hidden="true" className="size-2.5 rounded-full bg-paper" />
              Your order is here
            </p>
          </>
        ) : trail === 'past' ? (
          <p className="absolute inset-x-0 top-0 z-10 flex h-10 items-center gap-2 bg-sage/35 px-6 text-sm font-semibold text-ink-2">
            <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
            Your order has moved on
          </p>
        ) : null}

        <header className={cn('flex items-center gap-4 px-6 pb-2', headerTop)}>
          <span aria-hidden="true" className={cn('display text-[3.8rem] leading-[0.85]', accent.numeral)}>
            {station.step}
          </span>
          <h3 id={headingId} className="font-display text-[1.4rem] font-bold leading-[1.05]">
            {station.name}
          </h3>
        </header>

        <div className={cn('relative mx-5 mb-4 mt-2 overflow-hidden rounded-[20px]', accent.pad)}>
          <HairlineFigure
            mount={figure.mount}
            state={figureState}
            label={figure.label}
            className="relative z-[1] mx-auto w-full max-w-[320px] wide:max-w-[min(320px,27svh)]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-[18%] bottom-[7%] h-[9%] bg-[radial-gradient(closest-side,rgb(27_38_34/0.2),transparent)]"
          />
        </div>

        <div
          className="flex flex-col justify-between border-t-2 border-dashed border-line px-6 pb-5 pt-4"
          style={{ height: stubHeight }}
        >
          <div className="flex items-end justify-between gap-3">
            {showCounts ? (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-ink-2">Waiting</span>
                {waitingNumber}
              </div>
            ) : (
              <p className="text-sm font-medium text-ink-2">
                {trail === 'next' ? 'Next stop' : trail === 'past' ? 'Done here' : 'The order stops here'}
              </p>
            )}
            <div className="flex flex-col items-end gap-1.5">
              {workers}
              <p className="text-xs font-medium text-ink-2">{plural(snapshot.workers, 'worker', 'workers')}</p>
            </div>
          </div>
          {showCounts ? (
            <>
              {dots}
              <div className="flex items-center justify-between gap-2">
                {showCapacity ? (
                  <span
                    className={cn(
                      'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold tabular',
                      capacityEmphasis ? 'bg-active-tint text-active' : 'bg-line/50 text-ink',
                    )}
                  >
                    {capacity % 1 === 0 ? capacity : capacity.toFixed(1)} orders/min
                  </span>
                ) : (
                  <span />
                )}
                <p className={cn('text-sm font-medium', queueEmphasis ? 'text-queue' : 'text-ink-2')}>
                  {statusFor(snapshot)}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </article>
    </div>
  )
}

export const StationCard = memo(StationCardBase)
