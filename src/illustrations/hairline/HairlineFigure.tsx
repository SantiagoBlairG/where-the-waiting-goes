import { useEffect, useRef } from 'react'
import HL from './kernel.js'

/**
 * What a figure needs from the host: the stage element, its svg, and a read-out that we
 * ignore (names live in the card, never inside the drawing; Hairline rule 10).
 */
export type FigureHost = { stage: HTMLElement; svg: SVGSVGElement; read: { textContent: string } }
export type FigureHandle<S> = { set: (state: S) => void; destroy: () => void }
export type FigureMount<S> = (host: FigureHost, state: S) => FigureHandle<S>

type Props<S> = {
  mount: FigureMount<S>
  /** Live simulation state for this station. Updating it retargets the figure's springs. */
  state: S
  /** Text equivalent of the drawing. */
  label: string
  className?: string
}

/**
 * Mounts one Hairline-style figure into a div and keeps it in sync with state.
 * Motion ownership: the figure's own springs and tweens (Hairline's frame loop) write
 * every transform inside the svg. Outer wrappers belong to GSAP or CSS, never both.
 */
export function HairlineFigure<S>({ mount, state, label, className }: Props<S>) {
  const ref = useRef<HTMLDivElement>(null)
  const handle = useRef<FigureHandle<S> | null>(null)
  const latest = useRef(state)

  // Declared first so the mount effect below always reads the newest state.
  useEffect(() => {
    latest.current = state
  })

  useEffect(() => {
    const stage = ref.current
    if (!stage) return
    HL.inject(document)
    const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage) as SVGSVGElement
    const read = { textContent: '' }
    handle.current = mount({ stage, svg, read }, latest.current)
    return () => {
      handle.current?.destroy()
      handle.current = null
      stage.replaceChildren()
    }
  }, [mount])

  useEffect(() => {
    handle.current?.set(state)
  }, [state])

  return <div ref={ref} data-hairline="coffee" role="img" aria-label={label} className={className} />
}
