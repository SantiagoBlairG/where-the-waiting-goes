import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ARRIVAL_INTERVAL_SECONDS, ORDER_COUNT, STATIONS, capacityPerMinute, type StationId } from '@/simulation/config'
import type { OrderRecord, Snapshot } from '@/simulation/types'
import { mmss } from './helpers'

export type DialogState = { kind: 'station'; id: StationId } | { kind: 'orders'; id: StationId } | { kind: 'how' } | null

type DialogsProps = {
  state: DialogState
  onClose: () => void
  /** Put focus back on the control that opened the dialog. */
  restoreFocus: () => void
  snapshot: Snapshot
  orders: readonly OrderRecord[]
}

const contentClass = 'max-h-[85svh] gap-5 overflow-y-auto rounded-card bg-paper p-7 text-ink sm:max-w-xl'

/**
 * The detail dialogs. Radix gives us the focus trap, Escape to close and focus returning to the
 * button that opened them. The experiment is held (paused) while one is open.
 */
export function Dialogs({ state, onClose, restoreFocus, snapshot, orders }: DialogsProps) {
  // Radix returns focus to a DialogTrigger, and ours open from code, so we do it ourselves.
  const closeProps = {
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault()
      restoreFocus()
    },
  }
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      {state?.kind === 'station' ? <StationDetail id={state.id} snapshot={snapshot} {...closeProps} /> : null}
      {state?.kind === 'orders' ? <OrderDetail id={state.id} orders={orders} nowMs={snapshot.timeMs} {...closeProps} /> : null}
      {state?.kind === 'how' ? <HowItWorks {...closeProps} /> : null}
    </Dialog>
  )
}

type CloseProps = { onCloseAutoFocus: (event: Event) => void }

function StationDetail({ id, snapshot, onCloseAutoFocus }: { id: StationId; snapshot: Snapshot } & CloseProps) {
  const index = STATIONS.findIndex((s) => s.id === id)
  const station = STATIONS[index]
  const now = snapshot.stations[index]
  const capacity = capacityPerMinute(station, now.workers)
  const perWorker = capacityPerMinute(station, 1)
  return (
    <DialogContent className={contentClass} onCloseAutoFocus={onCloseAutoFocus}>
      <DialogHeader>
        <DialogTitle className="font-display text-3xl font-bold">{station.name}</DialogTitle>
        <DialogDescription className="text-base text-ink-2">How this station works in the model.</DialogDescription>
      </DialogHeader>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-base">
        <div>
          <dt className="text-sm text-ink-2">Service time</dt>
          <dd className="display text-3xl tabular">{station.serviceSeconds} s</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-2">Workers here</dt>
          <dd className="display text-3xl tabular">{now.workers}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-2">Waiting in line</dt>
          <dd className="display text-3xl tabular">{now.queue}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-2">Being made now</dt>
          <dd className="display text-3xl tabular">{now.inService}</dd>
        </div>
      </dl>
      <div className="rounded-control bg-active-tint p-5">
        <p className="text-sm font-semibold text-forest">Capacity</p>
        <p className="mt-1 text-lg tabular">
          {now.workers} {now.workers === 1 ? 'worker' : 'workers'} × 60 ÷ {station.serviceSeconds} seconds ={' '}
          <strong>{capacity % 1 === 0 ? capacity : capacity.toFixed(1)} orders a minute</strong>
        </p>
      </div>
      <p className="text-base leading-relaxed text-ink-2">
        One worker finishes an order every {station.serviceSeconds} seconds, which is {perWorker % 1 === 0 ? perWorker : perWorker.toFixed(1)} a
        minute. A second worker doubles that, as long as the equipment and space can take them.
      </p>
    </DialogContent>
  )
}

/** Where an order is, in words, and how long it has waited at each station. */
function describe(o: OrderRecord, nowMs: number) {
  const stations = STATIONS.map((_, k) => {
    const arrived = o.stationArrivalMs[k]
    if (arrived < 0) return { waited: null as number | null }
    const started = o.serviceStartMs[k]
    return { waited: ((started >= 0 ? started : nowMs) - arrived) / 1000 }
  })
  let where = 'Picked up'
  if (o.departureMs < 0) {
    const k = STATIONS.findIndex((_, i) => o.stationArrivalMs[i] >= 0 && o.serviceEndMs[i] < 0)
    where = `${STATIONS[k].name}, ${o.serviceStartMs[k] >= 0 ? 'being made' : 'waiting'}`
  }
  return { stations, where }
}

function OrderDetail({ id, orders, nowMs, onCloseAutoFocus }: { id: StationId; orders: readonly OrderRecord[]; nowMs: number } & CloseProps) {
  const station = STATIONS.find((s) => s.id === id)!
  const index = STATIONS.indexOf(station)
  // Orders currently at this station first, then everything else so far.
  const here = orders.filter((o) => o.departureMs < 0 && o.stationArrivalMs[index] >= 0 && o.serviceEndMs[index] < 0)
  const rest = orders.filter((o) => !here.includes(o))
  const rows = [...here, ...[...rest].reverse()]
  return (
    <DialogContent className={contentClass + ' sm:max-w-3xl'} onCloseAutoFocus={onCloseAutoFocus}>
      <DialogHeader>
        <DialogTitle className="font-display text-3xl font-bold">Orders</DialogTitle>
        <DialogDescription className="text-base text-ink-2">
          {here.length === 0
            ? `No orders are at ${station.name} right now.`
            : `${here.length} ${here.length === 1 ? 'order is' : 'orders are'} at ${station.name}. Listed first.`}{' '}
          Every order that has arrived so far is below.
        </DialogDescription>
      </DialogHeader>
      {rows.length === 0 ? (
        <p className="text-base text-ink-2">No order has arrived yet. Press Play and come back.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm tabular">
            <caption className="sr-only">Journey of every order so far</caption>
            <thead>
              <tr className="border-b-2 border-line text-ink-2">
                <th scope="col" className="py-2 pr-3 font-semibold">Order</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Arrived</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Now</th>
                {STATIONS.map((s) => (
                  <th key={s.id} scope="col" className="py-2 pr-3 font-semibold">
                    Waited at {s.name}
                  </th>
                ))}
                <th scope="col" className="py-2 font-semibold">Done</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const d = describe(o, nowMs)
                return (
                  <tr key={o.id} className="border-b border-line align-top">
                    <th scope="row" className="py-2 pr-3 font-semibold">#{o.id + 1}</th>
                    <td className="py-2 pr-3">{mmss(o.arrivalMs / 1000)}</td>
                    <td className="py-2 pr-3">{d.where}</td>
                    {d.stations.map((s, k) => (
                      <td key={k} className="py-2 pr-3">{s.waited === null ? 'not yet' : `${Math.round(s.waited)} s`}</td>
                    ))}
                    <td className="py-2">{o.departureMs >= 0 ? mmss(o.departureMs / 1000) : 'in the shop'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </DialogContent>
  )
}

function HowItWorks({ onCloseAutoFocus }: CloseProps) {
  return (
    <DialogContent className={contentClass} onCloseAutoFocus={onCloseAutoFocus}>
      <DialogHeader>
        <DialogTitle className="font-display text-3xl font-bold">How this works</DialogTitle>
        <DialogDescription className="text-base text-ink-2">A simplified coffee-shop simulation. It is an illustration, not a forecast for a real café.</DialogDescription>
      </DialogHeader>
      <ul className="list-disc space-y-2.5 pl-5 text-base leading-relaxed">
        <li>
          {ORDER_COUNT} customers each place one identical order, one every {ARRIVAL_INTERVAL_SECONDS} seconds for ten minutes. Nobody arrives after that, and the run
          continues until every order has left.
        </li>
        <li>
          Every order visits {STATIONS.map((s) => s.name).join(', then ')}. One worker at a station serves one order at a time, first come, first served.
        </li>
        <li>
          Service takes {STATIONS.map((s) => `${s.serviceSeconds} seconds at ${s.name}`).join(', ')}.
        </li>
        <li>An extra worker has the equipment and space they need. The model does not show two baristas sharing one machine.</li>
        <li>There is no randomness, no breaks and no travel time, so the same setup always gives the same result.</li>
        <li>Moving a worker who is busy waits until they finish the order they are making.</li>
      </ul>
    </DialogContent>
  )
}
