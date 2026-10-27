import { UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

type WorkerProps = {
  /** "fixed" belongs to a station. "extra" is the flexible worker the visitor can move. */
  variant?: 'fixed' | 'extra'
  label: string
  /** Size classes for the round badge, for example "size-12". */
  className?: string
}

/**
 * A worker is a round badge with a person glyph (Lucide's "user-round", ISC licence). It is
 * deliberately not a dot, so a person is never confused with an order. The extra worker is a
 * green badge with a dashed ring: it can be moved.
 */
export function Worker({ variant = 'fixed', label, className }: WorkerProps) {
  const extra = variant === 'extra'
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full',
        extra ? 'border-2 border-dashed border-forest bg-active-tint text-forest' : 'bg-ink/[0.07] text-ink',
        className,
      )}
    >
      <UserRound aria-hidden="true" className="size-[58%]" strokeWidth={1.75} />
    </span>
  )
}
