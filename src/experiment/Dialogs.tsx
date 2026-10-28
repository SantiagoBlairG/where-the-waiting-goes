import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ARRIVAL_INTERVAL_SECONDS, ORDER_COUNT, STATIONS, capacityPerMinute, type StationId } from '@/simulation/config'
import type { Snapshot } from '@/simulation/types'

export type DialogState = { kind: 'station'; id: StationId } | { kind: 'how' } | null

type DialogsProps = {
  state: DialogState
  onClose: () => void
  /** Put focus back on the control that opened the dialog. */
  restoreFocus: () => void
  snapshot: Snapshot
}

const contentClass = 'max-h-[85svh] gap-5 overflow-y-auto rounded-card bg-paper p-7 text-ink sm:max-w-xl'

/**
 * The detail dialogs. Radix gives us the focus trap, Escape to close and focus returning to the
 * button that opened them. The experiment is held (paused) while one is open.
 */
export function Dialogs({ state, onClose, restoreFocus, snapshot }: DialogsProps) {
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
          <dt className="text-sm text-ink-2">Service time (average)</dt>
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
        Orders take {station.pattern.join(', ')} seconds in turn here, about {station.serviceSeconds} on average, so one worker finishes about {perWorker % 1 === 0 ? perWorker : perWorker.toFixed(1)} a
        minute. A second worker doubles that, as long as the equipment and space can take them.
      </p>
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
          Service takes about {STATIONS.map((s) => `${s.serviceSeconds} seconds at ${s.name}`).join(', ')} on average. Customers differ in a fixed repeating pattern
          (for example {STATIONS[1].pattern.join(', ')} seconds for three drinks in a row), so every run of the same setup is identical.
        </li>
        <li>An extra worker has the equipment and space they need. The model does not show two baristas sharing one machine.</li>
        <li>There is no randomness, no breaks and no travel time.</li>
        <li>Moving a worker who is busy waits until they finish the order they are making.</li>
      </ul>
    </DialogContent>
  )
}
