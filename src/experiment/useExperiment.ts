import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PresetId } from '@/simulation/presets'
import type { ExtraPlacement, OrderRecord, Snapshot } from '@/simulation/types'
import { placementLabel } from './helpers'
import { ExperimentSession, type RunMode, type Speed } from './session'

export type ExperimentView = {
  mode: RunMode
  label: string
  presetId: PresetId
  custom: boolean
  speed: Speed
  snapshot: Snapshot
  /** Where the extra worker is headed (a pending move counts as the choice). */
  requested: ExtraPlacement
}

function read(s: ExperimentSession): ExperimentView {
  return {
    mode: s.mode,
    label: s.label,
    presetId: s.presetId,
    custom: s.custom,
    speed: s.speed,
    snapshot: s.snapshot(),
    requested: s.requestedPlacement,
  }
}

/** Re-render only when something the screen shows has changed (the clock counts whole seconds). */
function signature(v: ExperimentView): string {
  const { snapshot: sn } = v
  return [v.mode, v.label, v.speed, v.requested, Math.floor(sn.timeMs / 1000), sn.completed, JSON.stringify(sn.stations), JSON.stringify(sn.extraWorker)].join('|')
}

/**
 * React controller around ExperimentSession. The session owns the rules; this hook feeds it
 * animation frames while it is running, pauses it when the tab is hidden (with no catch-up when
 * the visitor returns), and turns changes into renders.
 */
export function useExperiment() {
  const [session] = useState(() => new ExperimentSession())
  const [view, setView] = useState(() => read(session))
  const lastSignature = useRef(signature(view))
  const [announcement, setAnnouncement] = useState('')

  const sync = useCallback(() => {
    const next = read(session)
    const sig = signature(next)
    if (sig !== lastSignature.current) {
      lastSignature.current = sig
      setView(next)
    }
  }, [session])

  // Frame loop: only while running.
  useEffect(() => {
    if (view.mode !== 'running') return
    let raf = 0
    let last = 0
    const frame = (t: number) => {
      if (last && session.tick(t - last)) sync()
      last = t
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [view.mode, sync, session])

  // A hidden tab pauses and stays paused until Play: there is no catch-up on return.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        session.pause()
        sync()
      }
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [sync, session])

  const actions = useMemo(
    () => ({
      play: () => {
        session.play()
        sync()
      },
      pause: () => {
        session.pause()
        sync()
      },
      restart: () => {
        session.restart()
        setAnnouncement('Rush restarted from the beginning, paused.')
        sync()
      },
      select: (id: PresetId) => {
        session.selectPreset(id)
        setAnnouncement(`${session.label} selected. The rush restarts from the beginning, paused.`)
        sync()
      },
      setSpeed: (speed: Speed) => {
        session.setSpeed(speed)
        sync()
      },
      assign: (target: ExtraPlacement) => {
        session.assignExtra(target)
        const snap = session.snapshot().extraWorker
        const name = placementLabel(target)
        setAnnouncement(
          snap.pending
            ? `Finishing this order, then moving the extra worker to ${name}.`
            : target === 'off'
              ? 'Extra worker is off duty.'
              : `Extra worker assigned to ${name}.`,
        )
        sync()
      },
      hold: (reason: string) => {
        session.hold(reason)
        sync()
      },
      release: (reason: string) => {
        session.release(reason)
        sync()
      },
      /** The order history so far, read at the moment it is needed (dialogs, averages). */
      orders: (): readonly OrderRecord[] => session.orders,
    }),
    [sync, session],
  )

  return { view, announcement, actions }
}
