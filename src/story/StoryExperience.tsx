import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { MODEL_LABEL, beats, plain } from './storyBeats'
import { RichText } from './RichText'
import { frameFor, traceShare } from './frames'
import { RevealText } from './RevealText'
import { StoryStage } from './StoryStage'
import { BEAT_THEMES, GLOW_BACKGROUND, RUSH_FROM, RUSH_TO } from './theme'
import { BEAT_COUNT, RUSH_STEPS, TOTAL_WEIGHT, beatStart, locate, rushStepIndex, travelPosition } from './timeline'

/**
 * The pinned, scroll-driven story (screens at least 900px wide, motion allowed).
 *
 * A tall track holds a sticky full-height room. Scroll position maps to a beat (timeline.ts,
 * pure and tested). One stage stays on screen the whole way: the same three tiles at the same
 * size. Each beat changes one thing on it (frames.ts), and the track under it says that one
 * thing in words. React state changes only when the beat, rush step or traced stop changes.
 *
 * Motion ownership (one writer per element):
 *   [data-bg], [data-glow], [data-fg-target], [data-rings]: GSAP (theme tweens; the rush sets bg directly)
 *   [data-ring-a], [data-ring-b]: GSAP set from scroll progress (parallax)
 *   [data-text] groups and their [data-word] / [data-support]: GSAP (reveal timeline)
 *   [data-stage-area]: GSAP (its top, below the headline; its entrance)
 *   [data-trace-x]: GSAP set from scroll progress (the traced order)
 *   Tiles: CSS transitions only (StationTile, StoryStage)
 *   Chapter rail indicator: CSS transition
 */

const GUTTER = 'clamp(32px, 7vw, 120px)'
const BEAT_LABELS = ['A familiar moment', 'One order, three stops', 'The rush', 'The obvious fix', 'The surprise', 'The reveal', 'And pickup?', 'Your turn']

type Step = { beat: number; rush: number; stop: number }
const START: Step = { beat: 0, rush: 0, stop: 0 }

/**
 * Keeps the stage clear of every headline. It sits below the tallest text group, not the one
 * showing, so its top (and therefore the tiles' size) is the same on every beat: the tiles never
 * grow and shrink as the story moves on.
 */
function positionStage(root: HTMLElement | null) {
  const area = root?.querySelector<HTMLElement>('[data-stage-area]')
  const groups = root ? [...root.querySelectorAll<HTMLElement>('[data-text]')] : []
  if (!area || !groups.length) return
  const bottom = Math.max(...groups.map((g) => g.offsetTop + g.offsetHeight))
  const gap = Math.max(28, Math.round(window.innerHeight * 0.035))
  gsap.set(area, { top: bottom + gap })
}

export function StoryExperience() {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>(START)
  // The chapter rail belongs to the pinned story only: hide it once the story has scrolled away.
  const [onStage, setOnStage] = useState(false)
  const live = useRef({ step: START, prevBeat: -1, position: 0 })

  const scrollToBeat = useCallback((beat: number) => {
    const el = track.current
    if (!el) return
    const scrollable = el.offsetHeight - window.innerHeight
    const top = el.getBoundingClientRect().top + window.scrollY + beatStart(beat) * scrollable + 2
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  // Scroll position -> state, the traced order and parallax.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const ringA = q('[data-ring-a]')[0]
      const ringB = q('[data-ring-b]')[0]
      const bg = q('[data-bg]')[0]
      const setRingA = gsap.quickSetter(ringA, 'y', 'px')
      const setRingB = gsap.quickSetter(ringB, 'y', 'px')

      const apply = (progress: number) => {
        const { beat, local } = locate(progress)
        const rushIdx = beat === 2 ? rushStepIndex(local) : beat > 2 ? RUSH_STEPS.length - 1 : 0
        const position = beat === 1 ? travelPosition(local) : beat > 1 ? 2 : 0
        live.current.position = position
        const stop = Math.round(position)
        const prev = live.current.step
        if (prev.beat !== beat || prev.rush !== rushIdx || prev.stop !== stop) {
          live.current.step = { beat, rush: rushIdx, stop }
          setStep({ beat, rush: rushIdx, stop })
        }
        // The traced order glides with the scroll, between the stops it pauses at.
        const dot = q('[data-trace-x]')[0]
        if (dot) gsap.set(dot, { xPercent: traceShare(position) * 100 })
        setRingA(-progress * 260)
        setRingB(progress * 180)
        // Pressure: during the rush the room warms from stone toward sand as the clock runs.
        if (beat === 2) {
          const t = rushIdx / (RUSH_STEPS.length - 1)
          gsap.set(bg, { backgroundColor: gsap.utils.interpolate(RUSH_FROM.bg, RUSH_TO.bg, t) })
        }
      }

      const st = ScrollTrigger.create({
        trigger: track.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      })
      const stageTrigger = ScrollTrigger.create({
        trigger: track.current,
        start: 'top 10%',
        end: 'bottom 40%',
        onToggle: (self) => setOnStage(self.isActive),
      })
      // The first chapter is pinned under the hero. Its headline rises when the hero has dissolved.
      const arrive = ScrollTrigger.create({
        trigger: track.current,
        // The story is pulled 228svh up under the hero (320svh tall), so it is pinned just before the
        // hero starts to dissolve (at 0.42 of the hero timeline).
        start: 'top top',
        onLeaveBack: () => {
          if (live.current.step.beat !== 0) return
          gsap.set(q('[data-text="0"]'), { autoAlpha: 0 })
          gsap.set(q('[data-text="0"] [data-word]'), { yPercent: 120 })
          gsap.set(q('[data-text="0"] [data-support]'), { autoAlpha: 0 })
        },
        onEnter: () => {
          if (live.current.step.beat !== 0) return
          gsap.set(q('[data-text="0"]'), { autoAlpha: 1 })
          gsap.fromTo(q('[data-text="0"] [data-word]'), { yPercent: 120 }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: 'power4.out', overwrite: 'auto' })
          gsap.fromTo(q('[data-text="0"] [data-support]'), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: 0.4, ease: 'power3.out', overwrite: 'auto' })
        },
      })
      const relayout = () => positionStage(root.current)
      const observer = new ResizeObserver(relayout)
      q('[data-text]').forEach((g) => observer.observe(g))
      window.addEventListener('resize', relayout)
      document.fonts?.addEventListener('loadingdone', relayout)
      document.fonts?.ready.then(() => {
        relayout()
        ScrollTrigger.refresh()
      })
      return () => {
        observer.disconnect()
        window.removeEventListener('resize', relayout)
        document.fonts?.removeEventListener('loadingdone', relayout)
        st.kill()
        stageTrigger.kill()
        arrive.kill()
      }
    },
    { scope: root },
  )

  // Beat change -> headline reveal and room tone. Time-based, so a fast scroll snaps to the right state.
  useGSAP(
    () => {
      const { beat } = step
      const prev = live.current.prevBeat
      if (prev === beat) return
      live.current.prevBeat = beat
      const dir = prev < 0 ? 1 : Math.sign(beat - prev)
      const q = gsap.utils.selector(root)
      const group = (i: number) => q(`[data-text="${i}"]`)[0] as HTMLElement
      const words = (i: number) => q(`[data-text="${i}"] [data-word]`)
      const support = (i: number) => q(`[data-text="${i}"] [data-support]`)
      const theme = BEAT_THEMES[beat]

      gsap.killTweensOf(['[data-text]', '[data-word]', '[data-support]', '[data-bg]', '[data-glow]', '[data-fg-target]', '[data-rings]'])

      const colorDur = prev < 0 ? 0 : 0.9
      if (beat !== 2) gsap.to(q('[data-bg]'), { backgroundColor: theme.bg, duration: colorDur, ease: 'power2.inOut' })
      gsap.to(q('[data-glow]'), { '--glow-a': theme.glowA, '--glow-b': theme.glowB, duration: colorDur, ease: 'power2.inOut' })
      gsap.to(q('[data-fg-target]'), { color: theme.fg, duration: colorDur, ease: 'power2.inOut' })
      gsap.to(q('[data-rings]'), { color: theme.ring, duration: colorDur, ease: 'power2.inOut' })
      gsap.to(q('[data-support]'), { color: theme.fg2, duration: colorDur })

      for (let i = 0; i < BEAT_COUNT; i++) if (i !== beat) gsap.set(group(i), { autoAlpha: 0 })
      if (prev >= 0 && prev !== beat) {
        gsap.set(group(prev), { autoAlpha: 1 })
        gsap.to(words(prev), { yPercent: -115 * dir, duration: 0.3, stagger: 0.01, ease: 'power2.in' })
        gsap.set(group(prev), { autoAlpha: 0, delay: 0.36 })
      }
      gsap.set(group(beat), { autoAlpha: 1 })
      positionStage(root.current)
      // The very first chapter waits under the hero; its own trigger reveals it.
      if (prev < 0 && beat === 0) {
        gsap.set(group(0), { autoAlpha: 0 })
        gsap.set(words(0), { yPercent: 120 })
        gsap.set(support(0), { autoAlpha: 0 })
        return
      }
      gsap.fromTo(words(beat), { yPercent: 120 * dir }, { yPercent: 0, duration: 0.9, stagger: 0.05, ease: 'power4.out', delay: prev < 0 ? 0.1 : 0.22 })
      gsap.fromTo(support(beat), { autoAlpha: 0, y: 14 * dir }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: prev < 0 ? 0.5 : 0.6 })
    },
    { scope: root, dependencies: [step.beat], revertOnUpdate: false },
  )

  // The traced order's dot only exists once the track for its chapter has rendered. Place it as
  // soon as it appears, so landing on the chapter in one jump does not leave it at the start.
  useLayoutEffect(() => {
    const dot = root.current?.querySelector('[data-trace-x]')
    if (dot) gsap.set(dot, { xPercent: traceShare(live.current.position) * 100 })
  }, [step.beat])

  const { beat } = step
  const frame = useMemo(() => frameFor(beat, { stop: step.stop, rush: RUSH_STEPS[step.rush] }), [beat, step.stop, step.rush])
  const theme0 = BEAT_THEMES[0]

  return (
    <div ref={root} id="story" className="relative -mt-[228svh]">
      {/* The story as plain, ordered text for assistive technology. The pinned stage is decorative. */}
      <div className="sr-only">
        {beats.map((b) => (
          <section key={b.id}>
            <h2>{b.headline}</h2>
            {b.support ? <p>{plain(b.support)}</p> : null}
            <p>{b.stageDescription}</p>
          </section>
        ))}
        <p>{MODEL_LABEL}. Not a forecast for a real café.</p>
      </div>

      <div ref={track} className="relative" style={{ height: `${TOTAL_WEIGHT * 100}svh` }}>
        <div aria-hidden="true" className="sticky top-0 isolate h-svh overflow-hidden">
          <div data-bg className="absolute inset-0" style={{ backgroundColor: theme0.bg }} />
          <div
            data-glow
            className="absolute inset-0"
            style={{ background: GLOW_BACKGROUND, ['--glow-a' as string]: theme0.glowA, ['--glow-b' as string]: theme0.glowB }}
          />
          <Rings color={theme0.ring} />
          <div className="grain pointer-events-none absolute inset-0" />

          <div data-fg-target className="absolute inset-0" style={{ color: theme0.fg }}>
            <TextGroups />
            <div data-stage-area className="absolute inset-x-0 bottom-[5svh]" style={{ top: '34svh' }}>
              <Fit>
                <StoryStage frame={frame} />
              </Fit>
            </div>
          </div>
        </div>

        <ChapterRail beat={beat} visible={onStage} onPick={scrollToBeat} />
      </div>
    </div>
  )
}

/**
 * Chapter dots in a glass capsule. A single liquid indicator slides to the current chapter and
 * stretches into a pill; hovering a dot shows its name.
 */
function ChapterRail({ beat, visible, onPick }: { beat: number; visible: boolean; onPick: (beat: number) => void }) {
  const STEP = 36
  return (
    <nav
      aria-label="Story chapters"
      inert={!visible}
      className={cn(
        'glass fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col rounded-full p-1.5 text-ink transition-opacity duration-300 ease-[var(--ease-out)] wide:flex',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1.5 size-9 -translate-x-1/2 transition-transform duration-500 ease-[var(--ease-out)] motion-reduce:transition-none"
        style={{ transform: `translateY(${beat * STEP}px)` }}
      >
        <span className="absolute left-1/2 top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest" />
      </span>
      {BEAT_LABELS.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(i)}
          aria-label={label}
          aria-current={i === beat ? 'step' : undefined}
          className="group relative grid size-9 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 rounded-full bg-ink/40 transition-[scale,opacity] duration-200 ease-[var(--ease-out)] group-hover:scale-150',
              i === beat && 'opacity-0',
            )}
          />
          <span
            aria-hidden="true"
            className="glass pointer-events-none absolute right-11 origin-right scale-95 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold text-ink opacity-0 transition-[opacity,scale] duration-150 ease-[var(--ease-out)] group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  )
}

/** All seven headline groups, stacked and left-aligned. One is visible at a time. */
const TextGroups = memo(function TextGroups() {
  return (
    <>
      {beats.map((b, i) => (
        <div
          key={b.id}
          data-text={i}
          style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden', left: GUTTER, right: GUTTER }}
          // Headline on the left, its description beside it, aligned to the last line: the text block
          // stays short, which leaves the stage more room.
          className="absolute top-[clamp(84px,12svh,128px)] grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-end gap-x-[clamp(32px,5vw,96px)]"
        >
          <RevealText
            as="p"
            text={b.headline}
            accent={b.accent}
            className="display max-w-[16ch] text-balance text-[clamp(2rem,min(4.4vw,7.6svh),4.8rem)] leading-[0.98]"
          />
          {b.support ? (
            <p data-support className="max-w-[46ch] pb-[0.35em] text-pretty text-[clamp(0.98rem,2.1svh,1.15rem)] leading-relaxed" style={{ color: BEAT_THEMES[0].fg2 }}>
              <RichText text={b.support} />
            </p>
          ) : null}
        </div>
      ))}
    </>
  )
})

/** Concentric coffee-cup stains. They drift against the scroll for depth. */
const Rings = memo(function Rings({ color }: { color: string }) {
  const ring = (cls: string, attr: string) => (
    <svg {...{ [attr]: '' }} viewBox="-340 -340 680 680" className={cn('absolute will-change-transform', cls)} fill="none" stroke="currentColor" aria-hidden="true">
      <circle r="330" strokeWidth="3" opacity="0.1" />
      <circle r="300" strokeWidth="14" opacity="0.05" />
      <circle r="236" strokeWidth="2" opacity="0.08" />
      <path d="M-330 0A330 330 0 0 1 -60 -324" strokeWidth="9" opacity="0.1" strokeLinecap="round" />
    </svg>
  )
  return (
    <div data-rings className="pointer-events-none absolute inset-0 overflow-hidden" style={{ color }}>
      {ring('-right-[14vw] -top-[26svh] w-[62vw] max-w-[920px]', 'data-ring-a')}
      {ring('-bottom-[34svh] -left-[16vw] w-[54vw] max-w-[820px]', 'data-ring-b')}
    </div>
  )
})

/**
 * Fits the stage into the room it has. On short laptop windows the stage is scaled down so
 * nothing is clipped. The scale lives on an inner wrapper.
 */
function Fit({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const fit = () => {
      const scale = Math.min(1, (o.clientHeight - 16) / i.offsetHeight)
      i.style.transform = scale < 1 ? `scale(${scale.toFixed(3)})` : ''
    }
    const ro = new ResizeObserver(fit)
    ro.observe(o)
    ro.observe(i)
    fit()
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={outer} className="absolute inset-0 flex items-end justify-center" style={{ paddingInline: GUTTER }}>
      <div ref={inner} className="flex w-full max-w-[1180px] origin-bottom justify-center">
        {children}
      </div>
    </div>
  )
}
