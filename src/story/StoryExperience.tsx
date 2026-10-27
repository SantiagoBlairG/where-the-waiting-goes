import { memo, useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { CoffeeStage } from '@/components/CoffeeStage'
import type { TrailState } from '@/components/StationCard'
import { Worker } from '@/illustrations/Worker'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import type { StationId } from '@/simulation/config'
import { MODEL_LABEL, SAME_RUSH_LABEL, beats } from './storyBeats'
import { rushNote, stopNote, type StepNote } from './stepNotes'
import { OpeningCard } from './OpeningCard'
import { RevealText } from './RevealText'
import { baselineAtClose, cashierAtClose } from './storySnapshots'
import { BEAT_THEMES, GLOW_BACKGROUND, RUSH_FROM, RUSH_TO } from './theme'
import { BEAT_COUNT, RUSH_STEPS, TOTAL_WEIGHT, beatStart, locate, rushStepIndex, travelPosition } from './timeline'

/**
 * The pinned, scroll-driven story (screens at least 900px wide, motion allowed).
 *
 * A tall track holds a sticky full-height room. Scroll position maps to a beat (timeline.ts,
 * pure and tested); inside the rush and the traced-order beats it maps to a finer position.
 * React state changes only when the beat, rush step or traced stop changes, never per scroll
 * pixel. Every number on screen comes from the simulation engine.
 *
 * The room's tone is the narrative, kept gentle: stone and mist, warming toward sand as the
 * rush builds, sage for the fix, one deep forest moment for the reveal.
 *
 * Motion ownership (one writer per element):
 *   [data-bg], [data-glow], [data-fg-target], [data-rings]: GSAP (theme tweens; the rush sets bg directly)
 *   [data-ring-a], [data-ring-b]: GSAP set from scroll progress (parallax)
 *   [data-text] groups and their [data-word] / [data-support]: GSAP (reveal timeline)
 *   [data-scene] layers and [data-card] / [data-row] wrappers: GSAP (fades and entrance)
 *   [data-row2], [data-bench]: GSAP
 *   Tickets (the article inside each wrapper): CSS tilt, lift and active state
 *   Hairline figures: their own spring loop, inside their svg only
 */

type Scene = 'opening' | 'process' | 'compare'
const SCENE_OF_BEAT: readonly Scene[] = ['opening', 'process', 'process', 'compare', 'compare', 'process', 'process']
const STAGE_IDS: readonly StationId[] = ['order', 'drinks', 'pickup']
const GUTTER = 'clamp(32px, 7vw, 120px)'

type Step = { beat: number; rush: number; stop: number }
const START: Step = { beat: 0, rush: 0, stop: 0 }

const BEAT_LABELS = ['A familiar moment', 'One order, three stops', 'The rush', 'The obvious fix', 'The surprise', 'The reveal', 'Your turn']

/** Keeps the stage clear of the headline: it starts below whichever text group is showing. */
function positionStage(root: HTMLElement | null, beat: number) {
  const area = root?.querySelector<HTMLElement>('[data-stage-area]')
  const group = root?.querySelector<HTMLElement>('[data-text="' + beat + '"]')
  if (!area || !group) return
  // Breathing room between the words and the tickets: about 4.5% of the window height, at least 36px.
  const gap = Math.max(36, Math.round(window.innerHeight * 0.045))
  gsap.set(area, { top: group.offsetTop + group.offsetHeight + gap })
}

/**
 * A floating note that says what is happening at the current step. It sits above the ticket the
 * step is about, with a small tail pointing down at it. A new note slides in when the step changes.
 */
function FloatingNote({ note, column }: { note: StepNote; column: number }) {
  // Centre the note over its column, but keep it inside the row.
  const WIDTH = 46
  const center = column * 33.333 + 16.667
  const left = Math.min(Math.max(center - WIDTH / 2, 0), 100 - WIDTH)
  const tail = ((center - left) / WIDTH) * 100
  return (
    <div key={note.text} className="absolute bottom-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 motion-reduce:animate-none" style={{ left: left + '%', width: WIDTH + '%' }}>
      <div className="relative rounded-2xl bg-paper px-5 py-3.5 text-ink shadow-[0_10px_24px_-8px_rgb(27_38_34/0.35)]">
        <p className="text-sm font-bold leading-tight text-forest">{note.where}</p>
        <p className="mt-1 text-[0.95rem] leading-snug">{note.text}</p>
        <span aria-hidden="true" className="absolute -bottom-1.5 size-3 -translate-x-1/2 rotate-45 bg-paper" style={{ left: tail + '%' }} />
      </div>
    </div>
  )
}

const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`

export function StoryExperience() {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>(START)
  const [rewind, setRewind] = useState(30)
  // The rail and the opening cue belong to the pinned story only: hide them once it has scrolled away.
  const [onStage, setOnStage] = useState(true)
  const live = useRef({ step: START, prevBeat: -1 })

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
      const ringA = q('[data-ring-a]')[0]
      const ringB = q('[data-ring-b]')[0]
      const bg = q('[data-bg]')[0]
      const setRingA = gsap.quickSetter(ringA, 'y', 'px')
      const setRingB = gsap.quickSetter(ringB, 'y', 'px')
      const setRotA = gsap.quickSetter(ringA, 'rotation', 'deg')
      const setRotB = gsap.quickSetter(ringB, 'rotation', 'deg')

      const apply = (progress: number) => {
        const { beat, local } = locate(progress)
        const rushIdx = beat === 2 ? rushStepIndex(local) : beat > 2 ? RUSH_STEPS.length - 1 : 0
        const stop = beat === 1 ? Math.round(travelPosition(local)) : beat > 1 ? 2 : 0
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
      // Keep the stage below the headline whenever the text reflows for any reason: window resize,
      // a font finishing loading, or a different wrap. A one-off measurement goes stale.
      const stageTrigger = ScrollTrigger.create({
        trigger: track.current,
        start: 'top 60%',
        end: 'bottom 40%',
        onToggle: (self) => setOnStage(self.isActive),
      })
      const relayout = () => positionStage(root.current, live.current.step.beat)
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

      gsap.killTweensOf(['[data-text]', '[data-word]', '[data-support]', '[data-scene]', '[data-card]', '[data-row]', '[data-cue]', '[data-bench]', '[data-row2]', '[data-bg]', '[data-glow]', '[data-fg-target]', '[data-rings]'])

      // Room: the tone of the story. The rush sets its own background from the clock.
      const colorDur = prev < 0 ? 0 : 1
      if (beat !== 2) gsap.to(q('[data-bg]'), { backgroundColor: theme.bg, duration: colorDur, ease: 'power2.inOut' })
      gsap.to(q('[data-glow]'), { '--glow-a': theme.glowA, '--glow-b': theme.glowB, duration: colorDur, ease: 'power2.inOut' })
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
      positionStage(root.current, beat)
      gsap.fromTo(words(beat), { yPercent: 120 * dir }, { yPercent: 0, duration: 0.95, stagger: 0.06, ease: 'power4.out', delay: prev < 0 ? 0.15 : 0.26 })
      gsap.fromTo(support(beat), { autoAlpha: 0, y: 18 * dir }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: prev < 0 ? 0.7 : 0.8 })

      // Scenes: the outgoing one fades; an incoming one slides its tickets up into place.
      ;(['opening', 'process', 'compare'] as const).forEach((s) => {
        if (s !== active) gsap.to(scene(s), { autoAlpha: 0, duration: 0.3, ease: 'power2.in', overwrite: 'auto' })
      })
      gsap.set(scene(active), { y: 0 })
      gsap.to(scene(active), { autoAlpha: 1, duration: 0.35, ease: 'power2.out', delay: prev < 0 ? 0.2 : 0.15, overwrite: 'auto' })
      if (active !== prevScene && active !== 'opening') {
        const targets = active === 'process' ? q('[data-scene="process"] [data-card]') : q('[data-scene="compare"] [data-row]')
        targets.forEach((el, i) => {
          gsap.fromTo(
            el,
            { y: 90, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 1, ease: 'power4.out', delay: 0.2 + i * 0.1, overwrite: 'auto' },
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

      // Beat 7: the extra worker steps onto the bench and the clock rewinds to the start.
      gsap.to(q('[data-bench]'), {
        autoAlpha: beat === 6 ? 1 : 0,
        width: beat === 6 ? 'var(--bench-w)' : 0,
        marginLeft: beat === 6 ? '1.5rem' : 0,
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

  const { beat } = step
  const processSnapshot = beat === 5 ? cashierAtClose : RUSH_STEPS[beat === 6 ? rewind : beat === 2 ? step.rush : 0]
  const trail = Object.fromEntries(
    STAGE_IDS.map((id, i): [StationId, TrailState] => [id, i < step.stop ? 'past' : i === step.stop ? 'now' : 'next']),
  ) as Record<StationId, TrailState>
  const theme0 = BEAT_THEMES[0]
  // The step note: one per stop in the traced-order beat, one per phase of the rush clock.
  const note: StepNote | null = beat === 1 ? stopNote(step.stop) : beat === 2 ? rushNote(processSnapshot) : null

  return (
    <div ref={root}>
      <a
        href="#experiment"
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-control bg-paper px-4 py-2 text-sm font-semibold text-forest shadow-lg outline-none focus-visible:translate-y-0 focus-visible:ring-3 focus-visible:ring-ring/50"
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

        <div aria-hidden="true" className="sticky top-0 isolate h-svh overflow-hidden">
          {/* The room: a calm tone from the palette, two soft glows, coffee-ring stains and grain. */}
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

            {/* A quiet note in the corner instead of a footer. */}
            <p
              className="absolute top-[3.2svh] inline-flex items-center gap-2 rounded-full border border-current/25 px-3.5 py-1.5 text-sm font-medium opacity-90"
              style={{ right: GUTTER }}
            >
              <Info aria-hidden="true" className="size-4" strokeWidth={2} />
              {MODEL_LABEL}
            </p>

            {/* The rush clock is the hero of the rush and of the rewind. */}
            {beat === 2 || beat === 6 ? (
              <div
                data-clock
                className="absolute top-[10svh] flex animate-in flex-col items-end fade-in-0 slide-in-from-right-4 duration-500 motion-reduce:animate-none"
                style={{ right: GUTTER }}
              >
                <span className="display text-[clamp(4rem,9.5vw,10.5rem)] leading-[0.82] tabular">{mmss(processSnapshot.timeSeconds)}</span>
                <span className="mt-3 text-lg font-medium tabular opacity-90">
                  {beat === 6 && rewind === 0 ? 'Start of the rush. Paused.' : 'Rush clock, of 10:00'}
                </span>
                {beat === 2 ? (
                  <span className="mt-2 flex items-center gap-5 text-base tabular">
                    <span className="flex items-baseline gap-2">
                      <span className="opacity-80">Picked up</span>
                      <span className="display text-2xl leading-none">{processSnapshot.completed}</span>
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span className="opacity-80">Still in the shop</span>
                      <span className="display text-2xl leading-none">{processSnapshot.inShop}</span>
                    </span>
                  </span>
                ) : null}
              </div>
            ) : null}

            <div data-stage-area className="absolute inset-x-0 bottom-[7svh]" style={{ top: '31svh' }}>
              <Layer scene="opening" visible align="end" justify="end">
                <OpeningCard className="w-[min(31vw,470px)] self-end" />
              </Layer>

              <Layer scene="process">
                <div className="flex w-full items-end">
                  <div className="min-w-0 flex-1">
                    {note ? (
                      <div className="relative mb-5 h-[5.25rem]">
                        <FloatingNote note={note} column={STAGE_IDS.indexOf(note.station)} />
                      </div>
                    ) : null}
                    <CoffeeStage
                      snapshot={processSnapshot}
                      detail={beat === 1 ? 'named' : beat === 2 ? 'counts' : 'full'}
                      trail={beat === 1 ? trail : undefined}
                      extraAt={beat === 5 ? 'order' : undefined}
                      emphasis={beat === 5 ? { station: 'drinks', kind: 'both' } : undefined}
                    />
                  </div>
                  <div
                    data-bench
                    style={{ ['--bench-w' as string]: '10rem', width: 0, marginLeft: 0, opacity: 0, visibility: 'hidden' }}
                    className="flex shrink-0 flex-col items-center gap-4 self-center overflow-hidden rounded-card border-2 border-dashed border-current/45 py-9"
                  >
                    <Worker variant="extra" label="Extra worker, on the bench" className="size-16" />
                    <p className="whitespace-nowrap px-4 text-sm font-semibold">Extra worker</p>
                  </div>
                </div>
              </Layer>

              <Layer scene="compare">
                <CompareScene phase={beat === 4 ? 'surprise' : 'fix'} />
              </Layer>
            </div>
          </div>
        </div>

        {/* Opening cue and chapter rail sit above the decorative pane so they stay reachable. */}
        <div
          data-cue
          data-fg-target
          className="pointer-events-none fixed bottom-[8svh] z-20 flex flex-col items-start gap-1"
          style={{ left: GUTTER, color: theme0.fg }}
        >
          <p className="text-lg font-medium">Scroll to follow one order</p>
          {/* The mouse and touch link. Keyboard users have the skip link above, so this is not a second tab stop. */}
          <a
            href="#experiment"
            tabIndex={-1}
            className="pointer-events-auto -ml-3 rounded-control px-3 py-2 text-sm font-semibold underline underline-offset-4 outline-none transition-opacity hover:opacity-70 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Skip to experiment
          </a>
        </div>

        <nav
          aria-label="Story chapters"
          data-fg-target
          inert={!onStage}
          className={cn(
            'fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col transition-opacity duration-300 wide:flex',
            !onStage && 'pointer-events-none opacity-0',
          )}
          style={{ color: theme0.fg }}
        >
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
                className="pointer-events-none absolute right-9 whitespace-nowrap rounded-control bg-ink px-3 py-1.5 text-xs font-semibold text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
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
          className="absolute top-[clamp(28px,6svh,92px)] flex flex-col items-start gap-[clamp(12px,2.4svh,24px)]"
        >
          <RevealText
            as="p"
            text={b.headline}
            className={cn(
              'display text-balance',
              i === 0
                ? 'max-w-[15ch] text-[clamp(2.6rem,min(7.6vw,13.5svh),8.8rem)] leading-[0.92]'
                : 'max-w-[17ch] text-[clamp(2rem,min(4.9vw,8.4svh),5.4rem)] leading-[0.95]',
            )}
          />
          {b.support ? (
            <p data-support className="max-w-[38ch] text-pretty text-[clamp(1rem,2.4svh,1.25rem)] leading-relaxed" style={{ color: BEAT_THEMES[0].fg2 }}>
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
      <circle r="330" strokeWidth="3" opacity="0.12" />
      <circle r="300" strokeWidth="14" opacity="0.06" />
      <circle r="236" strokeWidth="2" opacity="0.1" />
      <circle r="150" strokeWidth="2" opacity="0.08" />
      <path d="M-330 0A330 330 0 0 1 -60 -324" strokeWidth="9" opacity="0.14" strokeLinecap="round" />
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
function Layer({
  scene,
  visible = false,
  align = 'end',
  justify = 'center',
  children,
}: {
  scene: Scene
  visible?: boolean
  align?: 'end' | 'center'
  justify?: 'end' | 'center'
  children: ReactNode
}) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const fit = () => {
      // 32px of slack leaves room for the active lift and hover lift.
      const scale = Math.min(1, (o.clientHeight - 32) / i.offsetHeight)
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
      className={cn('absolute inset-0 flex', justify === 'end' ? 'justify-end' : 'justify-center', align === 'end' ? 'items-end' : 'items-center')}
    >
      <div ref={inner} className={cn('flex w-full origin-bottom items-end', justify === 'end' ? 'justify-end' : 'justify-center')}>
        {children}
      </div>
    </div>
  )
}

/** Beats 4 and 5: the original team above, the same rush with an extra cashier below. */
const CompareScene = memo(function CompareScene({ phase }: { phase: 'fix' | 'surprise' }) {
  const surprise = phase === 'surprise'
  const emphasis = { station: (surprise ? 'drinks' : 'order') as StationId, kind: 'queue' as const }
  const countsAt = surprise ? undefined : (['order'] as const)
  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="display text-2xl">{SAME_RUSH_LABEL}</p>
        {surprise ? (
          <p className="tabular text-base opacity-90">
            Both cafés: {baselineAtClose.completed} picked up, {baselineAtClose.inShop} still in the shop.
          </p>
        ) : null}
      </div>
      <div data-row className="flex flex-col gap-2.5">
        <h3 className="font-display text-lg font-bold">Original team</h3>
        <CoffeeStage snapshot={baselineAtClose} detail="counts" compact countsAt={countsAt} emphasis={emphasis} />
      </div>
      <div data-row data-row2 style={{ opacity: 0, visibility: 'hidden' }} className="flex flex-col gap-2.5">
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
