import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Info, Pause, Play, RotateCcw } from 'lucide-react'
import { OrderDot } from '@/components/OrderDot'
import { StationCard } from '@/components/StationCard'
import { Button } from '@/components/ui/button'
import { gsap } from '@/lib/gsap'
import { GLOW_BACKGROUND } from '@/story/theme'
import { cn } from '@/lib/utils'
import { ORDER_COUNT, STATIONS, type StationId } from '@/simulation/config'
import { PRESETS, type PresetId } from '@/simulation/presets'
import { meanSoFarSeconds } from '@/simulation/metrics'
import type { ExtraPlacement } from '@/simulation/types'
import { ComparisonPanel } from './ComparisonPanel'
import { Dialogs, type DialogState } from './Dialogs'
import { FocusRail } from './FocusRail'
import { PLACEMENTS, activeWorkers, capacityIfExtraAt, insightFor, mmss, placementLabel } from './helpers'
import { useExperiment } from './useExperiment'
import { WorkerBench } from './WorkerBench'

const SCENARIO_NOTES: Record<PresetId, string> = {
  original: 'Three people, one at each step',
  cashier: 'Four people. The extra worker takes orders',
  barista: 'Four people. The extra worker makes drinks',
}

const ROOM = { bg: '#c8ded3', fg: '#1b2622', fg2: '#3c4d46', glowA: 'rgba(226,223,218,0.8)', glowB: 'rgba(136,164,154,0.45)' }
const STATION_NAMES = STATIONS.map((s) => s.name)
/** How strongly the outer tickets lean away from the focused one, in degrees per step. */
const LEAN = 4
const DROP = 12

/**
 * The interactive workspace. The visitor picks a setup or moves the one extra worker, plays the
 * same rush and watches the numbers. Everything on screen is read from the simulation session.
 * Dragging, the "Assign extra worker" control and the setup chooser all reach the same actions,
 * so keyboard and touch visitors can do everything a mouse can. The run controls live in a bar
 * that stays at the bottom of the screen while the workspace is in view, so Play is always close.
 *
 * Motion ownership: each ticket's wrapper ([data-rail-card]) is moved by GSAP (the arc, which
 * follows the focus rail); the ticket inside only reacts to the pointer through CSS.
 */
export function Experiment() {
  const { view, announcement, actions } = useExperiment()
  const { snapshot } = view
  const [focusIndex, setFocusIndex] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [dropTarget, setDropTarget] = useState<ExtraPlacement | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [showComparison, setShowComparison] = useState(false)
  const section = useRef<HTMLElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const lean = useRef({ f: 1 })
  const focus = STATIONS[focusIndex].id

  // The arc: tickets lean toward the focused one and the outer ones sit a little lower. Wide screens only.
  const applyArc = useCallback((position: number) => {
    const wide = window.matchMedia('(min-width: 900px)').matches
    gsap.utils.toArray<HTMLElement>('#experiment [data-rail-card]').forEach((el, i) => {
      if (!wide) {
        gsap.set(el, { clearProps: 'transform' })
        return
      }
      gsap.set(el, { transformPerspective: 1400, rotationY: (position - i) * LEAN, y: Math.abs(position - i) * DROP })
    })
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    gsap.killTweensOf(lean.current)
    gsap.to(lean.current, {
      f: focusIndex,
      duration: reduce ? 0 : 0.5,
      ease: 'power3.out',
      onUpdate: () => applyArc(lean.current.f),
      onComplete: () => applyArc(focusIndex),
    })
    if (reduce) applyArc(focusIndex)
  }, [focusIndex, applyArc])

  useEffect(() => {
    const onResize = () => applyArc(lean.current.f)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [applyArc])

  // Scrolling back up into the story pauses the run and keeps it; Play resumes it. Nothing resets.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) actions.pause()
      },
      { threshold: 0.02 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [actions])

  const open = (state: Exclude<DialogState, null>) => {
    opener.current = document.activeElement as HTMLElement | null
    actions.hold('dialog')
    setDialog(state)
  }
  const close = () => {
    actions.release('dialog')
    setDialog(null)
  }

  const extra = snapshot.extraWorker
  const destination = extra.pending ?? extra.at
  const orders = actions.orders()
  const average = meanSoFarSeconds(orders)
  const running = view.mode === 'running'
  const complete = view.mode === 'complete'
  const seconds = snapshot.timeSeconds

  const modeText = complete
    ? `Complete: all ${ORDER_COUNT} orders have been picked up.`
    : running
      ? `Running at ${view.speed}× speed.`
      : seconds === 0
        ? 'Paused at the start of the rush.'
        : 'Paused.'

  return (
    <section
      ref={section}
      id="experiment"
      aria-labelledby="experiment-heading"
      className="relative isolate px-6 py-24 sm:px-12 wide:px-[7vw]"
      style={{ backgroundColor: ROOM.bg, color: ROOM.fg }}
    >
      {/* Background layers are clipped on their own so the sticky run bar is not. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0" style={{ background: GLOW_BACKGROUND, ['--glow-a' as string]: ROOM.glowA, ['--glow-b' as string]: ROOM.glowB }} />
        <div className="grain pointer-events-none absolute inset-0" />
      </div>

      <a
        href="#run-controls"
        className="absolute left-4 top-4 z-50 -translate-y-20 rounded-control bg-paper px-4 py-2 text-sm font-semibold text-forest shadow-lg outline-none focus-visible:translate-y-0 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Skip to run controls
      </a>

      <div className="mx-auto flex max-w-6xl flex-col gap-14">
        <header className="flex flex-col items-start gap-5">
          <h2 id="experiment-heading" className="display max-w-[16ch] text-balance text-[clamp(2.5rem,6vw,5.4rem)] leading-[0.94]">
            Move the extra person
          </h2>
          <p className="max-w-[44ch] text-pretty text-lg leading-relaxed sm:text-xl" style={{ color: ROOM.fg2 }}>
            Pick a setup or place the extra worker yourself, then play the same rush from the beginning.
          </p>
          <p className="inline-flex items-center gap-2 rounded-full border border-current/25 px-3.5 py-1.5 text-sm font-medium">
            <Info aria-hidden="true" className="size-4" strokeWidth={2} />
            A simplified coffee-shop simulation
          </p>
        </header>

        {/* 1. The setup. Choosing one restarts the rush, paused. */}
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-1 text-lg font-semibold">Start from a setup</legend>
          <div className="grid gap-4 md:grid-cols-3">
            {PRESETS.map((preset) => {
              const selected = view.presetId === preset.id
              return (
                <label
                  key={preset.id}
                  className={cn(
                    'relative flex min-h-24 cursor-pointer flex-col gap-1 rounded-card bg-paper p-5 text-ink transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5',
                    'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                    selected ? 'shadow-[0_0_0_3px_var(--wg-forest)]' : 'shadow-[0_10px_24px_-14px_rgb(27_38_34/0.45)]',
                  )}
                >
                  <input type="radio" name="scenario" value={preset.id} checked={selected} onChange={() => actions.select(preset.id)} className="sr-only" />
                  <span className="font-display text-xl font-bold">{preset.name}</span>
                  <span className="text-sm text-ink-2">{SCENARIO_NOTES[preset.id]}</span>
                  <span className="mt-1 text-sm font-semibold tabular text-forest">{preset.workers.join(' · ')} workers</span>
                  {selected ? <span aria-hidden="true" className="absolute right-4 top-4 size-3 rounded-full bg-forest" /> : null}
                </label>
              )
            })}
          </div>
          <p className="text-sm" style={{ color: ROOM.fg2 }}>
            Choosing a setup restarts the rush from the beginning, paused. Workers are listed as order, drinks, pickup.
          </p>
        </fieldset>

        {/* 2. The stations on a shallow arc, the extra worker's bench, and the focus rail. */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 wide:flex-row wide:items-start">
            <div className="flex min-w-0 flex-1 flex-col gap-4 wide:flex-row wide:items-start wide:gap-2">
              {STATIONS.map((station, index) => {
                const here = extra.at === station.id
                const arriving = extra.pending === station.id
                const note =
                  here && extra.pending
                    ? `Finishing this order, then moving to ${placementLabel(extra.pending)}`
                    : arriving
                      ? 'Extra worker arrives after this order'
                      : undefined
                const drop = dragging ? (dropTarget === station.id ? 'over' : 'valid') : undefined
                return (
                  <Fragment key={station.id}>
                    {index > 0 ? (
                      <span aria-hidden="true" className="grid shrink-0 place-items-center self-center opacity-60 wide:mt-52 wide:w-10">
                        <svg viewBox="0 0 40 24" className="h-5 w-9 rotate-90 wide:rotate-0" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12h30M26 5l8 7-8 7" />
                        </svg>
                      </span>
                    ) : null}
                    <div
                      data-drop={station.id}
                      data-rail-card={index}
                      className="flex min-w-0 flex-1 basis-0 flex-col gap-4"
                      onClick={() => setFocusIndex(index)}
                    >
                      <StationCard
                        station={station}
                        snapshot={snapshot.stations[index]}
                        detail="full"
                        hasExtraWorker={here}
                        focused={focusIndex === index}
                        drop={drop}
                        dropHint={`Capacity if assigned: ${capacityIfExtraAt(station.id, station.id)} orders/min`}
                        note={note}
                        onLookCloser={() => open({ kind: 'station', id: station.id })}
                        onInspect={() => open({ kind: 'orders', id: station.id })}
                      />
                      {focusIndex === index ? (
                        <p className="animate-in fade-in-0 slide-in-from-top-1 rounded-2xl bg-paper px-5 py-4 text-base leading-relaxed text-ink shadow-[0_10px_24px_-14px_rgb(27_38_34/0.45)] duration-300 motion-reduce:animate-none">
                          <span className="mb-1 block text-sm font-bold text-forest">What this setup means</span>
                          {insightFor(destination)}
                        </p>
                      ) : null}
                    </div>
                  </Fragment>
                )
              })}
            </div>
            <WorkerBench
              placement={extra.at}
              pendingTo={extra.pending}
              onDragChange={(isDragging, target) => {
                setDragging(isDragging)
                setDropTarget(target)
              }}
              onDrop={(target) => actions.assign(target)}
            />
          </div>

          <FocusRail
            labels={STATION_NAMES}
            index={focusIndex}
            onChange={setFocusIndex}
            onProgress={(position) => {
              lean.current.f = position
              applyArc(position)
            }}
            frozen={dragging}
          />
        </div>

        {/* 3. Where the run stands, and the keyboard and touch way to place the worker. */}
        <div className="grid gap-5 wide:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-card bg-paper p-7 text-ink shadow-[0_10px_24px_-14px_rgb(27_38_34/0.45)]">
            <p className="text-sm font-medium text-ink-2">This run</p>
            <p className="font-display text-2xl font-bold">{view.label}</p>
            <p className="text-base text-ink-2" role="status">
              {modeText}
            </p>
            <p className="text-sm text-ink-2">{seconds > 600 ? 'Arrivals stopped at 10:00.' : 'Arrivals run until 10:00.'}</p>
          </div>

          <fieldset className="flex flex-col gap-4 rounded-card bg-paper p-7 text-ink shadow-[0_10px_24px_-14px_rgb(27_38_34/0.45)]">
            <legend className="sr-only">Assign extra worker</legend>
            <p className="text-lg font-semibold" aria-hidden="true">
              Assign extra worker
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PLACEMENTS.map((p) => {
                const selected = view.requested === p.id
                return (
                  <label
                    key={p.id}
                    className={cn(
                      'flex min-h-16 cursor-pointer flex-col justify-center gap-0.5 rounded-control border-2 px-4 py-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                      selected ? 'border-forest bg-active-tint' : 'border-line hover:border-forest/50',
                    )}
                  >
                    <input type="radio" name="extra-worker" checked={selected} onChange={() => actions.assign(p.id)} className="sr-only" />
                    <span className="text-base font-semibold">{p.label}</span>
                    {p.id !== 'off' ? (
                      <span className="text-xs text-ink-2 tabular">Capacity if assigned: {capacityIfExtraAt(p.id as StationId, p.id)} orders/min</span>
                    ) : (
                      <span className="text-xs text-ink-2">Not on the floor</span>
                    )}
                  </label>
                )
              })}
            </div>
            <p className="text-sm text-ink-2">A busy worker finishes the order they are making first. Moving a worker changes this run to a custom one.</p>
          </fieldset>
        </div>

        {/* 4. The numbers. Three headline figures; the average is secondary detail. */}
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Completed" value={snapshot.completed} suffix={`of ${ORDER_COUNT}`} />
            <Metric label="Still in the shop" value={snapshot.inShop} tint />
            <Metric label="Active workers" value={activeWorkers(snapshot)} />
          </div>
          <p className="text-sm tabular" style={{ color: ROOM.fg2 }}>
            Average time for completed orders so far: <strong style={{ color: ROOM.fg }}>{average === null ? 'none finished yet' : mmss(average)}</strong>. This is not
            comparable with the full-run averages below, which cover all {ORDER_COUNT} orders.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowComparison((v) => !v)} aria-expanded={showComparison} className="h-12 rounded-control px-6 text-base font-semibold">
            {showComparison ? 'Hide the comparison' : 'Compare the three setups'}
          </Button>
          <Button
            variant="outline"
            onClick={() => open({ kind: 'orders', id: focus })}
            className="h-12 rounded-control border-2 border-forest/30 bg-paper/50 px-6 text-base font-semibold text-forest hover:bg-paper"
          >
            See every order
          </Button>
          <Button
            variant="outline"
            onClick={() => open({ kind: 'how' })}
            className="h-12 rounded-control border-2 border-forest/30 bg-paper/50 px-6 text-base font-semibold text-forest hover:bg-paper"
          >
            How this works
          </Button>
        </div>

        {showComparison ? <ComparisonPanel /> : null}

        {/* The run bar. It is the last child so it can stick to the bottom of the screen while the
            workspace is in view, on every screen size. Play is never far away. */}
        <div
          id="run-controls"
          role="group"
          aria-label="Run controls"
          className="sticky bottom-4 z-40 -mx-2 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[28px] bg-paper px-4 py-3 text-ink shadow-[0_18px_40px_-12px_rgb(27_38_34/0.55)] ring-1 ring-ink/10 sm:px-6"
        >
          <Button
            onClick={running ? actions.pause : actions.play}
            disabled={complete}
            className="h-12 min-w-28 gap-2 rounded-full px-5 text-base font-semibold"
          >
            {running ? <Pause aria-hidden="true" className="size-5" /> : <Play aria-hidden="true" className="size-5" />}
            {running ? 'Pause' : complete ? 'Finished' : 'Play'}
          </Button>
          <Button
            variant="outline"
            onClick={actions.restart}
            aria-label="Restart this setup"
            className="h-12 gap-2 rounded-full border-2 border-forest/30 px-4 text-base font-semibold text-forest hover:bg-active-tint"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Restart this setup</span>
          </Button>
          <div className="flex items-baseline gap-2">
            <output className="display text-4xl leading-none tabular" aria-label={`Clock ${mmss(seconds)}`}>
              {mmss(seconds)}
            </output>
            <span className="hidden text-sm text-ink-2 sm:inline">clock</span>
          </div>
          <fieldset className="ml-auto">
            <legend className="sr-only">Speed</legend>
            <div className="flex gap-1.5">
              {([10, 1] as const).map((s) => (
                <label
                  key={s}
                  className={cn(
                    'cursor-pointer rounded-full px-3.5 py-2.5 text-sm font-semibold transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                    view.speed === s ? 'bg-forest text-paper' : 'bg-line/50 text-ink hover:bg-line',
                  )}
                >
                  <input type="radio" name="speed" checked={view.speed === s} onChange={() => actions.setSpeed(s)} className="sr-only" />
                  {s === 10 ? '10× faster' : 'Real time'}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <Dialogs state={dialog} onClose={close} restoreFocus={() => opener.current?.focus()} snapshot={snapshot} orders={dialog ? orders : []} />
    </section>
  )
}

function Metric({ label, value, suffix, tint = false }: { label: string; value: number; suffix?: string; tint?: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-paper p-6 text-ink shadow-[0_10px_24px_-14px_rgb(27_38_34/0.45)]">
      <p className="flex items-center gap-2 text-sm font-medium text-ink-2">
        {tint ? <OrderDot state="waiting" /> : null}
        {label}
      </p>
      <p className="display text-6xl leading-[0.9] tabular">
        {value}
        {suffix ? <span className="ml-2 text-xl font-semibold text-ink-2">{suffix}</span> : null}
      </p>
    </div>
  )
}
