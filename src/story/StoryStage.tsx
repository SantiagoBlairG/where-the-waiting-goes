import { memo } from 'react'
import { StationTile } from '@/components/StationTile'
import { cn } from '@/lib/utils'
import { ADMISSION_WINDOW_SECONDS, STATIONS } from '@/simulation/config'
import { clockText, traceShare, type StageFrame, type TrackFrame } from './frames'

/**
 * The one stage of the story: three station tiles in a row and a slim track beneath them. The
 * track replaces the old floating notes. It holds the step in one fixed place: the traced order
 * moving between stops, or the ten-minute rush clock, and one short caption.
 *
 * Motion ownership: tiles are CSS-only (StationTile). The traced order's position is written by
 * the parent's GSAP scroll handler to [data-trace-x] as a transform. The clock fill is a CSS
 * transform transition on [data-clock-fill]. Captions cross-fade by remounting on new text.
 */
export const StoryStage = memo(function StoryStage({ frame, tracePosition, phoneCompact = false }: { frame: StageFrame; tracePosition?: number; phoneCompact?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-7">
      <div className="grid w-full gap-4 sm:grid-cols-3 sm:gap-5 wide:gap-7">
        {frame.tiles.map((t, i) => (
          <div
            key={t.id}
            data-tile={t.id}
            aria-hidden={!t.visible || undefined}
            className={cn(
              'transition-[opacity,translate] duration-700 ease-[var(--ease-out)] motion-reduce:transition-none',
              t.visible ? 'opacity-100' : 'pointer-events-none translate-y-6 opacity-0 max-sm:hidden',
              // On phones, a tile the beat is not about steps aside, so the one that matters is alone.
              phoneCompact && t.dim && 'max-sm:hidden',
            )}
          >
            <StationTile
              station={STATIONS[i]}
              waiting={t.waiting}
              inService={t.inService}
              was={t.was}
              chip={t.chip}
              dim={t.dim}
              highlight={t.highlight}
              workers={t.workers}
            />
          </div>
        ))}
      </div>
      {frame.track ? <Track track={frame.track} position={tracePosition} /> : <div aria-hidden="true" className="hidden wide:block wide:h-20" />}
    </div>
  )
})

/* The caption pill carries a denser veil than other glass (bg-white/75): it sits on every room,
   including the deep forest one, and its small text must keep 4.5:1 there. */
function Track({ track, position }: { track: TrackFrame; position?: number }) {
  const clock = track.kind === 'clock'
  const fill = clock ? Math.min(1, track.seconds / ADMISSION_WINDOW_SECONDS) : 0
  return (
    // On wide screens the track always takes the same height, whatever it holds, so the stage above
    // it never changes size between beats.
    <div className="flex flex-col items-center gap-3 wide:h-20" data-track={track.kind}>
      <div aria-hidden="true" className={cn('relative h-6 w-full', track.kind === 'caption' && 'invisible max-wide:hidden')}>
        {track.kind === 'trace' ? (
          <>
            <span className="absolute inset-x-[16.667%] top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current/20" />
            {[0, 1, 2].map((i) => (
              <span key={i} className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current/35" style={{ left: `${traceShare(i) * 100}%` }} />
            ))}
            {/* With no position given, the parent's scroll handler owns this transform. */}
            <span
              data-trace-x
              className="absolute inset-0 will-change-transform"
              style={position === undefined ? undefined : { transform: `translateX(${traceShare(position) * 100}%)` }}
            >
              <span className="absolute left-0 top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-forest shadow-[0_0_0_6px_rgb(56_98_85/0.18)]">
                <span className="size-2 rounded-full bg-paper" />
              </span>
            </span>
          </>
        ) : clock ? (
          <>
            <span className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-current/15">
              <span
                data-clock-fill
                className="absolute inset-0 origin-left rounded-full bg-queue transition-transform duration-300 ease-[var(--ease-out)]"
                style={{ transform: `scaleX(${fill})` }}
              />
            </span>
          </>
        ) : null}
      </div>
      <p className="glass flex min-h-11 items-center gap-3 rounded-full bg-white/75 px-5 py-2 text-center text-[0.95rem] font-medium text-ink wide:whitespace-nowrap">
        {clock ? (
          <span className="display text-lg tabular" data-clock>
            {clockText(track.seconds)}
          </span>
        ) : null}
        <span key={track.caption} className="animate-in fade-in-0 duration-300 motion-reduce:animate-none">
          {track.caption}
        </span>
      </p>
    </div>
  )
}
