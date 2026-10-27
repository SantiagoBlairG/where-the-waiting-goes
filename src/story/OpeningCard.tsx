import { memo } from 'react'
import { OrderDot } from '@/components/OrderDot'
import { HairlineFigure } from '@/illustrations/hairline/HairlineFigure'
import { mountRegister } from '@/illustrations/hairline/registerFigure'
import { IsoCylinder, IsoFigure } from '@/illustrations/iso'
import type { Origin } from '@/illustrations/iso-math'
import { cn } from '@/lib/utils'

const idleRegister = { queue: 0, inService: 0 }
const cupOrigin: Origin = { ox: 40, oy: 56 }

/**
 * The opening picture lives inside a card, like every other illustration on the page, so the
 * line drawing sits on a soft pad instead of floating on the room's color.
 */
export const OpeningCard = memo(function OpeningCard({ className }: { className?: string }) {
  return (
    <div className={cn('ticket-shadow shrink-0', className)}>
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-card bg-paper p-5 text-ink">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-forest" />
        <div className="flex items-center justify-between pt-2">
          <span className="display text-[3.4rem] leading-[0.85] text-forest tabular">8:45</span>
          <span className="inline-flex items-center gap-2.5 rounded-full bg-active-tint px-4 py-2 text-sm font-semibold text-forest">
            <OrderDot state="service" />
            Your order
          </span>
        </div>
        <div className="relative overflow-hidden rounded-[20px] bg-[#d5e6dc]">
          <HairlineFigure
            mount={mountRegister}
            state={idleRegister}
            label="A café counter with a cash register, a card reader and a receipt slot"
            className="relative z-[1] mx-auto w-full max-w-[420px]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-x-[16%] bottom-[8%] h-[9%] bg-[radial-gradient(closest-side,rgb(27_38_34/0.2),transparent)]"
          />
          <IsoFigure label="A cup of coffee with a lid, steaming" viewBox="0 0 80 90" className="absolute bottom-3 right-4 z-[2] h-auto w-[15%] text-ink">
            <IsoCylinder origin={cupOrigin} x={0} y={0} z={0} r={1.1} h={2.4} lid />
            <g stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" vectorEffect="non-scaling-stroke">
              <path d="M 34 24 q -4 -5 0 -10 q 4 -5 0 -10" />
              <path d="M 46 26 q -4 -5 0 -10 q 4 -5 0 -10" />
            </g>
          </IsoFigure>
        </div>
      </div>
    </div>
  )
})
