import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { backToTop, goToStory } from '@/story/navigate'

type Mode = 'hero' | 'story' | 'experiment'

/** Which part of the page the reader is in. Read from layout, never stored per pixel. */
function readMode(): Mode {
  const experiment = document.getElementById('experiment')
  if (experiment && experiment.getBoundingClientRect().top < window.innerHeight * 0.6) return 'experiment'
  const track = document.querySelector<HTMLElement>('[data-story-track]')
  // Pinned layout: the welcome lasts until the hero starts to dissolve into the first chapter.
  const heroEnd = track ? track.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.25 : window.innerHeight * 0.5
  return window.scrollY < heroEnd ? 'hero' : 'story'
}

/**
 * The floating glass pill. It changes with the page: on the welcome it offers "See story"; in the
 * story it steps back to just the title, so nothing competes with the chapters; in the experiment
 * it offers a quieter "Back to top". Between states the pill reshapes rather than jumps: its
 * button column grows or folds (grid-template-columns, 560 ms on the drawer curve) while the
 * button itself materialises, fading in from a slight blur and scale.
 *
 * Motion ownership: CSS transitions only. The scroll position is read on animation frames and
 * only the mode is stored, so the nav re-renders three times a page, not per pixel.
 */
export function SiteNav() {
  const [mode, setMode] = useState<Mode>('hero')

  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      setMode(readMode())
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const cta = mode === 'story' ? null : mode
  // The button that folds away stays drawn while it folds, so the slot is sized to it alone.
  // (Welcome and experiment are never next to each other: the story always lies between them.)
  const [last, setLast] = useState<Exclude<Mode, 'story'>>('hero')
  if (cta && cta !== last) setLast(cta)

  return (
    <nav aria-label="Page" className="glass fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full p-1.5 text-sm font-semibold text-ink">
      <div
        className="grid items-center transition-[grid-template-columns] duration-[560ms] ease-[var(--ease-drawer)] motion-reduce:transition-none"
        style={{ gridTemplateColumns: cta ? 'auto 1fr' : 'auto 0fr' }}
      >
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            backToTop()
          }}
          className={cn(
            'display press flex min-h-10 items-center whitespace-nowrap rounded-full text-sm outline-none sm:text-base transition-[padding] duration-[560ms] ease-[var(--ease-drawer)] focus-visible:ring-3 focus-visible:ring-ring/50',
            cta ? 'pl-3.5 pr-3' : 'px-4',
          )}
        >
          Where the waiting goes
        </a>

        {/* The button cell clips while it folds. */}
        <div className="-m-1 grid min-w-0 overflow-hidden p-1">
          {last === 'hero' ? (
            <NavButton key="hero" shown={cta === 'hero'} onClick={goToStory} tone="primary" icon={<ArrowDown aria-hidden="true" className="size-4" strokeWidth={2.25} />}>
              <Label short="Story">See story</Label>
            </NavButton>
          ) : (
            <NavButton key="experiment" shown={cta === 'experiment'} onClick={backToTop} tone="secondary" icon={<ArrowUp aria-hidden="true" className="size-4" strokeWidth={2.25} />}>
              <Label short="Top">Back to top</Label>
            </NavButton>
          )}
        </div>
      </div>
    </nav>
  )
}

/** Full label, shortened on phones so the pill fits a 320px screen. The full words stay the name. */
function Label({ short, children }: { short: string; children: string }) {
  return (
    <>
      <span className="sm:hidden" aria-hidden="true">
        {short}
      </span>
      <span className="max-sm:sr-only">{children}</span>
    </>
  )
}

function NavButton({ shown, onClick, tone, icon, children }: { shown: boolean; onClick: () => void; tone: 'primary' | 'secondary'; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      inert={!shown}
      aria-hidden={!shown || undefined}
      className={cn(
        'press col-start-1 row-start-1 flex min-h-10 cursor-pointer items-center justify-self-end gap-1.5 whitespace-nowrap rounded-full px-3.5 outline-none sm:px-4 focus-visible:ring-3 focus-visible:ring-ring/50',
        'transition-[opacity,scale,filter,background-color] duration-[380ms] ease-[var(--ease-out)] motion-reduce:transition-none',
        tone === 'primary'
          ? 'bg-forest text-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] hover:bg-[#2f5348]'
          : 'bg-white/60 text-ink shadow-[inset_0_0_0_1px_rgb(27_38_34/0.1)] hover:bg-white/90',
        // starting: gives a freshly mounted button the same entrance as one that changes state.
        shown
          ? 'opacity-100 blur-0 delay-150 [scale:1] starting:opacity-0 starting:blur-[6px] starting:[scale:0.88]'
          : 'pointer-events-none opacity-0 blur-[6px] [scale:0.88]',
      )}
    >
      {children}
      {icon}
    </button>
  )
}
