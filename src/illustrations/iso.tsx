import type { ReactNode } from 'react'
import { UNIT, project, type Origin } from './iso-math'

/**
 * Tiny isometric helpers shared by every coffee-shop line illustration, so all
 * pieces use one projection, one stroke weight and one light direction
 * (light from the upper left: the right-hand face carries a faint tint).
 *
 * Motion ownership: illustrations here are static. Any inner-group animation
 * added later is owned by the illustration, never by GSAP's outer transforms.
 */
function polygon(points: [number, number][]): string {
  return points.map(([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`).join(' ')
}

const lineProps = {
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
  vectorEffect: 'non-scaling-stroke',
} as const

const SURFACE = 'var(--wg-surface)'
const SHADE = 'color-mix(in srgb, var(--wg-ink) 6%, var(--wg-surface))'

type BoxProps = {
  origin: Origin
  x: number
  y: number
  z: number
  w: number
  d: number
  h: number
  shade?: string
}

export function IsoBox({ origin, x, y, z, w, d, h, shade = SHADE }: BoxProps) {
  const p = (px: number, py: number, pz: number) => project(px, py, pz, origin)
  const top = polygon([p(x, y, z + h), p(x + w, y, z + h), p(x + w, y + d, z + h), p(x, y + d, z + h)])
  const left = polygon([p(x, y + d, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x, y + d, z + h)])
  const right = polygon([p(x + w, y, z), p(x + w, y + d, z), p(x + w, y + d, z + h), p(x + w, y, z + h)])
  return (
    <g>
      <polygon points={left} fill={SURFACE} {...lineProps} />
      <polygon points={right} fill={shade} {...lineProps} />
      <polygon points={top} fill={SURFACE} {...lineProps} />
    </g>
  )
}

type CylinderProps = { origin: Origin; x: number; y: number; z: number; r: number; h: number; lid?: boolean }

export function IsoCylinder({ origin, x, y, z, r, h, lid = false }: CylinderProps) {
  const [cx, cyBottom] = project(x, y, z, origin)
  const [, cyTop] = project(x, y, z + h, origin)
  const rx = 1.2247 * r * UNIT
  const ry = 0.7071 * r * UNIT
  const body = `M ${cx - rx} ${cyTop} L ${cx - rx} ${cyBottom} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cyBottom} L ${cx + rx} ${cyTop}`
  return (
    <g>
      <path d={body} fill={SURFACE} {...lineProps} />
      <ellipse cx={cx} cy={cyTop} rx={rx} ry={ry} fill={SURFACE} {...lineProps} />
      {lid ? <ellipse cx={cx} cy={cyTop} rx={rx * 0.62} ry={ry * 0.62} fill="none" {...lineProps} /> : null}
    </g>
  )
}

type FigureProps = { label: string; viewBox: string; children: ReactNode; className?: string }

/** Wrapper that gives each illustration its text equivalent. */
export function IsoFigure({ label, viewBox, children, className }: FigureProps) {
  return (
    <svg role="img" aria-label={label} viewBox={viewBox} className={className} fill="none">
      {children}
    </svg>
  )
}
