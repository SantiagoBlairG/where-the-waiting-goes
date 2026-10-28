import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { StationConfig, StationId } from '@/simulation/config'
import { HairlineFigure } from '@/illustrations/hairline/HairlineFigure'
import { mountEspresso } from '@/illustrations/hairline/espressoFigure'
import { mountPickup } from '@/illustrations/hairline/pickupFigure'
import { mountRegister } from '@/illustrations/hairline/registerFigure'

export type TileChip = { text: string; tone: 'active' | 'queue' | 'neutral' }

export type StationTileProps = {
  station: StationConfig
  /** Orders waiting here. Null hides the number but keeps its space, so the tile never resizes. */
  waiting: number | null
  /** Orders being made right now (drives the illustration only). */
  inService?: number
  /** The same count before a change, shown as "was 5" beside the number. */
  was?: number
  /** One short label for the beat that is about this station: "+1 cashier", "2 drinks a minute". */
  chip?: TileChip
  /** People working here. Shown only where staffing is the point (the experiment). */
  people?: number
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

const pads: Record<StationId, string> = { order: 'bg-[#d5e6dc]', drinks: 'bg-[#f1e8d2]', pickup: 'bg-[#e1ebe6]' }
const numerals: Record<StationId, string> = { order: 'text-forest', drinks: 'text-ember', pickup: 'text-[#4b6c5f]' }
const chipTones: Record<TileChip['tone'], string> = {
  active: 'bg-forest text-paper',
  // A shade darker than the queue colour: small text on the warm tint needs 4.5:1.
  queue: 'bg-queue-tint text-[#8a460b]',
  neutral: 'bg-ink/[0.06] text-ink',
}

/** Waiting orders as a small stack of rings: twelve at most, then a "+n". */
const MAX_DOTS = 12

/**
 * One station, reduced to what a visitor needs: its name, a picture, and how many orders are
 * waiting there. Everything else appears only on the beat that is about it, as one chip.
 *
 * The tile has a fixed shape at every step of the story and in the experiment, so nothing jumps.
 * Motion ownership: CSS only (opacity and transform transitions on the tile). GSAP never writes
 * to it; the Hairline figure animates inside its own svg.
 */
function StationTileBase({ station, waiting, inService = 0, was, chip, people, dim = false, highlight = false, onOpen, className }: StationTileProps) {
  const figure = figures[station.id]
  const queue = waiting ?? 0
  const figureState = useMemo(() => ({ queue, inService }), [queue, inService])
  const longer = was !== undefined && waiting !== null && waiting > was
  const shown = Math.min(queue, MAX_DOTS)

  const body = (
    <>
      <header className="flex min-h-11 items-center justify-between gap-3 px-6 pt-5">
        <h3 className="flex items-baseline gap-2.5 font-display text-[1.3rem] font-semibold leading-none">
          <span aria-hidden="true" className={cn('display text-[2.3rem] leading-[0.8]', numerals[station.id])}>
            {station.step}
          </span>
          {station.name}
        </h3>
        {chip ? (
          <span
            key={chip.text}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-[0.8rem] font-semibold animate-in fade-in-0 zoom-in-95 duration-300 motion-reduce:animate-none',
              chipTones[chip.tone],
            )}
          >
            {chip.text}
          </span>
        ) : null}
      </header>

      {/* Inside a button the picture would only lengthen its name, so it is hidden there. */}
      <div aria-hidden={onOpen ? true : undefined} className={cn('relative mx-4 mt-4 overflow-hidden rounded-[22px] transition-opacity duration-500', pads[station.id], dim && 'opacity-35')}>
        <HairlineFigure mount={figure.mount} state={figureState} label={figure.label} className="relative z-[1] mx-auto w-full max-w-[300px] wide:max-w-[min(300px,24svh)]" />
        <span aria-hidden="true" className="absolute inset-x-[18%] bottom-[7%] h-[9%] bg-[radial-gradient(closest-side,rgb(27_38_34/0.18),transparent)]" />
      </div>

      <div className={cn('flex min-h-[5.5rem] items-end justify-between gap-4 px-6 pb-5 pt-4', waiting === null && 'invisible')}>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink-2">Waiting</span>
          <span className="flex items-baseline gap-2.5">
            <span className={cn('display text-[3rem] leading-[0.85] tabular', longer ? 'text-queue' : 'text-ink')}>{queue}</span>
            {was !== undefined ? (
              <span className="text-base font-semibold text-ink-2 tabular">
                was <span className="line-through decoration-2">{was}</span>
              </span>
            ) : null}
          </span>
        </div>
        <div className="flex flex-col items-end gap-2">
          {people !== undefined ? (
            <span className="text-base font-semibold text-ink-2 tabular">
              {people} {people === 1 ? 'person' : 'people'}
            </span>
          ) : null}
          <span aria-hidden="true" className="flex max-w-[8.5rem] flex-wrap justify-end gap-1.5">
            {Array.from({ length: shown }, (_, i) => (
              <span key={i} className="size-3 rounded-full border-2 border-queue bg-queue-tint" />
            ))}
            {queue > MAX_DOTS ? <span className="text-xs font-semibold text-queue">+{queue - MAX_DOTS}</span> : null}
          </span>
        </div>
      </div>
    </>
  )

  const surface = cn(
    'relative flex w-full flex-col overflow-hidden rounded-card text-left text-ink',
    'transition-[background-color,translate,scale,box-shadow] duration-500 ease-[var(--ease-out)] motion-reduce:transition-none',
    // A tile the beat is not about steps back: the card turns translucent and its picture fades,
    // but its words keep full contrast (fading the whole tile took text below 4.5:1).
    dim ? 'bg-paper/70 shadow-none' : 'bg-paper shadow-[0_1px_2px_rgb(27_38_34/0.06),0_22px_40px_-22px_rgb(27_38_34/0.45)]',
    highlight && 'shadow-[0_0_0_3px_var(--wg-forest),0_26px_44px_-20px_rgb(27_38_34/0.5)] wide:-translate-y-2',
    className,
  )

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(surface, 'press outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [@media(hover:hover)]:hover:-translate-y-1')}
      >
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
