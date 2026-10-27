import { useRef, type ReactNode } from 'react'
import { CoffeeStage } from '@/components/CoffeeStage'
import { HairlineFigure } from '@/illustrations/hairline/HairlineFigure'
import { mountRegister } from '@/illustrations/hairline/registerFigure'
import { IsoCylinder, IsoFigure } from '@/illustrations/iso'
import type { Origin } from '@/illustrations/iso-math'
import { Worker } from '@/illustrations/Worker'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { RevealText } from './RevealText'
import { MODEL_LABEL, SAME_RUSH_LABEL, beats, type Beat, type BeatId } from './storyBeats'
import { baselineAtClose, baselineMidRush, cashierAtClose, startOfRush } from './storySnapshots'
import { BEAT_THEMES, RUSH_MID, type RoomTheme } from './theme'

/**
 * The same seven beats as ordinary sections, for phones, tablets and anyone who prefers
 * reduced motion. Every word and every state is here; nothing depends on scroll scrubbing.
 * Each beat keeps its own colored room, counter and coffee-ring stains.
 */
export function StoryStatic() {
  const byId = Object.fromEntries(beats.map((b, i) => [b.id, { beat: b, theme: BEAT_THEMES[i] }])) as Record<
    BeatId,
    { beat: Beat; theme: RoomTheme }
  >

  return (
    <div>
      <Room {...byId.familiar} first>
        <OpeningScene />
        <a
          href="#experiment"
          className="mt-4 inline-block self-start rounded-control px-1 py-2 text-sm font-semibold underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Skip to experiment
        </a>
      </Room>

      <Room {...byId['three-stops']}>
        <CoffeeStage snapshot={startOfRush} detail="named" trail={{ order: 'now', drinks: 'next', pickup: 'next' }} />
      </Room>

      <Room {...byId.rush} theme={RUSH_MID}>
        <CoffeeStage snapshot={baselineMidRush} detail="counts" showTotals />
      </Room>

      <Room {...byId.fix}>
        <Compare />
      </Room>

      <Room {...byId.surprise}>
        <Compare surprise />
      </Room>

      <Room {...byId.reveal}>
        <CoffeeStage snapshot={cashierAtClose} detail="full" extraAt="order" emphasis={{ station: 'drinks', kind: 'both' }} />
      </Room>

      <Room {...byId['your-turn']} id="experiment" last>
        <div className="flex flex-col items-stretch gap-6 wide:flex-row wide:items-center">
          <div className="min-w-0 flex-1">
            <CoffeeStage snapshot={startOfRush} detail="full" />
          </div>
          <div className="flex shrink-0 flex-row items-center gap-4 self-center rounded-card border-2 border-dashed border-current/50 px-6 py-5 wide:w-40 wide:flex-col wide:py-8">
            <Worker variant="extra" label="Extra worker, on the bench" className="h-16 text-current" />
            <p className="text-sm font-semibold wide:text-center">Extra worker</p>
          </div>
        </div>
      </Room>
    </div>
  )
}

function Rings({ className, ring }: { className?: string; ring: 'a' | 'b' }) {
  return (
    <svg
      data-ring={ring}
      viewBox="-340 -340 680 680"
      aria-hidden="true"
      className={cn('pointer-events-none absolute', className)}
      fill="none"
      stroke="currentColor"
    >
      <circle r="330" strokeWidth="3" opacity="0.14" />
      <circle r="300" strokeWidth="14" opacity="0.07" />
      <circle r="236" strokeWidth="2" opacity="0.12" />
      <circle r="150" strokeWidth="2" opacity="0.1" />
      <path d="M-330 0A330 330 0 0 1 -60 -324" strokeWidth="9" opacity="0.18" strokeLinecap="round" />
    </svg>
  )
}

type RoomProps = { beat: Beat; theme: RoomTheme; first?: boolean; last?: boolean; id?: string; children: ReactNode }

/** One colored room: headline, the stage standing on a counter, coffee rings and grain behind. */
function Room({ beat, theme, first, last, id, children }: RoomProps) {
  const headingId = `room-${beat.id}`
  const ref = useRef<HTMLElement>(null)

  // Scroll motion for every width: words rise, tickets are pushed up over the counter, and the
  // coffee rings drift. Skipped entirely for people who prefer reduced motion. If a room is
  // already above the viewport (reload mid-page) it shows its final state at once.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(ref)
        const words = q('[data-word]')
        const support = q('[data-support]')
        const cards = q('[data-card]')
        const rings = q('[data-ring]')
        const hideText = () => {
          gsap.set(words, { yPercent: 120 })
          gsap.set(support, { autoAlpha: 0, y: 18 })
        }
        const showText = (instant: boolean) => {
          gsap.to(words, { yPercent: 0, duration: instant ? 0 : 0.95, stagger: instant ? 0 : 0.06, ease: 'power4.out', overwrite: 'auto' })
          gsap.to(support, { autoAlpha: 1, y: 0, duration: instant ? 0 : 0.8, delay: instant ? 0 : 0.5, ease: 'power3.out', overwrite: 'auto' })
        }
        hideText()
        ScrollTrigger.create({
          trigger: ref.current,
          start: 'top 72%',
          onEnter: () => showText(false),
          onLeave: () => showText(true),
          onLeaveBack: hideText,
        })

        if (cards.length) {
          const hideCards = () => gsap.set(cards, { autoAlpha: 0, y: 110, rotation: (i: number) => (i - 1) * 3 })
          const showCards = (instant: boolean) =>
            gsap.to(cards, { autoAlpha: 1, y: 0, rotation: 0, duration: instant ? 0 : 1, stagger: instant ? 0 : 0.1, ease: 'power4.out', overwrite: 'auto' })
          hideCards()
          ScrollTrigger.create({
            trigger: q('figure')[0],
            start: 'top 88%',
            onEnter: () => showCards(false),
            onLeave: () => showCards(true),
            onLeaveBack: hideCards,
          })
        }

        rings.forEach((ring, i) =>
          gsap.to(ring, {
            y: i === 0 ? -140 : 110,
            rotation: i === 0 ? 30 : -24,
            ease: 'none',
            scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
          }),
        )
      })
      return () => mm.revert()
    },
    { scope: ref },
  )

  return (
    <section
      ref={ref}
      id={id}
      aria-labelledby={headingId}
      className="relative isolate overflow-hidden px-5 pb-28 pt-12 sm:px-10 sm:pt-16 wide:px-[6vw]"
      style={{ backgroundColor: theme.bg, color: theme.fg }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10" style={{ color: theme.ring }}>
        <Rings ring="a" className="-right-[30vw] -top-[8vh] w-[110vw] max-w-[900px] wide:-right-[14vw] wide:w-[58vw]" />
        <Rings ring="b" className="-bottom-[20vh] -left-[40vw] w-[100vw] max-w-[760px] wide:-left-[14vw] wide:w-[48vw]" />
      </div>
      <div className="grain pointer-events-none absolute inset-0 -z-10" />
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-24 border-t-[3px] border-white/30"
        style={{ backgroundColor: theme.counter, boxShadow: '0 -16px 28px -12px rgb(29 18 13 / 0.25)' }}
      />

      <div className="mx-auto flex max-w-6xl flex-col items-start gap-5">
        <RevealText
          as={first ? 'h1' : 'h2'}
          id={headingId}
          text={beat.headline}
          className={cn(
            'display text-balance',
            first
              ? 'max-w-[14ch] text-[clamp(3.1rem,13vw,8.5rem)] leading-[0.9]'
              : 'max-w-[18ch] text-[clamp(2.5rem,9.5vw,5.4rem)] leading-[0.94]',
          )}
        />
        {beat.support ? (
          <p data-support className="max-w-[40ch] text-pretty text-lg font-medium sm:text-xl" style={{ color: theme.fg2 }}>
            {beat.support}
          </p>
        ) : null}
        <figure className="m-0 mt-6 flex w-full flex-col">
          <figcaption className="sr-only">{beat.stageDescription}</figcaption>
          {children}
        </figure>
        {last ? <p className="text-sm opacity-90">{MODEL_LABEL}. Not a forecast for a real café.</p> : null}
      </div>
    </section>
  )
}

const cupOrigin: Origin = { ox: 40, oy: 56 }
const idleRegister = { queue: 0, inService: 0 }

function OpeningScene() {
  return (
    <div className="flex w-full items-end justify-end gap-3 sm:gap-6">
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="size-7 rounded-full border-[3px] border-paper bg-cobalt shadow-[0_0_0_8px_rgb(43_63_224/0.28)]" />
        <p className="text-sm font-medium">Your order</p>
      </div>
      <HairlineFigure
        mount={mountRegister}
        state={idleRegister}
        label="A café counter with a cash register, a card reader and a receipt slot"
        className="w-[min(64vw,420px)] shrink-0"
      />
      <IsoFigure label="A cup of coffee with a lid, steaming" viewBox="0 0 80 90" className="mb-3 h-auto w-14 shrink-0 text-ink sm:w-20">
        <IsoCylinder origin={cupOrigin} x={0} y={0} z={0} r={1.1} h={2.4} lid />
        <g stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" vectorEffect="non-scaling-stroke">
          <path d="M 34 24 q -4 -5 0 -10 q 4 -5 0 -10" />
          <path d="M 46 26 q -4 -5 0 -10 q 4 -5 0 -10" />
        </g>
      </IsoFigure>
    </div>
  )
}

function Compare({ surprise = false }: { surprise?: boolean }) {
  const emphasis = { station: surprise ? ('drinks' as const) : ('order' as const), kind: 'queue' as const }
  const countsAt = surprise ? undefined : (['order'] as const)
  return (
    <div className="flex w-full flex-col gap-6">
      <p className="text-base">
        <span className="display text-2xl">{SAME_RUSH_LABEL}</span>
        {surprise ? (
          <span className="tabular opacity-90"> Both cafés: {baselineAtClose.completed} picked up, {baselineAtClose.inShop} still in the shop.</span>
        ) : null}
      </p>
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-bold">Original team</h3>
        <CoffeeStage snapshot={baselineAtClose} detail="counts" compact countsAt={countsAt} emphasis={emphasis} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-bold">Replay the same rush with an extra cashier</h3>
        <CoffeeStage snapshot={cashierAtClose} detail="counts" compact extraAt="order" countsAt={countsAt} emphasis={emphasis} />
      </div>
    </div>
  )
}
