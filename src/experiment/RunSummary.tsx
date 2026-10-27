import { ORDER_COUNT, STATIONS } from '@/simulation/config'
import { completedBy, lastPickupSeconds, meanQueueWaitSeconds, meanTotalSeconds } from '@/simulation/metrics'
import type { ExtraPlacement, OrderRecord } from '@/simulation/types'
import { slowestStep, DEMAND_PER_MINUTE } from './analysis'
import { mmss, placementLabel } from './helpers'

type RunSummaryProps = {
  orders: readonly OrderRecord[]
  label: string
  custom: boolean
  /** Where the extra worker ended up. */
  placement: ExtraPlacement
}

/**
 * Shown only when a run has finished, because only then do all 30 orders have a complete journey
 * and the cohort average is honest. A custom run is not compared with the presets: the worker
 * moved during the run, so it has no matching full-run result.
 */
export function RunSummary({ orders, label, custom, placement }: RunSummaryProps) {
  const average = meanTotalSeconds(orders, ORDER_COUNT)
  const last = lastPickupSeconds(orders, ORDER_COUNT)
  if (average === null || last === null) return null
  const waits = meanQueueWaitSeconds(orders)
  const slow = slowestStep(placement)
  return (
    <section aria-labelledby="run-summary-heading" className="animate-in fade-in-0 slide-in-from-bottom-2 flex flex-col gap-5 rounded-card bg-paper p-7 text-ink shadow-[0_10px_24px_-14px_rgb(27_38_34/0.45)] duration-500 motion-reduce:animate-none">
      <div>
        <h3 id="run-summary-heading" className="display text-3xl">
          This run, finished
        </h3>
        <p className="mt-1 text-sm text-ink-2">
          {label}. All {ORDER_COUNT} orders, run to the end.
        </p>
      </div>
      <dl className="grid gap-5 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-ink-2">Picked up by 10:00</dt>
          <dd className="display text-4xl tabular">
            {completedBy(orders, 600_000)} <span className="text-lg font-semibold text-ink-2">of {ORDER_COUNT}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-2">Average time, all {ORDER_COUNT} orders</dt>
          <dd className="display text-4xl tabular">{mmss(average)}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-2">Last order picked up</dt>
          <dd className="display text-4xl tabular">{mmss(last)}</dd>
        </div>
      </dl>
      <p className="text-base leading-relaxed">
        <strong>Where orders waited, on average:</strong>{' '}
        {STATIONS.map((s, i) => `${s.name} ${Math.round(waits[i])} s`).join(', ')}.
      </p>
      <p className="text-base leading-relaxed text-ink-2">
        With the extra worker {placement === 'off' ? 'off duty' : `at ${placementLabel(placement)}`}, {slow.name} is the slowest step at{' '}
        {Number.isInteger(slow.perMinute) ? slow.perMinute : slow.perMinute.toFixed(1)} orders a minute, while {DEMAND_PER_MINUTE} arrive.
        {custom
          ? ' Because you moved a worker during this run, it is not compared with the three setups: they were run with the worker in one place from the start.'
          : ' Open the comparison to see this setup next to the other two.'}
      </p>
    </section>
  )
}
