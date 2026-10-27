import { cn } from '@/lib/utils'

export type DotState = 'service' | 'waiting' | 'done'

const styles: Record<DotState, string> = {
  // Solid: a worker is making this order right now.
  service: 'bg-active border-active',
  // Ring with a warm tint: waiting for a free worker.
  waiting: 'bg-queue-tint border-queue',
  // Soft solid: finished and picked up.
  done: 'bg-ink-2/30 border-ink-2/30',
}

/**
 * One order. Decorative on its own: the surrounding card always states the same
 * information as text, so dots are hidden from assistive technology.
 */
export function OrderDot({ state, className }: { state: DotState; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-3.5 shrink-0 rounded-full border-2 animate-in zoom-in-50 fade-in-0 duration-300 motion-reduce:animate-none',
        styles[state],
        className,
      )}
    />
  )
}
