import { useEffect, useRef } from 'react'
import { Draggable, gsap, useGSAP } from '@/lib/gsap'
import { Worker } from '@/illustrations/Worker'
import type { ExtraPlacement } from '@/simulation/types'
import { placementLabel } from './helpers'

type WorkerBenchProps = {
  placement: ExtraPlacement
  pendingTo: ExtraPlacement | null
  onDragChange: (dragging: boolean, target: ExtraPlacement | null) => void
  onDrop: (target: ExtraPlacement) => void
}

/** The drop zone under a point, read from the [data-drop] attribute of whatever is there. */
function zoneAt(x: number, y: number): ExtraPlacement | null {
  for (const el of document.elementsFromPoint(x, y)) {
    const id = (el as HTMLElement).dataset?.drop
    if (id) return id as ExtraPlacement
  }
  return null
}

/**
 * The extra worker's bench and drag handle. Drag the badge onto a station to assign it, or onto
 * the bench to send it off duty. A drop anywhere else returns the badge to the bench and changes
 * nothing. A small movement threshold keeps a click from counting as a drag. Everything it does
 * is also possible without dragging from the "Assign extra worker" control.
 *
 * Motion ownership: GSAP Draggable owns the handle's transform; nothing else touches it.
 */
export function WorkerBench({ placement, pendingTo, onDragChange, onDrop }: WorkerBenchProps) {
  const handle = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onDragChange, onDrop })
  useEffect(() => {
    callbacks.current = { onDragChange, onDrop }
  })

  useGSAP(
    () => {
      const el = handle.current
      if (!el) return
      let last: ExtraPlacement | null = null
      const [drag] = Draggable.create(el, {
        type: 'x,y',
        minimumMovement: 8,
        zIndexBoost: true,
        onDragStart() {
          callbacks.current.onDragChange(true, null)
        },
        onDrag(e: PointerEvent) {
          const target = zoneAt(e.clientX, e.clientY)
          if (target !== last) {
            last = target
            callbacks.current.onDragChange(true, target)
          }
        },
        onDragEnd(e: PointerEvent) {
          const target = zoneAt(e.clientX, e.clientY)
          last = null
          callbacks.current.onDragChange(false, null)
          if (target) callbacks.current.onDrop(target)
          // Snap back to the bench either way: the assignment shows on the stations.
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          gsap.to(el, { x: 0, y: 0, duration: reduce ? 0 : 0.3, ease: 'power3.out' })
        },
      })
      return () => drag.kill()
    },
    { scope: handle },
  )

  const status = pendingTo
    ? `Finishing this order, then moving to ${placementLabel(pendingTo)}`
    : placement === 'off'
      ? 'On the bench'
      : `Working at ${placementLabel(placement)}`

  return (
    <div
      data-drop="off"
      className="flex shrink-0 flex-col items-center gap-4 rounded-card border-2 border-dashed border-current/45 px-6 py-7 text-center wide:w-52"
    >
      <p className="text-base font-semibold">Extra worker</p>
      <div
        ref={handle}
        aria-hidden="true"
        className="relative z-40 grid size-24 cursor-grab touch-none place-items-center rounded-full bg-paper shadow-[0_10px_24px_-8px_rgb(27_38_34/0.45)] active:cursor-grabbing"
      >
        <Worker variant="extra" label="Extra worker" className="size-[4.5rem]" />
      </div>
      <p className="min-h-10 text-sm font-medium leading-snug" aria-live="polite">
        {status}
      </p>
      <p className="text-xs leading-snug opacity-80">Drag onto a station. You can also use the controls below.</p>
    </div>
  )
}
