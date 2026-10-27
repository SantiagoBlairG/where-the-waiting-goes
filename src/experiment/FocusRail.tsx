import { useEffect, useRef, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Draggable, gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

type FocusRailProps = {
  labels: readonly string[]
  index: number
  onChange: (index: number) => void
  /** Live position while dragging, as a fraction of the stops: 0 is the first, labels.length - 1 the last. */
  onProgress: (position: number) => void
  /** Frozen while the extra worker is being dragged, so the two drags never compete. */
  frozen: boolean
}

/**
 * The focus rail. A dedicated handle slides along three stops; releasing snaps to the nearest
 * one. Movement is bounded: there is no wrap-around and the process order never changes. The
 * stations stay in view, so neighbouring names are always visible. The same control works by
 * keyboard (arrow keys on the handle, or the buttons) and by clicking a station name.
 *
 * Motion ownership: GSAP Draggable owns the handle's transform.
 */
export function FocusRail({ labels, index, onChange, onProgress, frozen }: FocusRailProps) {
  const track = useRef<HTMLDivElement>(null)
  const thumb = useRef<HTMLDivElement>(null)
  const drag = useRef<Draggable | null>(null)
  const last = labels.length - 1
  const callbacks = useRef({ onChange, onProgress })
  useEffect(() => {
    callbacks.current = { onChange, onProgress }
  })

  useGSAP(
    () => {
      const t = track.current
      const h = thumb.current
      if (!t || !h) return
      const span = () => Math.max(1, t.clientWidth - h.offsetWidth)
      const [instance] = Draggable.create(h, {
        type: 'x',
        bounds: t,
        minimumMovement: 6,
        onDrag() {
          callbacks.current.onProgress((this.x / span()) * last)
        },
        onRelease() {
          const stop = Math.round(gsap.utils.clamp(0, last, (this.x / span()) * last))
          callbacks.current.onChange(stop)
          gsap.to(h, { x: (span() * stop) / last, duration: 0.35, ease: 'power3.out' })
        },
      })
      drag.current = instance
      return () => instance.kill()
    },
    { scope: track },
  )

  // Keep the handle on the focused stop when focus changes any other way.
  useEffect(() => {
    const t = track.current
    const h = thumb.current
    if (!t || !h) return
    gsap.to(h, { x: ((t.clientWidth - h.offsetWidth) * index) / last, duration: 0.35, ease: 'power3.out' })
  }, [index, last])

  useEffect(() => {
    if (frozen) drag.current?.disable()
    else drag.current?.enable()
  }, [frozen])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(Math.min(last, index + 1))
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(Math.max(0, index - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      onChange(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      onChange(last)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          aria-label="Focus the previous station"
          disabled={index === 0}
          onClick={() => onChange(index - 1)}
          className="size-11 shrink-0 rounded-full border-current/35 bg-paper/60 p-0 text-ink hover:bg-paper"
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Button>

        <div className="relative min-w-0 flex-1 px-1 py-2">
          <div ref={track} className="relative h-12 rounded-full bg-paper/70 shadow-[inset_0_2px_6px_rgb(27_38_34/0.12)]">
            {labels.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/25"
                style={{ left: `calc(1.5rem + (100% - 3rem) * ${i / last})` }}
              />
            ))}
            <div
              ref={thumb}
              role="slider"
              tabIndex={0}
              aria-label="Focus station"
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={last}
              aria-valuenow={index}
              aria-valuetext={labels[index]}
              onKeyDown={onKey}
              className={cn(
                'absolute left-0 top-0 grid h-12 w-12 cursor-grab touch-none place-items-center rounded-full bg-forest text-paper shadow-[0_6px_14px_-4px_rgb(27_38_34/0.5)] outline-none',
                'focus-visible:ring-3 focus-visible:ring-ring/60 active:cursor-grabbing',
                frozen && 'opacity-50',
              )}
            >
              <GripHorizontal aria-hidden="true" className="size-5" />
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          aria-label="Focus the next station"
          disabled={index === last}
          onClick={() => onChange(index + 1)}
          className="size-11 shrink-0 rounded-full border-current/35 bg-paper/60 p-0 text-ink hover:bg-paper"
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </Button>
      </div>

      <div className="flex justify-between gap-2 px-16 text-sm font-medium">
        {labels.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-pressed={i === index}
            onClick={() => onChange(i)}
            className={cn(
              'min-h-9 rounded-full px-3 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
              i === index ? 'bg-paper font-bold text-ink' : 'opacity-80 hover:bg-paper/50',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
