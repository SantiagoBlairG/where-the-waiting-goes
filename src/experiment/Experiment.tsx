import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Info, Pause, Play, RotateCcw } from 'lucide-react'
import { StationTile } from '@/components/StationTile'
import { cn } from '@/lib/utils'
import { ADMISSION_WINDOW_SECONDS, ORDER_COUNT, STATIONS } from '@/simulation/config'
import { PRESETS, fullRunResult, type FullRunResult, type PresetId } from '@/simulation/presets'
import { GLOW_BACKGROUND } from '@/story/theme'
import { explainPreset } from './analysis'
import { Dialogs, type DialogState } from './Dialogs'
import { mmss } from './helpers'
import { useExperiment } from './useExperiment'

const ROOM = { bg: '#c8ded3', fg: '#1b2622', fg2: '#3c4d46', glowA: 'rgba(226,223,218,0.8)', glowB: 'rgba(136,164,154,0.45)' }

/** What each setup changes, in a few words. */
const CHANGE: Record<PresetId, string> = {
  original: 'One person at each step',
  cashier: '+1 person at the register',
  barista: '+1 person making drinks',
}

/** Full-run results for each setup, from the model, computed once. */
const FULL = Object.fromEntries(PRESETS.map((p) => [p.id, fullRunResult(p)])) as Record<PresetId, FullRunResult>
const BASELINE = FULL.original

/**
 * The experiment, reduced to one decision and one button. Three setup tabs, one stage, one Play.
 * A finished run writes its result onto its own tab, so after trying the three setups the
 * comparison is simply the three tabs side by side: no panel to find, no scrolling up and down.
 * Tapping a station opens its details. Every number comes from the simulation session.
 *
 * Motion ownership: tiles are CSS-only (StationTile). The run bar's progress fill is a CSS
 * transform transition. Nothing here is moved by GSAP.
 */
export function Experiment() {
  const { view, announcement, actions } = useExperiment()
  const { snapshot } = view
  const [dialog, setDialog] = useState<DialogState>(null)
  const [results, setResults] = useState<Partial<Record<PresetId, FullRunResult>>>({})
  const section = useRef<HTMLElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const controls = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)

  const running = view.mode === 'running'
  const complete = view.mode === 'complete'
  const seconds = snapshot.timeSeconds
  const preset = PRESETS.find((p) => p.id === view.presetId)!

  // A finished run leaves its result on its tab (state adjusted during render, not in an effect).
  // The numbers are the model's full-run results, the same ones the run on screen just produced.
  if (complete && !results[view.presetId]) setResults({ ...results, [view.presetId]: FULL[view.presetId] })

  // Scrolling back up into the story pauses the run and keeps it; Play resumes it.
  useEffect(() => {
    const el = section.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => !entry.isIntersecting && actions.pause(), { threshold: 0.02 })
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

  // Play brings the run into view so the floating run bar never hides the numbers: the tabs and
  // the stage together if they fit above the bar, else the whole stage, else the top of the stage.
  const play = () => {
    const block = controls.current
    const tiles = stage.current
    if (block && tiles) {
      const top = 88
      const bottom = window.innerHeight - 96
      const b = block.getBoundingClientRect()
      const t = tiles.getBoundingClientRect()
      const shift = t.bottom - b.top <= bottom - top ? b.top - top : t.height <= bottom - top ? t.bottom - bottom : t.top - top
      if (Math.abs(shift) > 24) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: window.scrollY + shift, behavior: reduce ? 'auto' : 'smooth' })
      }
    }
    actions.play()
  }

  const result = results[view.presetId]
  const explanation = useMemo(() => (result ? explainPreset(preset, result, BASELINE) : null), [result, preset])
  const next = PRESETS.find((p) => !results[p.id] && p.id !== view.presetId)
  // The clock bar runs to the last pickup, so it is full exactly when the run is.
  const lastPickup = FULL[view.presetId].lastPickupSeconds
  const progress = Math.min(1, seconds / lastPickup)

  return (
    <section
      ref={section}
      id="experiment"
      aria-labelledby="experiment-heading"
      className="relative isolate -mt-10 overflow-x-clip rounded-t-[40px] px-6 pb-16 pt-24 sm:px-12 wide:px-[7vw]"
      style={{ backgroundColor: ROOM.bg, color: ROOM.fg }}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-t-[40px]">
        <div className="absolute inset-0" style={{ background: GLOW_BACKGROUND, ['--glow-a' as string]: ROOM.glowA, ['--glow-b' as string]: ROOM.glowB }} />
        <div className="grain pointer-events-none absolute inset-0" />
      </div>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-10">
        <header className="flex flex-col items-start gap-4">
          <p className="glass rounded-full px-4 py-1.5 text-sm font-semibold">Your turn</p>
          <h2 id="experiment-heading" className="display max-w-[18ch] text-balance text-[clamp(2.4rem,5.4vw,4.8rem)] leading-[0.96]">
            Run the rush <span className="accent-serif">yourself</span>
          </h2>
          <p className="max-w-[48ch] text-pretty text-lg leading-relaxed" style={{ color: ROOM.fg2 }}>
            Pick where the extra person works and press Play. Each result stays on its tab, so you can compare.
          </p>
        </header>

        {/* Everything you operate, in one block. The run bar sticks only while this block is on screen. */}
        <div ref={controls} className="flex scroll-mt-24 flex-col gap-10">
          {/* 1. The decision. Choosing a setup restarts the rush from the beginning, paused. */}
          <fieldset>
            <legend className="sr-only">Choose a setup</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {PRESETS.map((p) => {
                const selected = view.presetId === p.id
                const done = results[p.id]
                return (
                  <label
                    key={p.id}
                    className={cn(
                      'press relative flex min-h-[7.5rem] cursor-pointer flex-col gap-1.5 rounded-[26px] p-5 transition-[background-color,box-shadow,scale] duration-200 ease-[var(--ease-out)]',
                      'has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                      selected ? 'bg-paper shadow-[0_0_0_2.5px_var(--wg-forest),0_18px_36px_-18px_rgb(27_38_34/0.45)]' : 'glass hover:bg-white/50',
                    )}
                  >
                    <input type="radio" name="setup" value={p.id} checked={selected} onChange={() => actions.select(p.id)} className="sr-only" />
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-xl font-semibold">{p.name}</span>
                      {done ? (
                        <span className="grid size-6 place-items-center rounded-full bg-forest text-paper">
                          <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-ink-2">{CHANGE[p.id]}</span>
                    <span className="mt-auto pt-2 text-sm tabular">
                      {done ? (
                        <>
                          <strong className="display text-2xl">{done.completedAtClose}</strong> coffees by 10:00
                          <span className="text-ink-2"> · avg {mmss(done.meanTotalSeconds)}</span>
                        </>
                      ) : (
                        <span className="text-ink-2">Not run yet</span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* 2. The stage: the same three tiles as the story, now with the people at each step. */}
          <div ref={stage} className="grid gap-4 sm:grid-cols-3 sm:gap-5 wide:gap-7">
            {STATIONS.map((station, i) => {
              const s = snapshot.stations[i]
              return (
                <StationTile
                  key={station.id}
                  station={station}
                  waiting={s.queue}
                  inService={s.inService}
                  people={s.workers}
                  chip={s.workers > 1 ? { text: `+1 here`, tone: 'active' } : undefined}
                  onOpen={() => open({ kind: 'station', id: station.id })}
                />
              )
            })}
          </div>

          {/* 3. The result of this setup, once its run is finished. */}
          {complete && result && explanation ? (
            <div className="flex flex-col gap-4 rounded-card bg-paper p-7 text-ink shadow-[0_22px_40px_-24px_rgb(27_38_34/0.5)] animate-in fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none sm:p-9">
              <p className="text-sm font-semibold text-forest">{preset.name}: finished</p>
              <p className="display text-[clamp(1.8rem,3.4vw,2.8rem)] leading-tight">
                {result.completedAtClose} of {ORDER_COUNT} coffees handed over by 10:00.
              </p>
              <ul className="flex max-w-[64ch] flex-col gap-1.5 text-base leading-relaxed text-ink-2">
                {explanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {next ? (
                <button
                  type="button"
                  onClick={() => actions.select(next.id)}
                  className="press mt-2 w-fit rounded-full bg-forest px-5 py-3 text-base font-semibold text-paper outline-none transition-[background-color,scale] duration-150 hover:bg-[#2f5348] focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  Try {next.name.toLowerCase()} next
                </button>
              ) : (
                <p className="text-base font-semibold">You have tried all three. Compare them on the tabs above.</p>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" style={{ color: ROOM.fg2 }}>
            <span className="inline-flex items-center gap-2">
              <Info aria-hidden="true" className="size-4" strokeWidth={2} />A simplified coffee-shop simulation, not a forecast.
            </span>
            <button
              type="button"
              onClick={() => open({ kind: 'how' })}
              className="rounded-control px-1 py-2 font-semibold underline underline-offset-4 outline-none hover:opacity-75 focus-visible:ring-3 focus-visible:ring-ring/50"
              style={{ color: ROOM.fg }}
            >
              How this works
            </button>
          </div>

          {/* The run bar: last child so it can stick to the bottom of the screen while the workspace is in view. */}
          <div id="run-controls" role="group" aria-label="Run controls" className="glass sticky bottom-4 z-40 flex items-center gap-2 rounded-full p-2 pr-4 text-ink sm:gap-4 sm:pr-5">
            <button
              type="button"
              onClick={running ? actions.pause : play}
              disabled={complete}
              className="press flex h-12 items-center sm:min-w-[7.5rem] justify-center gap-2 rounded-full bg-forest px-5 text-base font-semibold text-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] outline-none transition-[background-color,scale,opacity] duration-150 hover:bg-[#2f5348] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
            >
              {running ? <Pause aria-hidden="true" className="size-5" /> : <Play aria-hidden="true" className="size-5" />}
              {running ? 'Pause' : complete ? 'Finished' : seconds === 0 ? 'Play' : 'Resume'}
            </button>
            <button
              type="button"
              onClick={actions.restart}
              aria-label="Restart this setup"
              className="press grid size-12 shrink-0 place-items-center rounded-full bg-white/50 outline-none transition-[background-color,scale] duration-150 hover:bg-white/80 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <RotateCcw aria-hidden="true" className="size-5" />
            </button>
            <output className="display shrink-0 text-2xl leading-none tabular sm:w-[4.2rem] sm:text-3xl" aria-label={`Clock ${mmss(seconds)}`}>
              {mmss(seconds)}
            </output>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span aria-hidden="true" className="relative h-1.5 overflow-hidden rounded-full bg-ink/10">
                <span
                  className="absolute inset-0 origin-left rounded-full bg-forest transition-transform duration-200 ease-linear"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </span>
              <span className="truncate text-sm font-medium tabular text-ink-2">
                <span className="sm:hidden">
                  {snapshot.completed}/{ORDER_COUNT} done
                </span>
                <span className="max-sm:hidden">
                  {snapshot.completed} of {ORDER_COUNT} handed over{seconds > ADMISSION_WINDOW_SECONDS ? ' · no new orders after 10:00' : ''}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <Dialogs state={dialog} onClose={close} restoreFocus={() => opener.current?.focus()} snapshot={snapshot} />
    </section>
  )
}
