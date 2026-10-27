import { useMemo } from 'react'
import { ARRIVAL_INTERVAL_SECONDS, ORDER_COUNT, STATIONS, type StationId } from '@/simulation/config'
import { PRESETS, fullRunResult } from '@/simulation/presets'
import { cn } from '@/lib/utils'
import { DEMAND_PER_MINUTE, explainPreset, stationLoads, waitShares } from './analysis'
import { mmss } from './helpers'

/** One color per station, matching the tickets, so the bars read without a key. Text always says the same thing. */
const SEGMENT: Record<StationId, string> = { order: 'bg-forest', drinks: 'bg-ember', pickup: 'bg-sage' }

/**
 * The three predefined setups, each run to the very end in its own fresh simulation. This does
 * not depend on, and never changes, the live run above it: it is labelled "Full-run model
 * results" so it cannot be mistaken for a partway comparison. It explains the difference in plain
 * words: demand is fixed, only the step that limits the whole process matters, and an extra
 * person elsewhere just moves the wait.
 */
export function ComparisonPanel() {
  const rows = useMemo(() => PRESETS.map((preset) => ({ preset, result: fullRunResult(preset) })), [])
  const baseline = rows[0].result
  const slowest = Math.max(...rows.map((r) => r.result.meanTotalSeconds))
  const maxWait = Math.max(...rows.map((r) => waitShares(r.result).reduce((n, s) => n + s.seconds, 0)))
  return (
    <section aria-labelledby="comparison-heading" className="flex flex-col gap-10 rounded-card bg-paper/80 p-7 text-ink sm:p-9">
      <div className="flex flex-col gap-4">
        <h3 id="comparison-heading" className="display text-4xl">
          Full-run model results
        </h3>
        <p className="max-w-[62ch] text-base leading-relaxed text-ink-2">
          The same {ORDER_COUNT} orders and the same ten minutes of arrivals, run to the end for each setup. These do not depend on the run above.
        </p>
        <ul className="grid gap-3 text-base leading-relaxed md:grid-cols-3">
          <li className="rounded-control bg-paper p-4">
            <strong className="block font-display text-lg">The demand is fixed</strong>
            An order arrives every {ARRIVAL_INTERVAL_SECONDS} seconds, {DEMAND_PER_MINUTE} a minute, in every setup.
          </li>
          <li className="rounded-control bg-paper p-4">
            <strong className="block font-display text-lg">The staffing is not</strong>
            The original team has three people. The other two have four, so compare those two with each other.
          </li>
          <li className="rounded-control bg-paper p-4">
            <strong className="block font-display text-lg">Only the slowest step counts</strong>
            An extra person helps only at the step that limits the whole process. Anywhere else they just move the wait.
          </li>
        </ul>
      </div>

      <figure className="flex flex-col gap-4" aria-labelledby="waiting-caption">
        <figcaption id="waiting-caption" className="font-display text-2xl font-bold">
          Where the waiting went
        </figcaption>
        <p className="text-sm text-ink-2">Average wait in line per order, split by station. Same total orders, same ten minutes.</p>
        <ol className="flex flex-col gap-4">
          {rows.map(({ preset, result }) => (
            <li key={preset.id} className="grid items-center gap-x-5 gap-y-2 md:grid-cols-[11rem_1fr]">
              <span className="font-semibold">{preset.name}</span>
              <div className="flex flex-col gap-1.5">
                <div className="flex h-8 overflow-hidden rounded-full bg-line/50" aria-hidden="true">
                  {waitShares(result).map((s) => (
                    <span key={s.id} className={cn('h-full', SEGMENT[s.id])} style={{ width: `${(s.seconds / maxWait) * 100}%` }} />
                  ))}
                </div>
                <p className="flex flex-wrap gap-x-5 gap-y-0.5 text-sm tabular">
                  {waitShares(result).map((s) => (
                    <span key={s.id} className="flex items-center gap-1.5">
                      <span aria-hidden="true" className={cn('size-2.5 rounded-full', SEGMENT[s.id])} />
                      {s.name} <strong>{Math.round(s.seconds)} s</strong>
                    </span>
                  ))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </figure>

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
                <dt className="text-sm text-ink-2">Capacity per minute, against {DEMAND_PER_MINUTE} arriving</dt>
                <dd className="mt-1 flex flex-col gap-1 text-sm tabular">
                  {stationLoads(preset.config.extra).map((l) => (
                    <span key={l.id} className="flex justify-between gap-3">
                      <span>{l.name}</span>
                      <strong className={l.keepsUp ? 'text-forest' : 'text-ember'}>
                        {Number.isInteger(l.perMinute) ? l.perMinute : l.perMinute.toFixed(1)} {l.keepsUp ? 'keeps up' : 'falls behind'}
                      </strong>
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <div className="border-t-2 border-dashed border-line pt-4">
              <p className="mb-2 text-sm font-bold text-forest">What happened</p>
              <ul className="flex flex-col gap-2 text-sm leading-relaxed">
                {explainPreset(preset, result, baseline).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
      <p className="max-w-[62ch] text-sm text-ink-2">
        {STATIONS.map((s) => `${s.name}: ${s.serviceSeconds} seconds a worker`).join('. ')}.
      </p>
    </section>
  )
}
