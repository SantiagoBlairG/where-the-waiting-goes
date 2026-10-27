import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { CoffeeStage } from '@/components/CoffeeStage'
import { OrderDot } from '@/components/OrderDot'
import { HairlineFigure } from '@/illustrations/hairline/HairlineFigure'
import { mountRegister } from '@/illustrations/hairline/registerFigure'
import { IsoCylinder, IsoFigure } from '@/illustrations/iso'
import type { Origin } from '@/illustrations/iso-math'
import { Worker } from '@/illustrations/Worker'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import type { TrailState } from '@/components/StationCard'
import type { StationId } from '@/simulation/config'
import { MODEL_LABEL, SAME_RUSH_LABEL, beats } from './storyBeats'
import { RevealText } from './RevealText'
import { baselineAtClose, cashierAtClose } from './storySnapshots'
import { BEAT_COUNT, RUSH_STEPS, TOTAL_WEIGHT, beatStart, locate, rushStepIndex, travelPosition } from './timeline'

/**
 * The pinned, scroll-driven story (wide screens, motion allowed).
 *
 * How it works: a tall track holds a sticky full-height pane. Scroll position is mapped to a
 * beat, and inside two beats to a finer position (the rush clock, the traced order), by the
 * pure functions in timeline.ts. React state changes only when the beat, the rush step or the
 * traced stop changes, never per scroll pixel. GSAP animates the text, the scene swaps and the
 * depth; the model numbers all come from the simulation engine.
 *
 * Motion ownership (one writer per element):
 *   [data-text] groups and their [data-word] / [data-support] children: GSAP (reveal timeline)
 *   [data-scene] layers: GSAP (cross-fade and offset)
 *   [data-tilt] stage wrapper: GSAP quickTo (pointer depth)
 *   [data-card] wrappers: GSAP (arc rotation, y, parallax x). The cards inside use CSS hover only.
 *   .travel-dot: GSAP set from scroll position
 *   [data-bench]: GSAP (width, opacity)
 *   Hairline figures: their own spring loop, inside their svg only.
 */

type Scene = 'opening' | 'process' | 'compare'
const SCENE_OF_BEAT: readonly Scene[] = ['opening', 'process', 'process', 'compare', 'compare', 'process', 'process']
const STAGE_IDS: readonly StationId[] = ['order', 'drinks', 'pickup']

type Step = { beat: number; rush: number; stop: number }
const START: Step = { beat: 0, rush: 0, stop: 0 }

const BEAT_LABELS = ['A familiar moment', 'One order, three stops', 'The rush', 'The obvious fix', 'The surprise', 'The reveal', 'Your turn']
const ARC = [
  { rotationY: 5, y: 14, depth: -10 },
  { rotationY: 0, y: 0, depth: 0 },
  { rotationY: -5, y: 14, depth: 10 },
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

  // Scroll position -> state. Writes React state only when something visible changes.
  useGSAP(
    () => {
      const dot = root.current?.querySelector<HTMLElement>('.travel-dot')
      const place = (local: number) => {
        const stage = root.current?.querySelector<HTMLElement>('[data-stage-area]')
        const rows = root.current?.querySelectorAll<HTMLElement>('[data-scene="process"] [data-worker-row]')
        if (!dot || !stage || !rows || rows.length < 3) return
        const s = stage.getBoundingClientRect()
        const pts = Array.from(rows, (r) => {
          const b = r.getBoundingClientRect()
          return { x: b.left - s.left + 12, y: b.top - s.top + b.height * 0.5 }
        })
        const pos = travelPosition(local)
        const i = Math.min(1, Math.floor(pos))
        const f = pos - i
        gsap.set(dot, { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f - 10, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f - 10 })
      }

      const apply = (progress: number) => {
        const { beat, local } = locate(progress)
        const rush = beat === 2 ? rushStepIndex(local) : beat > 2 ? RUSH_STEPS.length - 1 : 0
        const stop = beat === 1 ? Math.round(travelPosition(local)) : beat > 1 ? 2 : 0
        live.current.local = local
        const prev = live.current.step
        if (prev.beat !== beat || prev.rush !== rush || prev.stop !== stop) {
          live.current.step = { beat, rush, stop }
          setStep({ beat, rush, stop })
        }
      }

      // The scene is still easing into place for a moment after the beat changes, so the dot
      // follows the cards' real position every frame while it is on screen.
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

  // Beat change -> reveal timeline. Time-based, so a fast scroll just snaps to the right state.
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

      gsap.killTweensOf(['[data-text]', '[data-word]', '[data-support]', '[data-scene]', '[data-cue]', '[data-bench]', '[data-row2]'])

      // Text: everything off except the arriving beat, which reveals word by word.
      for (let i = 0; i < BEAT_COUNT; i++) if (i !== beat) gsap.set(group(i), { autoAlpha: 0 })
      if (prev >= 0 && prev !== beat) {
        gsap.set(group(prev), { autoAlpha: 1 })
        gsap.to(words(prev), { yPercent: -110 * dir, duration: 0.32, stagger: 0.012, ease: 'power2.in' })
        gsap.to(support(prev), { autoAlpha: 0, duration: 0.2 })
        gsap.set(group(prev), { autoAlpha: 0, delay: 0.4 })
      }
      gsap.set(group(beat), { autoAlpha: 1 })
      gsap.fromTo(words(beat), { yPercent: 118 * dir }, { yPercent: 0, duration: 0.85, stagger: 0.05, ease: 'power3.out', delay: prev < 0 ? 0.1 : 0.22 })
      gsap.fromTo(support(beat), { autoAlpha: 0, y: 16 * dir }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: prev < 0 ? 0.55 : 0.6 })

      // Scenes: cross-fade with a small offset against the scroll direction.
      const active = SCENE_OF_BEAT[beat]
      ;(['opening', 'process', 'compare'] as const).forEach((s) => {
        if (s === active) {
          gsap.to(scene(s), { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: prev < 0 ? 0.3 : 0.18, overwrite: 'auto' })
        } else {
          gsap.to(scene(s), { autoAlpha: 0, y: -28 * dir, duration: 0.4, ease: 'power2.in', overwrite: 'auto' })
        }
      })
      if (active !== 'opening') gsap.set(scene(active), { y: 28 * dir, overwrite: 'auto' })

      // Opening cue (scroll hint and skip link) shows only on the first beat.
      gsap.to(q('[data-cue]'), { autoAlpha: beat === 0 ? 1 : 0, duration: 0.4 })

      // Beat 3: the same rush is replayed with an extra cashier, shown explicitly.
      const row2 = q('[data-row2]')
      if (beat === 3 && prev === 2) {
        gsap.set(row2, { autoAlpha: 0, y: 36 })
        gsap.to(row2, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.9 })
        gsap.fromTo(q('[data-replay-icon]'), { rotation: 0 }, { rotation: -360, duration: 1.1, ease: 'power2.inOut', delay: 0.9 })
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

  // Depth: arc, and a slow parallax that follows the pointer. GSAP owns the card wrappers.
  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-scene="process"] [data-card]')
      cards.forEach((el, i) => gsap.set(el, { transformPerspective: 1400, rotationY: ARC[i].rotationY, y: ARC[i].y }))
      const tilt = root.current?.querySelector<HTMLElement>('[data-tilt]')
      if (!tilt) return
      gsap.set(tilt, { transformPerspective: 1800 })
      const tiltY = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3.out' })
      const tiltX = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3.out' })
      const shifts = cards.map((el) => gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }))
      const onMove = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2
        const ny = (e.clientY / window.innerHeight - 0.5) * 2
        tiltY(nx * 2.2)
        tiltX(-ny * 1.4)
        shifts.forEach((to, i) => to(nx * ARC[i].depth))
      }
      const onLeave = () => {
        tiltY(0)
        tiltX(0)
        shifts.forEach((to) => to(0))
      }
      window.addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      return () => {
        window.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: root },
  )

  const { beat } = step
  const processSnapshot = beat === 5 ? cashierAtClose : RUSH_STEPS[beat === 6 ? rewind : beat === 2 ? step.rush : 0]
  const trail = Object.fromEntries(
    STAGE_IDS.map((id, i): [StationId, TrailState] => [id, i < step.stop ? 'past' : i === step.stop ? 'now' : 'next']),
  ) as Record<StationId, TrailState>
  const clockSeconds = processSnapshot.timeSeconds

  return (
    <div ref={root}>
      <a
        href="#experiment"
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-control bg-surface px-4 py-2 text-sm font-medium text-active shadow-card outline-none focus-visible:translate-y-0 focus-visible:ring-3 focus-visible:ring-ring/50"
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

        <div aria-hidden="true" className="sticky top-0 flex h-svh flex-col overflow-hidden bg-page">
          {/* Text zone: all seven groups stacked, one visible at a time. */}
          <div className="relative mx-auto mt-[3svh] h-[27svh] min-h-[190px] w-full max-w-5xl shrink-0 px-6">
            {beats.map((b, i) => (
              <div
                key={b.id}
                data-text={i}
                style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden' }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
              >
                <RevealText
                  as="p"
                  text={b.headline}
                  className={cn(
                    'text-balance font-semibold tracking-[-0.03em] text-ink',
                    i === 0
                      ? 'max-w-[18ch] text-[clamp(2.6rem,5.4vw,5.25rem)] leading-[1.02]'
                      : 'max-w-[22ch] text-[clamp(2rem,3.4vw,3.25rem)] leading-[1.07]',
                  )}
                />
                {b.support ? (
                  <p data-support className="max-w-[46ch] text-pretty text-lg text-ink-2">
                    {b.support}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {/* Stage zone */}
          <div data-stage-area className="relative min-h-0 flex-1">
            <div data-tilt className="absolute inset-0 mx-auto w-full max-w-6xl px-6">
              <Layer scene="opening" visible>
                <OpeningScene />
              </Layer>

              <Layer scene="process">
                <div className="flex w-full items-center gap-4">
                  <div className="min-w-0 flex-1">
                    {beat === 2 || beat === 6 ? (
                      <p className="mb-2 text-center text-base text-ink-2 tabular">
                        {beat === 6 && rewind === 0 ? (
                          'Start of the rush. Paused.'
                        ) : (
                          <>
                            Rush clock <span className="font-semibold text-ink">{mmss(clockSeconds)}</span> of 10:00
                          </>
                        )}
                      </p>
                    ) : null}
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
                    className="flex shrink-0 flex-col items-center gap-3 overflow-hidden rounded-card border border-dashed border-active/50 bg-active-tint/50 py-8"
                  >
                    <Worker variant="extra" label="Extra worker, on the bench" className="h-16 text-ink" />
                    <p className="whitespace-nowrap px-4 text-sm font-medium text-active">Extra worker</p>
                  </div>
                </div>
              </Layer>

              <Layer scene="compare">
                <div className="flex w-full flex-col gap-2">
                  <p className="text-center text-base text-ink-2">
                    <span className="font-medium text-ink">{SAME_RUSH_LABEL}</span>
                    {beat === 4 ? <span className="tabular"> Both cafés: {baselineAtClose.completed} picked up, {baselineAtClose.inShop} still in the shop.</span> : null}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-base font-semibold text-ink">Original team</h3>
                    <CoffeeStage
                      snapshot={baselineAtClose}
                      detail="counts"
                      compact
                      countsAt={beat === 3 ? ['order'] : undefined}
                      emphasis={{ station: beat === 3 ? 'order' : 'drinks', kind: 'queue' }}
                     
                    />
                  </div>
                  <div data-row2 style={{ opacity: 0, visibility: 'hidden' }} className="flex flex-col gap-1.5">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
                      <span data-replay-icon aria-hidden="true" className="inline-grid size-6 place-items-center text-active">
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" />
                        </svg>
                      </span>
                      Replay the same rush with an extra cashier
                    </h3>
                    <CoffeeStage
                      snapshot={cashierAtClose}
                      detail="counts"
                      compact
                      extraAt="order"
                      countsAt={beat === 3 ? ['order'] : undefined}
                      emphasis={{ station: beat === 3 ? 'order' : 'drinks', kind: 'queue' }}
                     
                    />
                  </div>
                </div>
              </Layer>

              <span
                aria-hidden="true"
                style={{ opacity: 0, visibility: 'hidden' }}
                className="travel-dot pointer-events-none absolute left-0 top-0 z-10 size-5 rounded-full border-2 border-active bg-active shadow-[0_0_0_6px_rgb(23_107_96/0.15)]"
              />
            </div>
          </div>

          <p className="pb-3 pt-1 text-center text-sm text-ink-2">{MODEL_LABEL}. Not a forecast for a real café.</p>
        </div>

        {/* Opening cue and chapter rail sit above the decorative pane so they stay reachable. */}
        <div
          data-cue
          className="pointer-events-none fixed inset-x-0 bottom-[8svh] z-20 flex flex-col items-center gap-2 text-center"
        >
          <p className="text-base text-ink-2">Scroll to follow one order</p>
          <a
            href="#experiment"
            className="pointer-events-auto rounded-control px-3 py-2 text-sm font-medium text-active underline underline-offset-4 outline-none transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Skip to experiment
          </a>
        </div>

        <nav aria-label="Story chapters" className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col lg:flex">
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
                  'size-2 rounded-full border border-ink-2 transition-all duration-200 group-hover:scale-150 group-focus-visible:scale-150 group-focus-visible:ring-3 group-focus-visible:ring-ring/50',
                  i === beat ? 'scale-125 border-active bg-active' : 'bg-transparent',
                )}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-9 whitespace-nowrap rounded-control bg-ink px-2.5 py-1 text-xs font-medium text-surface opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
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

/**
 * One scene layer. If a scene is taller than the room it has (short laptop windows), the
 * content is scaled down a little so nothing is clipped. The scale lives on an inner wrapper;
 * the layer itself belongs to GSAP's cross-fade.
 */
function Layer({ scene, visible = false, children }: { scene: Scene; visible?: boolean; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const o = outer.current
    const i = inner.current
    if (!o || !i) return
    const fit = () => {
      // 30px of slack leaves room for the cards' arc offset and hover lift.
      const scale = Math.min(1, (o.clientHeight - 30) / i.offsetHeight)
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
      style={{ opacity: visible ? 1 : 0, visibility: visible ? 'visible' : 'hidden' }}
      className="absolute inset-x-6 inset-y-0 flex items-center justify-center"
    >
      <div ref={inner} className="flex w-full origin-center items-center justify-center">
        {children}
      </div>
    </div>
  )
}

function OpeningScene() {
  return (
    <div className="flex w-full max-w-3xl items-end justify-center gap-6 sm:gap-10">
      <div className="flex flex-col items-center gap-2 pb-6">
        <OrderDot state="service" className="size-5" />
        <p className="text-sm text-ink-2">Your order</p>
      </div>
      <svg aria-hidden="true" viewBox="0 0 80 12" className="mb-14 w-24 shrink-0 text-ink-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round">
        <path d="M2 6h76" />
      </svg>
      <HairlineFigure
        mount={mountRegister}
        state={idleRegister}
        label="A café counter with a cash register, a card reader and a receipt slot"
        className="w-[min(26rem,44svh)] shrink-0"
      />
      <IsoFigure label="A cup of coffee with a lid, steaming" viewBox="0 0 80 90" className="mb-4 h-auto w-20 shrink-0 text-ink">
        <IsoCylinder origin={cupOrigin} x={0} y={0} z={0} r={1.1} h={2.4} lid />
        <g stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" vectorEffect="non-scaling-stroke">
          <path d="M 34 24 q -4 -5 0 -10 q 4 -5 0 -10" />
          <path d="M 46 26 q -4 -5 0 -10 q 4 -5 0 -10" />
        </g>
      </IsoFigure>
    </div>
  )
}
