import { useRef, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { MODEL_LABEL, beats, type Beat, type BeatId } from './storyBeats'
import { frameFor, type StageFrame } from './frames'
import { RevealText } from './RevealText'
import { RichText } from './RichText'
import { StoryStage } from './StoryStage'
import { baselineMidRush } from './storySnapshots'
import { BEAT_THEMES, GLOW_BACKGROUND, RUSH_MID, type RoomTheme } from './theme'

/**
 * The same seven beats as ordinary sections, for screens narrower than 900px and for anyone
 * who prefers reduced motion. Every word and every state is here. Each beat keeps its own
 * calm room, soft glows and coffee-ring stains, and (unless motion is reduced) its own scroll
 * reveals, so the narrow experience is not a lesser one.
 */
export function StoryStatic() {
  const byId = Object.fromEntries(beats.map((b, i) => [b.id, { beat: b, theme: BEAT_THEMES[i] }])) as Record<
    BeatId,
    { beat: Beat; theme: RoomTheme }
  >

  // The same simplified frames as the pinned story. The traced order rests at its first stop and
  // the rush is shown half way through.
  const stage = (index: number, frame: StageFrame, tracePosition?: number) => (
    <StoryStage frame={frame} tracePosition={tracePosition} phoneCompact key={index} />
  )

  return (
    <div id="story">
      <Room {...byId.familiar} first>
        {stage(0, frameFor(0))}
      </Room>
      <Room {...byId['three-stops']}>{stage(1, frameFor(1, { stop: 0 }), 0)}</Room>
      <Room {...byId.rush} theme={RUSH_MID}>
        {stage(2, frameFor(2, { rush: baselineMidRush }))}
      </Room>
      <Room {...byId.fix}>{stage(3, frameFor(3))}</Room>
      <Room {...byId.surprise}>{stage(4, frameFor(4))}</Room>
      <Room {...byId.reveal}>{stage(5, frameFor(5))}</Room>
      <Room {...byId.pickup}>{stage(6, frameFor(6))}</Room>
      <Room {...byId['your-turn']} last>
        {stage(7, frameFor(7))}
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
      <circle r="330" strokeWidth="3" opacity="0.12" />
      <circle r="300" strokeWidth="14" opacity="0.06" />
      <circle r="236" strokeWidth="2" opacity="0.1" />
      <circle r="150" strokeWidth="2" opacity="0.08" />
      <path d="M-330 0A330 330 0 0 1 -60 -324" strokeWidth="9" opacity="0.14" strokeLinecap="round" />
    </svg>
  )
}

type RoomProps = { beat: Beat; theme: RoomTheme; first?: boolean; last?: boolean; id?: string; children: ReactNode }

/** One calm room: headline, the stage, soft glows and coffee rings behind. */
function Room({ beat, theme, first, last, id, children }: RoomProps) {
  const headingId = `room-${beat.id}`
  const ref = useRef<HTMLElement>(null)

  // Scroll motion for every width: words rise, tickets slide into place, and the coffee rings
  // drift. Skipped entirely for people who prefer reduced motion. If a room is already above the
  // viewport (reload mid-page) it shows its final state at once.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const q = gsap.utils.selector(ref)
        const words = q('[data-word]')
        const support = q('[data-support]')
        // The stage as one piece. The tiles inside belong to CSS, so GSAP never writes to them.
        const cards = q('figure > div')
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
          const hideCards = () => gsap.set(cards, { autoAlpha: 0, y: 90 })
          const showCards = (instant: boolean) =>
            gsap.to(cards, { autoAlpha: 1, y: 0, duration: instant ? 0 : 1, stagger: instant ? 0 : 0.1, ease: 'power4.out', overwrite: 'auto' })
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
      className="relative isolate -mt-10 overflow-hidden rounded-t-[40px] px-6 pb-24 pt-28 first:mt-0 first:rounded-t-none sm:px-12 wide:px-[7vw]"
      style={{ backgroundColor: theme.bg, color: theme.fg }}
    >
      <div
        className="absolute inset-0 -z-10"
        style={{ background: GLOW_BACKGROUND, ['--glow-a' as string]: theme.glowA, ['--glow-b' as string]: theme.glowB }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10" style={{ color: theme.ring }}>
        <Rings ring="a" className="-right-[30vw] -top-[8vh] w-[110vw] max-w-[900px] wide:-right-[14vw] wide:w-[58vw]" />
        <Rings ring="b" className="-bottom-[20vh] -left-[40vw] w-[100vw] max-w-[760px] wide:-left-[14vw] wide:w-[48vw]" />
      </div>
      <div className="grain pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6">
        <RevealText
          as="h2"
          id={headingId}
          text={beat.headline}
          accent={beat.accent}
          className={cn(
            'display text-balance',
            first
              ? 'max-w-[15ch] text-[clamp(3rem,12vw,8rem)] leading-[0.92]'
              : 'max-w-[17ch] text-[clamp(2.5rem,9vw,5.2rem)] leading-[0.95]',
          )}
        />
        {beat.support ? (
          <p data-support className="max-w-[44ch] text-pretty text-lg leading-relaxed sm:text-xl" style={{ color: theme.fg2 }}>
            <RichText text={beat.support} />
          </p>
        ) : null}
        <figure className="m-0 mt-8 flex w-full flex-col">
          <figcaption className="sr-only">{beat.stageDescription}</figcaption>
          {children}
        </figure>
        {last ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-current/25 px-3.5 py-1.5 text-sm font-medium">
            <Info aria-hidden="true" className="size-4" strokeWidth={2} />
            {MODEL_LABEL}. Not a forecast for a real café.
          </p>
        ) : null}
      </div>
    </section>
  )
}
