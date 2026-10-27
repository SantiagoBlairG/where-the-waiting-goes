import { useMemo } from 'react'
import { ORDER_COUNT, STATIONS } from '@/simulation/config'
import { PRESETS, fullRunResult } from '@/simulation/presets'
import { cn } from '@/lib/utils'
import { mmss } from './helpers'

/**
 * The three predefined setups, each run to the very end in its own fresh simulation. This does
 * not depend on, and never changes, the live run above it: it is labelled "Full-run model
 * results" so it cannot be mistaken for a partway comparison.
 */
export function ComparisonPanel() {
  const rows = useMemo(() => PRESETS.map((preset) => ({ preset, result: fullRunResult(preset) })), [])
  const slowest = Math.max(...rows.map((r) => r.result.meanTotalSeconds))
  return (
    <section aria-labelledby="comparison-heading" className="flex flex-col gap-6 rounded-card bg-paper/80 p-7 text-ink sm:p-9">
      <div className="flex flex-col gap-2">
        <h3 id="comparison-heading" className="display text-4xl">
          Full-run model results
        </h3>
        <p className="max-w-[60ch] text-base leading-relaxed text-ink-2">
          The same {ORDER_COUNT} orders and the same ten minutes of arrivals, run to the end for each setup. These do not depend on the run above.
          The original team has three people; the other two have four, so compare those two with each other.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {rows.map(({ preset, result }) => (
          <article key={preset.id} className="flex flex-col gap-5 rounded-card bg-paper p-6 shadow-[0_10px_24px_-12px_rgb(27_38_34/0.35)]">
            <header>
              <h4 className="font-display text-xl font-bold">{preset.name}</h4>
              <p className="mt-1 text-sm text-ink-2 tabular">
                {preset.workers.join(' · ')} workers, {preset.totalWorkers} people
              </p>
            </header>
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-sm text-ink-2">Picked up by 10:00</dt>
                <dd className="display text-4xl tabular">
                  {result.completedAtClose} <span className="text-lg font-semibold text-ink-2">of {ORDER_COUNT}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-ink-2">Average time, all {ORDER_COUNT} orders</dt>
                <dd className="display text-4xl tabular">{mmss(result.meanTotalSeconds)}</dd>
                <div aria-hidden="true" className="mt-2 h-2 rounded-full bg-line/60">
                  <div
                    className={cn('h-full rounded-full', preset.id === 'barista' ? 'bg-forest' : 'bg-ember/80')}
                    style={{ width: `${(result.meanTotalSeconds / slowest) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <dt className="text-sm text-ink-2">Last order picked up</dt>
                <dd className="display text-3xl tabular">{mmss(result.lastPickupSeconds)}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink-2">Average wait in line</dt>
                <dd className="mt-1 flex flex-col gap-1 text-sm tabular">
                  {STATIONS.map((s, i) => (
                    <span key={s.id} className="flex justify-between gap-3">
                      <span>{s.name}</span>
                      <strong>{Math.round(result.queueWaitSeconds[i])} s</strong>
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  )
}
