import { IsoBox, IsoCylinder, IsoFigure } from './iso'
import { project, type Origin } from './iso-math'

const origin: Origin = { ox: 60, oy: 52 }

export function EspressoStation({ className }: { className?: string }) {
  const [sx, sy] = project(1.6, 1.8, 4.6, origin)
  return (
    <IsoFigure label="An espresso machine and grinder on a counter" viewBox="0 0 170 120" className={className}>
      <IsoBox origin={origin} x={0} y={0} z={0} w={7} d={3.4} h={1.6} />
      <IsoBox origin={origin} x={0.7} y={0.5} z={1.6} w={3.8} d={2.2} h={2.6} />
      <IsoBox origin={origin} x={1.1} y={2.7} z={2.1} w={1.2} d={0.5} h={0.5} />
      <IsoCylinder origin={origin} x={1.7} y={3.1} z={1.6} r={0.45} h={0.5} />
      <IsoCylinder origin={origin} x={5.7} y={1.6} z={1.6} r={0.75} h={1.9} />
      <IsoCylinder origin={origin} x={5.7} y={1.6} z={3.5} r={0.45} h={0.9} />
      <g aria-hidden="true" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <path d={`M ${sx} ${sy - 2} q -4 -5 0 -10 q 4 -5 0 -10`} />
        <path d={`M ${sx + 8} ${sy} q -4 -5 0 -10 q 4 -5 0 -10`} />
      </g>
    </IsoFigure>
  )
}
