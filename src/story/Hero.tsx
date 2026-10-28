import { useRef } from 'react'
import { ArrowDown } from 'lucide-react'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { RevealText } from './RevealText'
import { BEAT_THEMES } from './theme'
import { stopMagnet } from './magnet'
import { beatRest } from './timeline'
import { useStoryMode } from './useStoryMode'

const FIRST_ROOM = BEAT_THEMES[0].bg
const FULL = 'inset(0px 0px 0px 0px round 0px)'

/** The card sits well inside the window, like a framed photograph, until the camera moves in. */
function insetFor(width: number, height: number) {
  const x = Math.round(Math.min(88, Math.max(20, width * 0.045)))
  const y = Math.round(Math.min(64, Math.max(20, height * 0.06)))
  return `inset(${y}px ${x}px ${y}px ${x}px round 48px)`
}

/**
 * Scroll budget, in viewport heights. The hero is 320svh tall, so its sticky frame has 220svh of
 * scroll to play the zoom: slow enough to feel like a camera move. StoryExperience pulls the
 * story 228svh up underneath it (pinned at 92svh, as the dissolve starts at 0.42 x 220svh), so the first chapter is pinned before the hero dissolves.
 */
export const HERO_HEIGHT_SVH = 320

/**
 * The welcome. A rounded card with the story's name, one caption and one call to action.
 * Scrolling (or the button) moves the camera into the card: it grows to the window's edges, the
 * words drift past at different depths, its green settles into the first room's stone and it
 * dissolves into the story pinned underneath.
 *
 * Pinned mode gets the zoom, the load entrance and the pointer parallax. Narrow screens and
 * reduced motion get the same card as a still first screen; the button simply scrolls on.
 *
 * Motion ownership (one writer each):
 *   [data-hero-card] clip-path, [data-hero-scene] scale, [data-depth] y and opacity,
 *   [data-hero-flow] scale/y/opacity, [data-hero-wash] and [data-hero-frame] opacity: the scrubbed timeline.
 *   [data-hero-pointer], [data-hero-pointer-flow]: pointer parallax (gsap.quickTo), x and y only.
 *   [data-intro] and the title's [data-word]: the load entrance, once.
 *   The flowing order dots: a CSS keyframe loop.
 */
export function Hero() {
  const pinned = useStoryMode() === 'pinned'
  const root = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!pinned) return
      const q = gsap.utils.selector(root)
      const card = q('[data-hero-card]')[0]
      const inset = () => insetFor(window.innerWidth, window.innerHeight)

      // Entrance: the title rises out of its masks, then the rest settles in.
      gsap.fromTo(q('h1 [data-word]'), { yPercent: 110 }, { yPercent: 0, duration: 1.25, stagger: 0.08, ease: 'power4.out', delay: 0.15 })
      gsap.fromTo(q('[data-intro]'), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.55 })
      gsap.fromTo(q('[data-hero-flow]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: 'power2.out', delay: 0.9 })

      // The camera move. Long scrub smoothing, eased segments, nothing linear.
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 1.1, invalidateOnRefresh: true },
      })
      tl.fromTo(card, { clipPath: inset }, { clipPath: FULL, duration: 0.55, ease: 'power3.inOut' }, 0)
        .to(q('[data-hero-scene]'), { scale: 1.16, duration: 0.5, ease: 'power2.in' }, 0)
        .to(q('[data-hero-flow]'), { scale: 1.7, y: 70, autoAlpha: 0, duration: 0.46, ease: 'power2.in' }, 0)
      // Parallax: each layer drifts at its own depth, the nearest fastest, and fades as it passes.
      // All of them are gone by 0.37, before the story starts to show through at 0.42.
      q('[data-depth]').forEach((el, i) => {
        tl.to(el, { y: Number(el.dataset.depth), autoAlpha: 0, duration: 0.27, ease: 'power2.in' }, 0.02 + i * 0.025)
      })
      tl.to(q('[data-hero-wash]'), { autoAlpha: 1, duration: 0.18, ease: 'power1.inOut' }, 0.38)
        .to(q('[data-hero-frame]'), { autoAlpha: 0, duration: 0.22, ease: 'power1.inOut' }, 0.42)
        .to({}, { duration: 0.36 }, 0.64)

      // Pointer parallax: the words and the picture lean gently toward the pointer, at two depths.
      let off = () => {}
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const near = q('[data-hero-pointer]')[0]
        const far = q('[data-hero-pointer-flow]')[0]
        const nx = gsap.quickTo(near, 'x', { duration: 1.4, ease: 'power3.out' })
        const ny = gsap.quickTo(near, 'y', { duration: 1.4, ease: 'power3.out' })
        const fx = gsap.quickTo(far, 'x', { duration: 1.8, ease: 'power3.out' })
        const fy = gsap.quickTo(far, 'y', { duration: 1.8, ease: 'power3.out' })
        const move = (e: PointerEvent) => {
          if (window.scrollY > window.innerHeight) return
          const dx = e.clientX / window.innerWidth - 0.5
          const dy = e.clientY / window.innerHeight - 0.5
          nx(dx * -14)
          ny(dy * -10)
          fx(dx * 26)
          fy(dy * 18)
        }
        window.addEventListener('pointermove', move, { passive: true })
        off = () => window.removeEventListener('pointermove', move)
      }
      return () => {
        off()
        tl.scrollTrigger?.kill()
      }
    },
    { scope: root, dependencies: [pinned] },
  )

  const begin = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Land on the first chapter's resting point, so the scroll magnet has nothing left to do.
    const track = document.querySelector<HTMLElement>('[data-story-track]')
    const target =
      pinned && track ? track.getBoundingClientRect().top + window.scrollY + beatRest(0) * (track.offsetHeight - window.innerHeight) : '#story'
    if (reduce) {
      if (typeof target === 'number') window.scrollTo(0, target)
      else document.querySelector(target)?.scrollIntoView()
      return
    }
    stopMagnet()
    gsap.to(window, { scrollTo: { y: target, autoKill: true }, duration: pinned ? 2.8 : 1, ease: 'power2.inOut', overwrite: true })
  }

  const initialInset = typeof window === 'undefined' ? FULL : insetFor(window.innerWidth, window.innerHeight)

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className={cn('relative', pinned ? 'pointer-events-none z-10' : 'h-svh min-h-[560px]')}
      style={pinned ? { height: `${HERO_HEIGHT_SVH}svh` } : undefined}
    >
      <div data-hero-frame className={cn('pointer-events-auto top-0 h-svh min-h-[560px] overflow-hidden', pinned && 'sticky')} style={{ backgroundColor: FIRST_ROOM }}>
        <div
          data-hero-card
          className="absolute inset-0 overflow-hidden text-paper"
          style={{ clipPath: initialInset, background: 'radial-gradient(120% 90% at 85% 0%, #4d7a6b 0%, #2f5348 45%, #1f3a32 100%)' }}
        >
          <div data-hero-scene className="absolute inset-0 origin-[30%_70%]">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(45% 50% at 12% 88%, rgba(210,196,158,0.32), transparent 70%), radial-gradient(40% 45% at 92% 18%, rgba(200,222,211,0.28), transparent 70%)',
              }}
            />
            <div className="grain pointer-events-none absolute inset-0" />

            <div data-hero-pointer-flow aria-hidden="true" className="absolute inset-0">
              <Flow />
            </div>

            <div data-hero-pointer className="absolute inset-0">
              <div className="flex h-full flex-col justify-end gap-6 px-[clamp(56px,10vw,184px)] pb-[clamp(72px,15svh,160px)] pt-28">
                <div data-depth="-260">
                  <p data-intro className="glass glass-dark inline-flex w-fit items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold text-paper">
                    <span aria-hidden="true" className="size-2 rounded-full bg-sand" />A three-minute story about a coffee line
                  </p>
                </div>
                <div data-depth="-170">
                  <RevealText as="h1" id="hero-title" text="Where the waiting goes" accent="waiting" className="display max-w-[11ch] text-[clamp(3.2rem,8.2vw,8.4rem)] leading-[0.9]" />
                </div>
                <div data-depth="-100">
                  <p data-intro className="max-w-[40ch] text-pretty text-[clamp(1.05rem,1.5vw,1.3rem)] leading-relaxed text-[#d9e6df]">
                    Speed up one step of a busy café and your coffee can still arrive no sooner. Follow one order through the morning rush to find out why.
                  </p>
                </div>
                <div data-depth="-50">
                  <div data-intro className="flex flex-wrap items-center gap-5">
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
              </div>
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
 * middle one. Decorative; the words say the same thing. Sits in the upper right, clear of the title.
 */
function Flow() {
  const stops = [0.16, 0.5, 0.84]
  return (
    <div data-hero-flow className="pointer-events-none absolute right-[clamp(56px,9vw,170px)] top-[24%] h-24 w-[min(38vw,620px)] origin-center max-wide:hidden">
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
      <div className="absolute inset-x-0 top-1/2 h-0">
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
