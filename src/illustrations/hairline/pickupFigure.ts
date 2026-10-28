import HL from './kernel.js'
import type { FigureMount } from './HairlineFigure'
import type { StationFigureState } from './figures'

/**
 * Pick up: a shelf of five lidded cups. The cup under the pointer lifts and its neighbours
 * follow by distance. A cup being handed over lifts on its own and takes the bright stroke.
 * At rest the middle cup carries it.
 *
 * Motion ownership: this figure's springs own every path in its svg.
 */
const { Cam, clamp, facing, fit, prism, proj, rings, unproj, spring, stepS, mk, put, register, pointer, disposer, solid } = HL

const CUPS = 5
const LIFT = 11
const STEP = 21

/** Share of full lift at `d` cups away from the one chosen. */
const falloff = (d: number) => (d === 0 ? 1 : d === 1 ? 0.34 : d === 2 ? 0.1 : 0)

export const mountPickup: FigureMount<StationFigureState> = ({ stage, svg }, initial) => {
  const bag = disposer()
  const C = Cam(45, 0.5, 2.45)
  fit(C, [[0, 0, 0], [112, 0, 0], [0, 40, 0], [112, 40, 0], [0, 0, 60], [112, 0, 60]], 200, 132)
  const P = proj(C)
  const front = facing(C)

  let handedOver = Math.min(initial.inService, 1)
  let over: number | null = null

  const g = mk('g', {}, svg)
  const plate = (x0: number, y0: number, x1: number, y1: number, r: number, b: number, z0: number, z1: number) => {
    const el = solid(g)
    const [ring, inner] = rings(x0, y0, x1, y1, r, b)
    put(el, prism(P, front, ring, inner, z0, z1))
    return el
  }
  plate(0, 0, 112, 40, 9, 2.2, 0, 22)
  plate(5, 5, 107, 35, 5, 1.4, 22, 25)

  const cups = Array.from({ length: CUPS }, (_, i) => {
    const cx = 15 + i * STEP
    const body = rings(cx - 6, 14, cx + 6, 26, 6, 1.4)
    const lid = rings(cx - 6.8, 13.2, cx + 6.8, 26.8, 6.8, 1.2)
    return { cx, body, lid, sp: spring(0, { eps: 0.002 }), cup: solid(g), top: solid(g), drawn: NaN }
  })
  const rest = Math.floor(CUPS / 2)

  const highlight = () => {
    const chosen = over ?? (handedOver ? 0 : rest)
    cups.forEach((c, i) => {
      const on = i === chosen
      c.cup.sil.classList.toggle('hi', on)
      c.top.sil.classList.toggle('hi', on)
    })
  }

  const frame = register(stage, (dt: number) => {
    let moving = false
    for (const c of cups) {
      if (stepS(c.sp, dt)) moving = true
      const l = c.sp.x
      if (l === c.drawn) continue
      c.drawn = l
      put(c.cup, prism(P, front, c.body[0], c.body[1], 25 + l, 39 + l))
      put(c.top, prism(P, front, c.lid[0], c.lid[1], 39 + l, 42 + l))
    }
    return moving
  })
  bag.add(frame.unregister)

  const retarget = () => {
    cups.forEach((c, i) => {
      const chosen = over ?? (handedOver ? 0 : null)
      const own = handedOver && i === 0 ? LIFT * 0.8 : 0
      const near = chosen === null ? 0 : LIFT * falloff(Math.abs(i - chosen))
      c.sp.t = Math.max(own, near)
    })
    highlight()
    frame.wake()
  }

  bag.add(
    pointer(stage, {
      move: (p: [number, number]) => {
        const [x, y] = unproj(C, p[0], p[1], 0)
        if (y < -10 || y > 50 || x < -10 || x > 122) {
          over = null
        } else {
          over = clamp(Math.round((x - 15) / STEP), 0, CUPS - 1)
        }
        retarget()
      },
      leave: () => {
        over = null
        retarget()
      },
    }),
  )
  bag.add(() => svg.replaceChildren())
  retarget()
  cups.forEach((c) => {
    c.drawn = NaN
  })

  return {
    set: (state) => {
      handedOver = Math.min(state.inService, 1)
      retarget()
    },
    destroy: bag.dispose,
  }
}
