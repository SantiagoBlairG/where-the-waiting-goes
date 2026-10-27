import { IsoBox, IsoCylinder, IsoFigure } from './iso'
import { type Origin } from './iso-math'

const origin: Origin = { ox: 64, oy: 56 }

export function PickupShelf({ className }: { className?: string }) {
  return (
    <IsoFigure label="A pickup shelf holding three lidded coffee cups" viewBox="0 0 170 120" className={className}>
      <IsoBox origin={origin} x={0} y={0} z={0} w={7} d={2.6} h={1.5} />
      <IsoBox origin={origin} x={0.4} y={0.3} z={1.5} w={6.2} d={2} h={0.25} />
      <IsoCylinder origin={origin} x={1.4} y={1.3} z={1.75} r={0.6} h={1.3} lid />
      <IsoCylinder origin={origin} x={3.4} y={1.3} z={1.75} r={0.6} h={1.3} lid />
      <IsoCylinder origin={origin} x={5.4} y={1.3} z={1.75} r={0.6} h={1.3} lid />
    </IsoFigure>
  )
}
