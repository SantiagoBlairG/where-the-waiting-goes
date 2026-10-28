import { useId, useMemo, useState } from 'react'
import { ChevronDown, Timer, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ORDER_COUNT } from '@/simulation/config'
import { PRESETS, type FullRunResult, type Preset, type PresetId } from '@/simulation/presets'
import { explainPreset } from './analysis'
import { mmss } from './helpers'

type ResultsPanelProps = {
  /** Results of the runs the visitor has finished, keyed by setup. */
  results: Partial<Record<PresetId, FullRunResult>>
  baseline: FullRunResult
  /** Which finished run the panel shows. */
  shown: PresetId
  onShow: (id: PresetId) => void
  /** A setup not yet run, if any. Its button selects it, scrolls up and starts the run. */
  next?: Preset
  onTryNext: (id: PresetId) => void
}

const FADE = 'animate-in fade-in-0 slide-in-from-bottom-1 duration-500 ease-out motion-reduce:animate-none'

/** "1:42 sooner" or "0:20 later", against the original team. */
function versus(seconds: number, baseline: number) {
  const d = Math.round(baseline - seconds)
  if (d === 0) return 'same as the original team'
  return `${mmss(Math.abs(d))} ${d > 0 ? 'sooner' : 'later'} than the original team`
}

/**
 * The results of the finished runs, in one card. A switch at the top moves between the setups
 * already run, so comparing never means scrolling. The headline numbers stay visible; the
 * explanation can be folded away. Every figure is the model's full-run result.
 *
 * Motion ownership: CSS only. The fold is a grid-rows transition; a newly shown result fades in.
 */
export function ResultsPanel({ results, baseline, shown, onShow, next, onTryNext }: ResultsPanelProps) {
  const [open, setOpen] = useState(true)
  const detailsId = useId()
  const preset = PRESETS.find((p) => p.id === shown)!
  const result = results[shown]
  const explanation = useMemo(() => (result ? explainPreset(preset, result, baseline) : []), [preset, result, baseline])
  if (!result) return null

  return (
    <section
      aria-labelledby={`${detailsId}-title`}
      className="flex flex-col gap-5 rounded-card bg-paper p-6 text-ink shadow-[0_22px_40px_-24px_rgb(27_38_34/0.5)] animate-in fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`${detailsId}-title`} className="text-sm font-semibold text-forest">
          Results
        </h3>
        <div role="group" aria-label="Show the result of" className="flex flex-wrap gap-1 rounded-full bg-ink/[0.05] p-1">
          {PRESETS.map((p) => {
            const done = !!results[p.id]
            const on = p.id === shown
            return (
              <button
                key={p.id}
                type="button"
                disabled={!done}
                aria-pressed={on}
                onClick={() => onShow(p.id)}
                title={done ? undefined : 'Not run yet'}
                className={cn(
                  'press min-h-9 rounded-full px-3.5 text-sm font-semibold outline-none transition-[background-color,color,scale] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50',
                  on ? 'bg-forest text-paper' : done ? 'cursor-pointer text-ink hover:bg-ink/[0.07]' : 'cursor-not-allowed text-ink-2/60',
                )}
              >
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      <div key={shown} className={cn('flex flex-col gap-4', FADE)}>
        <p className="display text-[clamp(1.7rem,3.2vw,2.6rem)] leading-tight">
          {preset.name}: {result.completedAtClose} of {ORDER_COUNT} coffees handed over by 10:00.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-active-tint px-3.5 py-2 text-sm font-semibold text-forest tabular">
            <Timer aria-hidden="true" className="size-4" strokeWidth={2.25} />
            All {ORDER_COUNT} coffees served in {mmss(result.lastPickupSeconds)}
            {shown !== 'original' ? <span className="font-medium">{' '}· {versus(result.lastPickupSeconds, baseline.lastPickupSeconds)}</span> : null}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.06] px-3.5 py-2 text-sm font-semibold text-ink tabular">
            <Users aria-hidden="true" className="size-4" strokeWidth={2.25} />
            Average {mmss(result.meanTotalSeconds)} per customer, door to cup
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-control py-1 text-sm font-semibold underline decoration-ink/30 decoration-2 underline-offset-4 outline-none transition-colors hover:decoration-ink focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {open ? 'Hide why' : 'Show why'}
        <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform duration-300 ease-[var(--ease-out)]', open && 'rotate-180')} strokeWidth={2.25} />
      </button>

      <div id={detailsId} className="grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out)] motion-reduce:transition-none" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        {/* Hidden for real once folded: visibility flips at the end of the fold, so it still animates. */}
        <div className={cn('min-h-0 overflow-hidden transition-[visibility] duration-500', !open && 'invisible')} inert={!open}>
          <div key={shown} className={cn('flex flex-col gap-5', FADE)}>
            <ul className="flex max-w-[64ch] flex-col gap-1.5 text-base leading-relaxed text-ink-2">
              {explanation.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {next ? (
              <button
                type="button"
                onClick={() => onTryNext(next.id)}
                className="press w-fit cursor-pointer rounded-full bg-forest px-5 py-3 text-base font-semibold text-paper outline-none transition-[background-color,scale] duration-150 hover:bg-[#2f5348] focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Run {next.name.toLowerCase()} next
              </button>
            ) : (
              <p className="text-base font-semibold">You have tried them all. Switch between them above.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
