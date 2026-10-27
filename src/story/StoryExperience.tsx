import { memo, useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { CoffeeStage } from '@/components/CoffeeStage'
import type { TrailState } from '@/components/StationCard'
import { HairlineFigure } from '@/illustrations/hairline/HairlineFigure'
import { mountRegister } from '@/illustrations/hairline/registerFigure'
import { IsoCylinder, IsoFigure } from '@/illustrations/iso'
import type { Origin } from '@/illustrations/iso-math'
import { Worker } from '@/illustrations/Worker'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import type { StationId } from '@/simulation/config'
import { MODEL_LABEL, SAME_RUSH_LABEL, beats } from './storyBeats'
import { RevealText } from './RevealText'
import { baselineAtClose, cashierAtClose } from './storySnapshots'
import { BEAT_THEMES, RUSH_FROM, RUSH_TO } from './theme'
import { BEAT_COUNT, RUSH_STEPS, TOTAL_WEIGHT, beatStart, locate, rushStepIndex, travelPosition } from './timeline'

/**
 * The pinned, scroll-driven story (wide screens, motion allowed).
 *
 * A tall track holds a sticky full-height room. Scroll position maps to a beat (timeline.ts,
 * pure and tested); inside the rush and the traced-order beats it maps to a finer position.
 * React state changes only when the beat, rush step or traced stop changes, never per scroll
 * pixel. Every number on screen comes from the simulation engine.
 *
 * The room's color is the narrative: calm butter, tomato as the queue builds (its background
 * follows the rush clock), cobalt for the fix, espresso for the reveal.
 *
 * Motion ownership (one writer per element):
 *   [data-bg], [data-counter], [data-fg-target]: GSAP (theme tweens; the rush sets them directly)
 *   [data-ring-a], [data-ring-b]: GSAP set from scroll progress (parallax)
 *   [data-text] groups and their [data-word] / [data-support]: GSAP (reveal timeline)
 *   [data-scene] layers and [data-card] wrappers: GSAP (enter, arc)
 *   [data-row2], [data-bench], .travel-dot: GSAP
 *   Tickets (the article inside each wrapper): CSS tilt and lift on pointer only
 *   Hairline figures: their own spring loop, inside their svg only
 */

type Scene = 'opening' | 'process' | 'compare'
const SCENE_OF_BEAT: readonly Scene[] = ['opening', 'process', 'process', 'compare', 'compare', 'process', 'process']
const STAGE_IDS: readonly StationId[] = ['order', 'drinks', 'pickup']
const GUTTER = 'clamp(24px, 6vw, 104px)'

type Step = { beat: number; rush: number; stop: number }
const START: Step = { beat: 0, rush: 0, stop: 0 }

const BEAT_LABELS = ['A familiar moment', 'One order, three stops', 'The rush', 'The obvious fix', 'The surprise', 'The reveal', 'Your turn']
const ARC = [
  { rotationY: 4, y: 12 },
  { rotationY: 0, y: 0 },
  { rotationY: -4, y: 12 },
]

const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
const idleRegister = { queue: 0, inService: 0 }
const cupOrigin: Origin = { ox: 40, oy: 56 }

export function StoryExperience() {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>(START)
  const [rewind, setRewind] = useState(30)
  const live = useRef({ step: START, prevBeat: -1, local: 0 })

  const scrollToBeat = useCallback((beat: number) => {
    const el = track.current
    if (!el) return
    const scrollable = el.offsetHeight - window.innerHeight
    const top = el.getBoundingClientRect().top + window.scrollY + beatStart(beat) * scrollable + 2
    window.scrollTo({ top, behavior: 'smooth' })
  }, [])

  // Scroll position -> state and parallax. React state changes only when something visible does.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const dot = q('.travel-dot')[0] as HTMLElement | undefined
      const ringA = q('[data-ring-a]')[0]
      const ringB = q('[data-ring-b]')[0]
      const bg = q('[data-bg]')[0]
      const counter = q('[data-counter]')[0]
      const setRingA = gsap.quickSetter(ringA, 'y', 'px')
      const setRingB = gsap.quickSetter(ringB, 'y', 'px')
      const setRotA = gsap.quickSetter(ringA, 'rotation', 'deg')
      const setRotB = gsap.quickSetter(ringB, 'rotation', 'deg')

      const place = (local: number) => {
        const area = q('[data-stage-area]')[0] as HTMLElement | undefined
        const rows = q('[data-scene="process"] [data-worker-row]')
        if (!dot || !area || rows.length < 3) return
        const s = area.getBoundingClientRect()
        const pts = rows.map((r) => {
          const b = r.getBoundingClientRect()
          return { x: b.left - s.left + b.width * 0.5, y: b.top - s.top + b.height * 0.5 }
        })
        const pos = travelPosition(local)
        const i = Math.min(1, Math.floor(pos))
        const f = pos - i
        gsap.set(dot, { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f - 12, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f - 12 })
      }

      const apply = (progress: number) => {
        const { beat, local } = locate(progress)
        const rushIdx = beat === 2 ? rushStepIndex(local) : beat > 2 ? RUSH_STEPS.length - 1 : 0
        const stop = beat === 1 ? Math.round(travelPosition(local)) : beat > 1 ? 2 : 0
        live.current.local = local
        const prev = live.current.step
        if (prev.beat !== beat || prev.rush !== rushIdx || prev.stop !== stop) {
          live.current.step = { beat, rush: rushIdx, stop }
          setStep({ beat, rush: rushIdx, stop })
        }
        // Depth: the coffee rings drift at different speeds as you scroll.
        setRingA(-progress * 320)
        setRingB(progress * 220)
        setRotA(progress * 50)
        setRotB(-progress * 36)
        // Pressure: during the rush the whole room warms toward tomato as the clock runs.
        if (beat === 2) {
          const t = rushIdx / (RUSH_STEPS.length - 1)
          gsap.set(bg, { backgroundColor: gsap.utils.interpolate(RUSH_FROM.bg, RUSH_TO.bg, t) })
          gsap.set(counter, { backgroundColor: gsap.utils.interpolate(RUSH_FROM.counter, RUSH_TO.counter, t) })
        }
      }

      // The scene is still easing into place for a moment after a beat change, so the traced dot
      // follows the tickets' real position every frame while it is on screen.
      const follow = () => {
        if (live.current.step.beat === 1) place(live.current.local)
      }
      gsap.ticker.add(follow)

      const st = ScrollTrigger.create({
        trigger: track.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      })
      document.fonts?.ready.then(() => ScrollTrigger.refresh())
      return () => {
        gsap.ticker.remove(follow)
        st.kill()
      }
    },
    { scope: root },
  )

  // Beat change -> reveal and theme timeline. Time-based, so a fast scroll just snaps to the right state.
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
      const scene = (s: Scene) => q(`[data-scene="${s}"]`)[0] as HTMLElement
      const theme = BEAT_THEMES[beat]
      const prevScene = prev >= 0 ? SCENE_OF_BEAT[prev] : null
      const active = SCENE_OF_BEAT[beat]

      gsap.killTweensOf(['[data-text]', '[data-word]', '[data-support]', '[data-scene]', '[data-card]', '[data-cue]', '[data-bench]', '[data-row2]', '[data-bg]', '[data-counter]', '[data-fg-target]', '[data-rings]'])

      // Room: color is the narrative. The rush sets its own background from the clock.
      const colorDur = prev < 0 ? 0 : 0.9
      if (beat !== 2) {
        gsap.to(q('[data-bg]'), { backgroundColor: theme.bg, duration: colorDur, ease: 'power2.inOut' })
        gsap.to(q('[data-counter]'), { backgroundColor: theme.counter, duration: colorDur, ease: 'power2.inOut' })
      }
      gsap.to(q('[data-fg-target]'), { color: theme.fg, duration: colorDur, ease: 'power2.inOut' })
      gsap.to(q('[data-rings]'), { color: theme.ring, duration: colorDur, ease: 'power2.inOut' })
      gsap.to(q('[data-support]'), { color: theme.fg2, duration: colorDur })

      // Text: everything off except the arriving beat, which reveals word by word.
      for (let i = 0; i < BEAT_COUNT; i++) if (i !== beat) gsap.set(group(i), { autoAlpha: 0 })
      if (prev >= 0 && prev !== beat) {
        gsap.set(group(prev), { autoAlpha: 1 })
        gsap.to(words(prev), { yPercent: -115 * dir, duration: 0.34, stagger: 0.012, ease: 'power2.in' })
        gsap.set(group(prev), { autoAlpha: 0, delay: 0.42 })
      }
      gsap.set(group(beat), { autoAlpha: 1 })
      gsap.fromTo(words(beat), { yPercent: 120 * dir }, { yPercent: 0, duration: 0.95, stagger: 0.06, ease: 'power4.out', delay: prev < 0 ? 0.15 : 0.26 })
      gsap.fromTo(support(beat), { autoAlpha: 0, y: 18 * dir }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: prev < 0 ? 0.7 : 0.8 })

      // Scenes: the outgoing one fades; an incoming one pushes its tickets up over the counter.
      ;(['opening', 'process', 'compare'] as const).forEach((s) => {
        if (s !== active) gsap.to(scene(s), { autoAlpha: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' })
      })
      gsap.set(scene(active), { y: 0 })
      gsap.to(scene(active), { autoAlpha: 1, duration: 0.35, ease: 'power2.out', delay: prev < 0 ? 0.2 : 0.15, overwrite: 'auto' })
      if (active !== prevScene && active !== 'opening') {
        const targets = active === 'process' ? q('[data-scene="process"] [data-card]') : q('[data-scene="compare"] [data-row]')
        const to = (i: number) => (active === 'process' ? { y: ARC[i].y, rotation: 0 } : { y: 0, rotation: 0 })
        targets.forEach((el, i) => {
          gsap.fromTo(
            el,
            { y: 130, rotation: (i - 1) * 3, autoAlpha: 0 },
            { ...to(i), autoAlpha: 1, duration: 1, ease: 'power4.out', delay: 0.2 + i * 0.1, overwrite: 'auto' },
          )
        })
      }

      // Opening cue (scroll hint and skip link) shows only on the first beat.
      gsap.to(q('[data-cue]'), { autoAlpha: beat === 0 ? 1 : 0, duration: 0.4 })

      // Beat 4: the same rush replayed with an extra cashier, shown explicitly.
      const row2 = q('[data-row2]')
      if (beat === 3 && prev === 2) {
        gsap.set(row2, { autoAlpha: 0, y: 50 })
        gsap.to(row2, { autoAlpha: 1, y: 0, duration: 1, ease: 'power4.out', delay: 1 })
        gsap.fromTo(q('[data-replay-icon]'), { rotation: 0 }, { rotation: -360, duration: 1.1, ease: 'power2.inOut', delay: 1 })
      } else {
        gsap.set(row2, { autoAlpha: beat >= 3 && beat <= 4 ? 1 : 0, y: 0 })
      }

      // The traced order is on screen only during beat 2.
      gsap.to(q('.travel-dot'), { autoAlpha: beat === 1 ? 1 : 0, duration: 0.35 })

      // Beat 7: the extra worker steps onto the bench and the clock rewinds to the start.
      gsap.to(q('[data-bench]'), {
        autoAlpha: beat === 6 ? 1 : 0,
        width: beat === 6 ? 'var(--bench-w)' : 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: beat === 6 ? 0.5 : 0,
      })
      if (beat === 6) {
        const proxy = { v: RUSH_STEPS.length - 1 }
        gsap.to(proxy, { v: 0, duration: 1.7, delay: 0.7, ease: 'power2.inOut', onUpdate: () => setRewind(Math.round(proxy.v)) })
      } else {
        setRewind(RUSH_STEPS.length - 1)
      }
    },
    { scope: root, dependencies: [step.beat], revertOnUpdate: false },
  )

  // Arc: the process tickets lean in a little. GSAP owns the card wrappers.
  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-scene="process"] [data-card]')
      cards.forEach((el, i) => gsap.set(el, { transformPerspective: 1400, rotationY: ARC[i].rotationY, y: ARC[i].y }))
    },
    { scope: root },
  )

  const { beat } = step
  const processSnapshot = beat === 5 ? cashierAtClose : RUSH_STEPS[beat === 6 ? rewind : beat === 2 ? step.rush : 0]
  const trail = Object.fromEntries(
    STAGE_IDS.map((id, i): [StationId, TrailState] => [id, i < step.stop ? 'past' : i === step.stop ? 'now' : 'next']),
  ) as Record<StationId, TrailState>
  const theme0 = BEAT_THEMES[0]

  return (
    <div ref={root}>
      <a
        href="#experiment"
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-control bg-paper px-4 py-2 text-sm font-semibold text-cobalt shadow-lg outline-none focus-visible:translate-y-0 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Skip to experiment
      </a>

      {/* The story as plain, ordered text for assistive technology. The pinned stage is decorative. */}
      <div className="sr-only">
        {beats.map((b, i) => (
          <section key={b.id}>
            {i === 0 ? <h1>{b.headline}</h1> : <h2>{b.headline}</h2>}
            {b.support ? <p>{b.support}</p> : null}
            <p>{b.stageDescription}</p>
          </section>
        ))}
        <p>{MODEL_LABEL}. Not a forecast for a real café.</p>
      </div>

      <div ref={track} className="relative" style={{ height: `${TOTAL_WEIGHT * 100}svh` }}>
        <span id="experiment" aria-hidden="true" className="absolute left-0" style={{ top: `${beatStart(6) * 100}%` }} />

        <div aria-hidden="true" className="sticky top-0 isolate h-svh overflow-hidden">
          {/* The room: colored by the story, with coffee-ring stains, grain and a counter. */}
          <div data-bg className="absolute inset-0" style={{ backgroundColor: theme0.bg }} />
          <Rings color={theme0.ring} />
          <div className="grain pointer-events-none absolute inset-0" />
          <div
            data-counter
            className="absolute inset-x-0 bottom-0 h-[16svh] border-t-[3px] border-white/30"
            style={{ backgroundColor: theme0.counter, boxShadow: '0 -18px 30px -12px rgb(29 18 13 / 0.25)' }}
          />

          <div data-fg-target className="absolute inset-0" style={{ color: theme0.fg }}>
            <TextGroups />

            <div data-stage-area className="absolute inset-x-0 bottom-[2.5svh] top-[33svh]" style={{ paddingInline: GUTTER }}>
              <Layer scene="opening" visible>
                <OpeningScene />
              </Layer>

              <Layer scene="process">
                <div className="flex w-full items-end gap-4">
                  <div className="min-w-0 flex-1">
                    <CoffeeStage
                      snapshot={processSnapshot}
                      detail={beat === 1 ? 'named' : beat === 2 ? 'counts' : 'full'}
                      trail={beat === 1 ? trail : undefined}
                      trailMarker={false}
                      extraAt={beat === 5 ? 'order' : undefined}
                      emphasis={beat === 5 ? { station: 'drinks', kind: 'both' } : undefined}
                      showTotals={beat === 2}
                    />
                  </div>
                  <div
                    data-bench
                    style={{ ['--bench-w' as string]: '9.5rem', width: 0, opacity: 0, visibility: 'hidden' }}
                    className="flex shrink-0 flex-col items-center gap-3 self-center overflow-hidden rounded-card border-2 border-dashed border-current/50 py-8"
                  >
                    <Worker variant="extra" label="Extra worker, on the bench" className="h-16 text-current" />
                    <p className="whitespace-nowrap px-4 text-sm font-semibold">Extra worker</p>
                  </div>
                </div>
              </Layer>

              <Layer scene="compare">
                <CompareScene phase={beat === 4 ? 'surprise' : 'fix'} />
              </Layer>

              <span
                aria-hidden="true"
                style={{ opacity: 0, visibility: 'hidden' }}
                className="travel-dot pointer-events-none absolute left-0 top-0 z-10 size-6 rounded-full border-[3px] border-paper bg-cobalt shadow-[0_0_0_8px_rgb(43_63_224/0.28)]"
              />
            </div>

            {/* The rush clock is the hero of the rush and of the rewind. */}
            {beat === 2 || beat === 6 ? (
              <div
                data-clock
                className="absolute top-[5.5svh] flex animate-in flex-col items-end fade-in-0 slide-in-from-right-4 duration-500 motion-reduce:animate-none"
                style={{ right: GUTTER }}
              >
                <span className="display text-[clamp(4.5rem,11vw,12rem)] leading-[0.82] tabular">{mmss(processSnapshot.timeSeconds)}</span>
                <span className="mt-2 text-lg font-medium tabular opacity-90">
                  {beat === 6 && rewind === 0 ? 'Start of the rush. Paused.' : 'Rush clock, of 10:00'}
                </span>
              </div>
            ) : null}

            <p className="absolute right-0 top-[2.2svh] text-right text-sm opacity-90" style={{ right: GUTTER }}>
              {MODEL_LABEL}. Not a forecast for a real café.
            </p>
          </div>
        </div>

        {/* Opening cue and chapter rail sit above the decorative pane so they stay reachable. */}
        <div
          data-cue
          data-fg-target
          className="pointer-events-none fixed bottom-[19svh] z-20 flex flex-col items-start gap-1"
          style={{ left: GUTTER, color: theme0.fg }}
        >
          <p className="text-lg font-medium">Scroll to follow one order</p>
          <a
            href="#experiment"
            className="pointer-events-auto -ml-3 rounded-control px-3 py-2 text-sm font-semibold underline underline-offset-4 outline-none transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Skip to experiment
          </a>
        </div>

        <nav aria-label="Story chapters" data-fg-target className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col lg:flex" style={{ color: theme0.fg }}>
          {BEAT_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => scrollToBeat(i)}
              aria-label={label}
              aria-current={i === beat ? 'step' : undefined}
              className="group relative grid h-9 w-9 place-items-center outline-none"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'size-2.5 rounded-full border-2 border-current transition-transform duration-200 group-hover:scale-150 group-focus-visible:scale-150 group-focus-visible:ring-3 group-focus-visible:ring-ring/50',
                  i === beat ? 'scale-125 bg-current' : 'bg-transparent opacity-60',
                )}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-9 whitespace-nowrap rounded-control bg-ink px-2.5 py-1 text-xs font-semibold text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
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
          className="absolute top-[clamp(28px,6.5svh,76px)] flex flex-col items-start gap-5"
        >
          <RevealText
            as="p"
            text={b.headline}
            className={cn(
              'display text-balance',
              i === 0
                ? 'max-w-[16ch] text-[clamp(3rem,8.2vw,9.4rem)] leading-[0.9]'
                : 'max-w-[18ch] text-[clamp(2.3rem,5.2vw,5.6rem)] leading-[0.94]',
            )}
          />
          {b.support ? (
            <p data-support className="max-w-[40ch] text-pretty text-lg font-medium sm:text-xl" style={{ color: BEAT_THEMES[0].fg2 }}>
              {b.support}
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
    <svg
      {...{ [attr]: '' }}
      viewBox="-340 -340 680 680"
      className={cn('absolute will-change-transform', cls)}
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <circle r="330" strokeWidth="3" opacity="0.14" />
      <circle r="300" strokeWidth="14" opacity="0.07" />
      <circle r="236" strokeWidth="2" opacity="0.12" />
      <circle r="150" strokeWidth="2" opacity="0.1" />
      <path d="M-330 0A330 330 0 0 1 -60 -324" strokeWidth="9" opacity="0.18" strokeLinecap="round" />
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
 * One scene layer. If a scene is taller than the room it has (short laptop windows), the
 * content is scaled down so nothing is clipped. The scale lives on an inner wrapper; the
 * layer itself belongs to GSAP's fades.
 */
function Layer({ scene, visible = false, children }: { scene: Scene; visible?: boolean; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const fit = () => {
      // 28px of slack leaves room for the arc offset and hover lift.
      const scale = Math.min(1, (o.clientHeight - 28) / i.offsetHeight)
      i.style.transform = scale < 1 ? `scale(${scale.toFixed(3)})` : ''
    }
    const ro = new ResizeObserver(fit)
    ro.observe(o)
    ro.observe(i)
    fit()
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={outer}
      data-scene={scene}
      style={{ opacity: visible ? 1 : 0, visibility: visible ? 'visible' : 'hidden', paddingInline: GUTTER }}
      className="absolute inset-0 flex items-end justify-center"
    >
      <div ref={inner} className="flex w-full origin-bottom items-end justify-center">
        {children}
      </div>
    </div>
  )
}

const OpeningScene = memo(function OpeningScene() {
  return (
    <div className="flex w-full items-end justify-end gap-5 pb-[1svh]">
      <div className="mb-[8svh] flex flex-col items-center gap-2">
        <span className="size-9 rounded-full border-[3px] border-paper bg-cobalt shadow-[0_0_0_10px_rgb(43_63_224/0.28)]" />
        <p className="text-base font-medium">Your order</p>
      </div>
      <svg aria-hidden="true" viewBox="0 0 80 12" className="mb-[13svh] w-20 shrink-0 opacity-80" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round">
        <path d="M2 6h76" />
      </svg>
      <HairlineFigure
        mount={mountRegister}
        state={idleRegister}
        label="A café counter with a cash register, a card reader and a receipt slot"
        className="w-[min(40vw,76svh)] shrink-0 -mb-[3svh]"
      />
      <IsoFigure label="A cup of coffee with a lid, steaming" viewBox="0 0 80 90" className="mb-[3svh] h-auto w-[7vw] max-w-28 shrink-0 text-ink">
        <IsoCylinder origin={cupOrigin} x={0} y={0} z={0} r={1.1} h={2.4} lid />
        <g stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" vectorEffect="non-scaling-stroke">
          <path d="M 34 24 q -4 -5 0 -10 q 4 -5 0 -10" />
          <path d="M 46 26 q -4 -5 0 -10 q 4 -5 0 -10" />
        </g>
      </IsoFigure>
    </div>
  )
})

/** Beats 4 and 5: the original team above, the same rush with an extra cashier below. */
const CompareScene = memo(function CompareScene({ phase }: { phase: 'fix' | 'surprise' }) {
  const surprise = phase === 'surprise'
  const emphasis = { station: (surprise ? 'drinks' : 'order') as StationId, kind: 'queue' as const }
  const countsAt = surprise ? undefined : (['order'] as const)
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-base">
        <span className="display text-xl">{SAME_RUSH_LABEL}</span>
        {surprise ? (
          <span className="tabular opacity-90"> Both cafés: {baselineAtClose.completed} picked up, {baselineAtClose.inShop} still in the shop.</span>
        ) : null}
      </p>
      <div data-row className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-bold">Original team</h3>
        <CoffeeStage snapshot={baselineAtClose} detail="counts" compact countsAt={countsAt} emphasis={emphasis} />
      </div>
      <div data-row data-row2 style={{ opacity: 0, visibility: 'hidden' }} className="flex flex-col gap-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <span data-replay-icon aria-hidden="true" className="inline-grid size-6 place-items-center">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
            </svg>
          </span>
          Replay the same rush with an extra cashier
        </h3>
        <CoffeeStage snapshot={cashierAtClose} detail="counts" compact extraAt="order" countsAt={countsAt} emphasis={emphasis} />
      </div>
    </div>
  )
})

