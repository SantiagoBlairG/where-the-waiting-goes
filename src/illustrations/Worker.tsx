type WorkerProps = {
  /** "fixed" belongs to a station. "extra" is the flexible worker the visitor can move. */
  variant?: 'fixed' | 'extra'
  label: string
  className?: string
}

/**
 * Outlined person, deliberately unlike an order dot (a plain filled or ringed circle).
 * The extra worker is drawn in the active color with a dashed outline.
 */
export function Worker({ variant = 'fixed', label, className }: WorkerProps) {
  const extra = variant === 'extra'
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 28 44"
      className={className}
      fill="none"
      stroke={extra ? 'var(--wg-active)' : 'currentColor'}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={extra ? '3 2.5' : undefined}
    >
      <circle cx="14" cy="9" r="6.5" fill="var(--wg-surface)" />
      <path
        d="M 3 42 C 3 31 6 20.5 14 20.5 C 22 20.5 25 31 25 42 Z"
        fill={extra ? 'var(--wg-active-tint)' : 'var(--wg-surface)'}
      />
    </svg>
  )
}
