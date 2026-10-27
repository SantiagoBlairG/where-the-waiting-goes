import { IsoBox, IsoFigure } from './iso'
import { type Origin } from './iso-math'

const origin: Origin = { ox: 64, oy: 50 }

export function Register({ className }: { className?: string }) {
  return (
    <IsoFigure label="A café counter with a cash register and card reader" viewBox="0 0 170 120" className={className}>
      <IsoBox origin={origin} x={0} y={0} z={0} w={7} d={3} h={2.6} />
      <IsoBox origin={origin} x={4.2} y={0.5} z={2.6} w={2.2} d={1.8} h={0.9} />
      <IsoBox origin={origin} x={4.4} y={0.7} z={3.5} w={1.8} d={0.2} h={1.3} />
      <IsoBox origin={origin} x={1.2} y={1.2} z={2.6} w={1.1} d={0.8} h={0.35} />
    </IsoFigure>
  )
}
