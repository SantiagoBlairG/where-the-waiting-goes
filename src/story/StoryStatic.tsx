import type { ReactNode } from 'react'
import { CoffeeStage } from '@/components/CoffeeStage'
import { OrderDot } from '@/components/OrderDot'
import { IsoCylinder, IsoFigure } from '@/illustrations/iso'
import type { Origin } from '@/illustrations/iso-math'
import { Register } from '@/illustrations/Register'
import { Worker } from '@/illustrations/Worker'
import { cn } from '@/lib/utils'
import { MODEL_LABEL, SAME_RUSH_LABEL, beats, type Beat, type BeatId } from './storyBeats'
import { baselineAtClose, baselineMidRush, cashierAtClose, startOfRush } from './storySnapshots'

/**
 * PHASE 1: the static sequence. Each beat is a full section with real copy and a fixed
 * stage state. No scroll animation yet (Phase 3). The stage components are the ones the
 * animated story and the experiment will reuse.
 */
export function StoryStatic() {
  const byId = Object.fromEntries(beats.map((b) => [b.id, b])) as Record<BeatId, Beat>

  return (
    <div className="bg-page text-ink">
      <Opening beat={byId.familiar} />

      <Beat beat={byId['three-stops']}>
        <CoffeeStage
          snapshot={startOfRush}
          detail="named"
          trail={{ order: 'now', drinks: 'next', pickup: 'next' }}
          className="mx-auto w-full max-w-5xl"
        />
      </Beat>

      <Beat beat={byId.rush}>
        <div className="mx-auto w-full max-w-5xl">
          <CoffeeStage snapshot={baselineMidRush} detail="counts" arc showTotals />
          <Key />
        </div>
      </Beat>

      <Beat beat={byId.fix}>
        <Compare onlyOrderCounts />
      </Beat>

      <Beat beat={byId.surprise}>
        <Compare emphasis="queue" showTotals />
      </Beat>

      <Beat beat={byId.reveal}>
        <div className="mx-auto w-full max-w-5xl">
          <CoffeeStage
            snapshot={cashierAtClose}
            detail="full"
            arc
            extraAt="order"
            emphasis={{ station: 'drinks', kind: 'both' }}
          />
        </div>
      </Beat>

      <YourTurn beat={byId['your-turn']} />
    </div>
  )
}

function Opening({ beat }: { beat: Beat }) {
  return (
    <section
      aria-labelledby="opening-heading"
      className="relative flex min-h-[100svh] flex-col items-center justify-center gap-10 px-5 py-16 text-center sm:px-8"
    >
      <div className="flex flex-col items-center gap-5">
        <h1
          id="opening-heading"
          className="max-w-[18ch] text-balance text-[clamp(2.25rem,6.2vw+0.5rem,5.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]"
        >
          {beat.headline}
        </h1>
        <p className="max-w-[34ch] text-balance text-lg text-ink-2 sm:text-xl">{beat.support}</p>
      </div>

      <OpeningScene description={beat.stageDescription} />

      <div className="flex flex-col items-center gap-3">
        <p className="text-base text-ink-2">Scroll to follow one order</p>
        <a
          href="#experiment"
          className="rounded-control px-3 py-2 text-sm font-medium text-active underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Skip to experiment
        </a>
      </div>
    </section>
  )
}

const cupOrigin: Origin = { ox: 40, oy: 56 }

function OpeningScene({ description }: { description: string }) {
  return (
    <figure className="flex w-full max-w-xl items-end justify-center gap-4 sm:gap-8">
      <figcaption className="sr-only">{description}</figcaption>
      <div className="flex flex-col items-center gap-2">
        <OrderDot state="service" className="size-5" />
        <p className="text-sm text-ink-2">Your order</p>
      </div>
      <svg aria-hidden="true" viewBox="0 0 80 12" className="mb-8 w-14 shrink-0 text-ink-2 sm:w-24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round">
        <path d="M2 6h76" />
      </svg>
      <Register className="h-auto w-40 shrink-0 text-ink sm:w-56" />
      <IsoFigure label="A cup of coffee with a lid, steaming" viewBox="0 0 80 90" className="mb-1 h-auto w-14 shrink-0 text-ink sm:w-20">
        <IsoCylinder origin={cupOrigin} x={0} y={0} z={0} r={1.1} h={2.4} lid />
        <g stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" vectorEffect="non-scaling-stroke">
          <path d="M 34 24 q -4 -5 0 -10 q 4 -5 0 -10" />
          <path d="M 46 26 q -4 -5 0 -10 q 4 -5 0 -10" />
        </g>
      </IsoFigure>
    </figure>
  )
}

function Beat({ beat, children }: { beat: Beat; children: ReactNode }) {
  const headingId = `beat-${beat.id}`
  return (
    <section aria-labelledby={headingId} className="flex min-h-[100svh] flex-col justify-center gap-8 px-5 py-12 sm:px-8 lg:py-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <h2
          id={headingId}
          className="max-w-[20ch] text-balance text-[clamp(2rem,3.6vw+0.75rem,3.25rem)] font-semibold leading-[1.08] tracking-[-0.025em]"
        >
          {beat.headline}
        </h2>
        {beat.support ? <p className="max-w-[44ch] text-pretty text-lg text-ink-2">{beat.support}</p> : null}
      </div>
      <figure className="m-0">
        <figcaption className="sr-only">{beat.stageDescription}</figcaption>
        {children}
      </figure>
    </section>
  )
}

/** onlyOrderCounts: beat 4 shows just the register queue, so beat 5 can reveal the drinks queue. */
function Compare({
  emphasis,
  showTotals = false,
  onlyOrderCounts = false,
}: {
  emphasis?: 'queue'
  showTotals?: boolean
  onlyOrderCounts?: boolean
}) {
  const rows = [
    { title: 'Original team', snapshot: baselineAtClose, extra: undefined },
    { title: 'With an extra cashier', snapshot: cashierAtClose, extra: 'order' as const },
  ]
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <p className="text-center text-base font-medium text-ink">{SAME_RUSH_LABEL}</p>
      <div className="flex flex-col gap-10">
        {rows.map((row) => (
          <div key={row.title} className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">{row.title}</h3>
            <CoffeeStage
              snapshot={row.snapshot}
              detail="counts"
              compact
              extraAt={row.extra}
              countsAt={onlyOrderCounts ? ['order'] : undefined}
              emphasis={emphasis ? { station: 'drinks', kind: emphasis } : { station: 'order', kind: 'queue' }}
              showTotals={showTotals}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function Key() {
  return (
    <p className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-2">
      <span className="flex items-center gap-2">
        <OrderDot state="service" /> Being made
      </span>
      <span className="flex items-center gap-2">
        <OrderDot state="waiting" /> Waiting
      </span>
      <span className="flex items-center gap-2">
        <OrderDot state="done" /> Picked up
      </span>
    </p>
  )
}

function YourTurn({ beat }: { beat: Beat }) {
  return (
    <section
      id="experiment"
      aria-labelledby="beat-your-turn"
      className="flex min-h-[100svh] flex-col justify-center gap-8 px-5 py-12 sm:px-8 lg:py-14"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <h2
          id="beat-your-turn"
          className="max-w-[20ch] text-balance text-[clamp(2rem,3.6vw+0.75rem,3.25rem)] font-semibold leading-[1.08] tracking-[-0.025em]"
        >
          {beat.headline}
        </h2>
        <p className="max-w-[44ch] text-pretty text-lg text-ink-2">{beat.support}</p>
      </div>

      <figure className="m-0 mx-auto flex w-full max-w-6xl flex-col items-stretch gap-8 lg:flex-row lg:items-center">
        <figcaption className="sr-only">{beat.stageDescription}</figcaption>
        <div className="min-w-0 flex-1">
          <CoffeeStage snapshot={startOfRush} detail="full" arc />
        </div>
        <div className="flex shrink-0 flex-row items-center gap-4 self-center rounded-card border border-dashed border-active/50 bg-active-tint/50 px-6 py-5 lg:w-40 lg:flex-col lg:py-8">
          <Worker variant="extra" label="Extra worker, on the bench" className={cn('h-16 text-ink')} />
          <p className="text-sm font-medium text-active lg:text-center">Extra worker</p>
        </div>
      </figure>

      <p className="text-center text-sm text-ink-2">{MODEL_LABEL}. Not a forecast for a real café.</p>
    </section>
  )
}
