import { useRef } from 'react'
import { ArrowDown } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { BEAT_THEMES } from './theme'
import { useStoryMode } from './useStoryMode'

/** The card sits inset in the window, like a framed photograph, until the camera moves in. */
const INSET = 'inset(14px 14px 14px 14px round 40px)'
const FULL = 'inset(0px 0px 0px 0px round 0px)'
const FIRST_ROOM = BEAT_THEMES[0].bg

/**
 * The welcome. A full-width rounded card with the story's name, one caption and one call to
 * action. Scrolling (or the button) moves the camera into the card: it grows to fill the window,
 * the words rush past, and its deep green settles into the first room of the story, so the story
 * begins where the card ends.
 *
 * Pinned mode only gets the zoom. Narrow screens and reduced motion get the same card as a plain
 * first screen, and the button simply scrolls to the story.
 *
 * Motion ownership: GSAP writes [data-hero-card] (clip-path), [data-hero-content] and
 * [data-hero-flow] (transform, opacity), [data-hero-wash] and [data-hero-frame] (opacity), all from one scrubbed
 * timeline. In pinned mode the story is pulled up under the hero (StoryExperience, -160svh),
 * so when the card fades the first chapter is already there. The flowing order dots are a CSS keyframe loop inside [data-hero-flow] only.
 */
export function Hero() {
  const pinned = useStoryMode() === 'pinned'
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!pinned) return
      const q = gsap.utils.selector(root)
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      })
      // 0 to 0.5: the card grows to fill the window; the words rush past the camera and are gone by 0.35.
      // 0.38 to 0.58: its green settles toward the first room's stone.
      // 0.52 to 0.72: the hero dissolves; the story is already pinned underneath, in the same colour.
      // The rest is a short hold, so the scrub's smoothing has finished before the hero scrolls away.
      tl.fromTo(q('[data-hero-card]'), { clipPath: INSET }, { clipPath: FULL, duration: 0.5, ease: 'power2.inOut' }, 0)
        .to(q('[data-hero-content]'), { scale: 1.32, autoAlpha: 0, duration: 0.33, ease: 'power2.in' }, 0.02)
        .to(q('[data-hero-flow]'), { scale: 1.8, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0)
        .to(q('[data-hero-wash]'), { autoAlpha: 1, duration: 0.2, ease: 'power1.inOut' }, 0.38)
        .to(q('[data-hero-frame]'), { autoAlpha: 0, duration: 0.2, ease: 'power1.inOut' }, 0.52)
        .to({}, { duration: 0.28 }, 0.72)
      return () => tl.scrollTrigger?.kill()
    },
    { scope: root, dependencies: [pinned] },
  )

  const begin = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = pinned && root.current ? root.current.offsetTop + root.current.offsetHeight - window.innerHeight + 2 : '#story'
    if (reduce) {
      if (typeof target === 'number') window.scrollTo(0, target)
      else document.querySelector(target)?.scrollIntoView()
      return
    }
    gsap.to(window, { scrollTo: { y: target, autoKill: true }, duration: pinned ? 1.8 : 1, ease: 'power2.inOut' })
  }

  return (
    <section ref={root} aria-labelledby="hero-title" className={cn('relative', pinned ? 'pointer-events-none z-10 h-[220svh]' : 'h-svh min-h-[560px]')}>
      <div data-hero-frame className={cn('pointer-events-auto top-0 h-svh min-h-[560px] overflow-hidden', pinned && 'sticky')} style={{ backgroundColor: FIRST_ROOM }}>
        <div
          data-hero-card
          className="absolute inset-0 overflow-hidden text-paper"
          style={{ clipPath: INSET, background: 'radial-gradient(120% 90% at 85% 0%, #4d7a6b 0%, #2f5348 45%, #1f3a32 100%)' }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(45% 50% at 12% 88%, rgba(210,196,158,0.32), transparent 70%), radial-gradient(40% 45% at 92% 18%, rgba(200,222,211,0.28), transparent 70%)',
            }}
          />
          <div className="grain pointer-events-none absolute inset-0" />

          <Flow />

          <div
            data-hero-content
            className="relative flex h-full flex-col justify-end gap-7 px-[clamp(28px,7vw,120px)] pb-[clamp(56px,12svh,128px)] pt-28"
          >
            <p className="glass glass-dark inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold text-paper">
              <span aria-hidden="true" className="size-2 rounded-full bg-sand" />A three-minute story about a coffee line
            </p>
            <h1 id="hero-title" className="display max-w-[11ch] text-[clamp(3.4rem,10vw,10rem)] leading-[0.88]">
              Where the <span className="accent-serif">waiting</span> goes
            </h1>
            <p className="max-w-[40ch] text-pretty text-[clamp(1.05rem,1.6vw,1.35rem)] leading-relaxed text-[#d9e6df]">
              Speed up one step of a busy café and your coffee can still arrive no sooner. Follow one order through the morning rush to find out why.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <button
                type="button"
                onClick={begin}
                className="glass press group inline-flex h-14 items-center gap-3 rounded-full pl-7 pr-2 text-lg font-semibold text-ink outline-none transition-[scale,box-shadow] duration-200 focus-visible:ring-3 focus-visible:ring-paper/60"
              >
                See the story
                <span className="grid size-10 place-items-center rounded-full bg-forest text-paper transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-y-0.5">
                  <ArrowDown aria-hidden="true" className="size-5" strokeWidth={2.25} />
                </span>
              </button>
              <span className="text-sm font-medium text-[#c9dad1]">or just scroll</span>
            </div>
          </div>

          {/* The first room of the story, washing in as the card fills the window. */}
          <div data-hero-wash aria-hidden="true" className="pointer-events-none invisible absolute inset-0 opacity-0" style={{ backgroundColor: FIRST_ROOM }} />
        </div>
      </div>
    </section>
  )
}

/**
 * The idea of the story in one picture: orders flow along three stops and pile up before the
 * middle one. Decorative; the words say the same thing.
 */
function Flow() {
  const stops = [0.16, 0.5, 0.84]
  return (
    <div data-hero-flow aria-hidden="true" className="pointer-events-none absolute inset-x-[6%] top-[22%] h-24 origin-center max-wide:hidden wide:left-[46%]">
      <div className="absolute inset-x-0 top-1/2 h-px bg-paper/25" />
      {stops.map((x, i) => (
        <div key={x} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x * 100}%` }}>
          <div className={cn('grid size-14 place-items-center rounded-full border border-paper/35', i === 1 ? 'bg-paper/15' : 'bg-paper/5')}>
            <span className="display text-xl text-paper/90">{i + 1}</span>
          </div>
        </div>
      ))}
      {/* The pile in front of the slowest step. */}
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-sand bg-sand/20"
          style={{ left: `calc(${stops[1] * 100}% - ${44 + i * 18}px)` }}
        />
      ))}
      {/* Orders arriving, and fewer leaving. */}
      <div className="hero-flow-lane absolute inset-x-0 top-1/2 h-0">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="hero-dot-in absolute inset-x-0 top-0" style={{ animationDelay: `${i * -1.1}s` }}>
            <span className="absolute left-0 size-2.5 -translate-y-1/2 rounded-full bg-paper" />
          </span>
        ))}
        {[0, 1].map((i) => (
          <span key={i} className="hero-dot-out absolute inset-x-0 top-0" style={{ animationDelay: `${i * -2.2}s` }}>
            <span className="absolute left-0 size-2.5 -translate-y-1/2 rounded-full bg-mist" />
          </span>
        ))}
      </div>
    </div>
  )
}

