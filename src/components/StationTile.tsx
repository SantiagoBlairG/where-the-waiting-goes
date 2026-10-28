import { memo, useMemo } from 'react'
import { ArrowUpRight, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StationConfig, StationId } from '@/simulation/config'
import { HairlineFigure } from '@/illustrations/hairline/HairlineFigure'
import { mountEspresso } from '@/illustrations/hairline/espressoFigure'
import { mountPickup } from '@/illustrations/hairline/pickupFigure'
import { mountRegister } from '@/illustrations/hairline/registerFigure'

export type TileChip = { text: string; tone: 'active' | 'queue' | 'neutral' }

export type StationTileProps = {
  station: StationConfig
  /** Orders waiting here. Null hides the numbers but keeps their space, so the tile never resizes. */
  waiting: number | null
  /** Orders a worker is handling right now. */
  inService?: number
  /** The same waiting count before a change, shown as "was 5" beside the number. */
  was?: number
  /** One short label for the beat that is about this station: "+1 cashier", "2 drinks a minute". */
  chip?: TileChip
  /** Workers at this station. */
  workers?: number
  /**
   * Show what the stop is instead of its counts: each customer's time in the repeating pattern
   * and what happens there. Used where the story introduces the stops.
   */
  about?: boolean
  dim?: boolean
  highlight?: boolean
  /** Opens the station's details. The whole tile becomes the button. */
  onOpen?: () => void
  className?: string
}

const figures = {
  order: { mount: mountRegister, label: 'Order and pay: a counter with a cash register and a card reader' },
  drinks: { mount: mountEspresso, label: 'Make drinks: an espresso machine with one ticket for each waiting order' },
  pickup: { mount: mountPickup, label: 'Pick up: a shelf of lidded cups' },
} as const

/**
 * Every order is one customer and one coffee. What "waiting" means is different at each stop,
 * so each stop says it in its own words.
 */
const WORDS: Record<StationId, { waiting: string; serving: string; idle: string }> = {
  order: { waiting: 'Customers in line', serving: 'ordering now', idle: 'Register free' },
  drinks: { waiting: 'Drinks to make', serving: 'being made', idle: 'Barista free' },
  pickup: { waiting: 'Drinks to hand over', serving: 'being handed over', idle: 'Counter free' },
}

const pads: Record<StationId, string> = { order: 'bg-[#d5e6dc]', drinks: 'bg-[#f1e8d2]', pickup: 'bg-[#e1ebe6]' }
const numerals: Record<StationId, string> = { order: 'text-forest', drinks: 'text-ember', pickup: 'text-[#4b6c5f]' }
const chipTones: Record<TileChip['tone'], string> = {
  active: 'bg-forest text-paper',
  // A shade darker than the queue colour: small text on the warm tint needs 4.5:1.
  queue: 'bg-queue-tint text-[#8a460b]',
  neutral: 'bg-ink/[0.06] text-ink',
}

/** A changed number or line fades up into place instead of snapping (keyed on its value). */
const FADE = 'animate-in fade-in-0 slide-in-from-bottom-1 duration-500 ease-out motion-reduce:animate-none'

/** Waiting orders as rings: twelve at most, then a "+n". */
const MAX_DOTS = 12

/**
 * One station, reduced to what a visitor needs: its name, a picture, how many orders wait here
 * (in this stop's own words), who is being served right now, and how many workers there are.
 * Anything else appears only on the beat that is about it, as one chip.
 *
 * The tile has the same shape at every step of the story and in the experiment, so nothing jumps.
 * Motion ownership: CSS only (background, translate and scale transitions on the tile). GSAP
 * never writes to it; the Hairline figure animates inside its own svg.
 */
function StationTileBase({ station, waiting, inService = 0, was, chip, workers, about = false, dim = false, highlight = false, onOpen, className }: StationTileProps) {
  const figure = figures[station.id]
  const words = WORDS[station.id]
  const queue = waiting ?? 0
  const figureState = useMemo(() => ({ queue, inService }), [queue, inService])
  const longer = was !== undefined && waiting !== null && waiting > was
  const shown = Math.min(queue, MAX_DOTS)

  const body = (
    <>
      <header className="flex min-h-11 items-center justify-between gap-2 px-5 pt-5 max-wide:flex-wrap xl:gap-3 xl:px-6">
        <h3 className="flex items-baseline gap-2.5 font-display wide:whitespace-nowrap text-[1.3rem] font-semibold leading-none">
          <span aria-hidden="true" className={cn('display text-[2.3rem] leading-[0.8]', numerals[station.id])}>
            {station.step}
          </span>
          {station.name}
        </h3>
        {onOpen ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink underline decoration-ink/30 decoration-2 underline-offset-4 transition-colors duration-150 group-hover:decoration-ink">
            See details
            <ArrowUpRight aria-hidden="true" className="size-4 transition-transform duration-200 ease-[var(--ease-out)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={2.25} />
          </span>
        ) : chip ? (
          <span
            key={chip.text}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[0.8rem] font-semibold xl:px-3 animate-in fade-in-0 zoom-in-95 duration-300 motion-reduce:animate-none',
              chipTones[chip.tone],
            )}
          >
            {chip.text}
          </span>
        ) : null}
      </header>

      {/* Inside a button the picture would only lengthen its name, so it is hidden there. */}
      <div
        aria-hidden={onOpen ? true : undefined}
        className={cn('relative mx-4 mt-4 overflow-hidden rounded-[22px] transition-opacity duration-500', pads[station.id], dim && 'opacity-35')}
      >
        <HairlineFigure mount={figure.mount} state={figureState} label={figure.label} className="relative z-[1] mx-auto w-full max-w-[280px] wide:max-w-[min(280px,22svh)]" />
      </div>

      {about ? (
        <div className="flex flex-col gap-2.5 px-5 pb-5 pt-4 xl:px-6">
          {/* Row heights match the counts footer exactly, so the tile keeps its size between chapters. */}
          <div className="flex min-h-7 items-center justify-between gap-2 wide:whitespace-nowrap">
            <span className={cn('rounded-full px-2.5 py-1 text-[0.8rem] font-semibold tabular', highlight ? 'bg-forest text-paper' : 'bg-ink/[0.07] text-ink')}>
              about {station.serviceSeconds} s each
            </span>
            {workers !== undefined ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.8rem] font-semibold text-ink-2 tabular xl:text-sm">
                <UserRound aria-hidden="true" className="size-4" strokeWidth={2} />
                {workers} {workers === 1 ? 'worker' : 'workers'}
              </span>
            ) : null}
          </div>
          {/* The repeating pattern of customers, so "about 24 s" is not mistaken for every order. */}
          <dl className="grid min-h-[2.6rem] grid-cols-3 items-end gap-2">
            {station.pattern.map((s, i) => (
              <div key={i} className="flex flex-col">
                <dd className="font-display text-xl font-semibold leading-tight tabular">{s} s</dd>
                <dt className="truncate text-xs font-medium text-ink-2">{station.kinds[i]}</dt>
              </div>
            ))}
          </dl>
          <p className="truncate border-t border-line pt-2.5 text-sm text-ink-2">{station.does}</p>
        </div>
      ) : (
        <div className={cn('flex flex-col gap-2.5 px-5 pb-5 pt-4 xl:px-6', waiting === null && 'invisible')}>
          <div className="flex min-h-7 items-center justify-between gap-2 wide:whitespace-nowrap">
            <span className="min-w-0 text-[0.8rem] wide:truncate font-semibold text-ink-2 xl:text-sm">{words.waiting}</span>
            {workers !== undefined ? (
              <span key={workers} className={cn('inline-flex shrink-0 items-center gap-1.5 text-[0.8rem] font-semibold tabular xl:text-sm', workers > 1 ? 'text-[#2a4a40]' : 'text-ink-2', FADE)}>
                <UserRound aria-hidden="true" className="size-4" strokeWidth={2} />
                {workers} {workers === 1 ? 'worker' : 'workers'}
              </span>
            ) : null}
          </div>
          <div className="flex min-h-[2.6rem] items-end justify-between gap-3">
            <span className="flex items-baseline gap-2.5">
              <span key={queue} className={cn('display inline-block text-[2.75rem] leading-[0.85] tabular', longer ? 'text-queue' : 'text-ink', FADE)}>
                {queue}
              </span>
              {was !== undefined ? (
                <span className="text-base font-semibold text-ink-2 tabular">
                  was <span className="line-through decoration-2">{was}</span>
                </span>
              ) : null}
            </span>
            <span aria-hidden="true" className="flex max-w-[8.5rem] flex-wrap justify-end gap-1.5 pb-1">
              {Array.from({ length: shown }, (_, i) => (
                <span key={i} className="size-3 rounded-full border-2 border-queue bg-queue-tint animate-in fade-in-0 zoom-in-75 duration-500 ease-out motion-reduce:animate-none" />
              ))}
              {queue > MAX_DOTS ? <span className="text-xs font-semibold text-queue">+{queue - MAX_DOTS}</span> : null}
            </span>
          </div>
          <p className="flex items-center gap-2 whitespace-nowrap border-t border-line pt-2.5 text-sm text-ink-2 tabular">
            <span aria-hidden="true" className={cn('size-3 shrink-0 rounded-full transition-colors duration-500', inService > 0 ? 'bg-forest' : 'border-2 border-line')} />
            <span key={inService} className={FADE}>
              {inService > 0 ? `${inService} ${words.serving}` : words.idle}
            </span>
          </p>
        </div>
      )}
    </>
  )

  const surface = cn(
    'relative flex h-full w-full flex-col overflow-hidden rounded-card text-left text-ink',
    'transition-[background-color,translate,scale,box-shadow] duration-500 ease-[var(--ease-out)] motion-reduce:transition-none',
    // A tile the beat is not about steps back: the card turns translucent and its picture fades,
    // but its words keep full contrast (fading the whole tile took text below 4.5:1).
    dim ? 'bg-paper/70 shadow-none' : 'bg-paper shadow-[0_1px_2px_rgb(27_38_34/0.06),0_22px_40px_-22px_rgb(27_38_34/0.45)]',
    highlight && 'shadow-[0_0_0_3px_var(--wg-forest),0_26px_44px_-20px_rgb(27_38_34/0.5)] wide:-translate-y-2',
    className,
  )

  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={cn(surface, 'press group cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [@media(hover:hover)]:hover:-translate-y-1')}>
        {body}
        <span className="sr-only">Open details</span>
      </button>
    )
  }
  return (
    <article aria-label={station.name} className={surface}>
      {body}
    </article>
  )
}

export const StationTile = memo(StationTileBase)
