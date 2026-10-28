import HL from './kernel.js'
import type { FigureMount } from './HairlineFigure'
import type { StationFigureState } from './figures'

/**
 * Order & pay: a counter with a cash register, a card reader and a receipt slot.
 * The cash drawer slides out while an order is being taken, or when the pointer is over
 * the counter. A receipt prints while serving. At rest the screen carries the one bright stroke.
 *
 * Motion ownership: this figure's springs own every path in its svg.
 */
const { Cam, facing, fit, prism, proj, rings, unproj, spring, stepS, mk, put, register, pointer, disposer, solid } = HL

export const mountRegister: FigureMount<StationFigureState> = ({ stage, svg }, initial) => {
  const bag = disposer()
  const C = Cam(45, 0.5, 2.35)
  fit(C, [[0, 0, 0], [122, 0, 0], [0, 50, 0], [122, 50, 0], [0, 0, 64], [122, 0, 64]], 200, 150)
  const P = proj(C)
  const front = facing(C)

  let serving = initial.inService > 0
  let hover = false
  const open = spring(0, { eps: 0.002 })
  const receipt = spring(0.12, { eps: 0.002 })

  const g = mk('g', {}, svg)
  const part = (x0: number, y0: number, x1: number, y1: number, r: number, b: number, z0: number, z1: number) => {
    const el = solid(g)
    const [ring, inner] = rings(x0, y0, x1, y1, r, b)
    put(el, prism(P, front, ring, inner, z0, z1))
    return el
  }

  part(0, 0, 122, 50, 9, 2.2, 0, 32) // counter
  part(14, 8, 52, 35, 5, 1.4, 32, 44) // register body
  const screen = part(19, 9, 47, 13.4, 1.6, 0.6, 44, 64) // screen standing at the back
  part(78, 12, 100, 31, 4, 1.2, 32, 37.5) // card reader
  const drawer = solid(g)
  const slip = solid(g)

  let drawnOpen = NaN
  let drawnSlip = NaN
  const drawDrawer = () => {
    const L = 3.2 + open.x * 12
    if (L === drawnOpen) return
    drawnOpen = L
    const [ring, inner] = rings(19, 35, 47, 35 + L, 2, 0.8)
    put(drawer, prism(P, front, ring, inner, 32.6, 38.6))
  }
  const drawSlip = () => {
    const h = 3 + receipt.x * 14
    if (h === drawnSlip) return
    drawnSlip = h
    const [ring, inner] = rings(40, 15, 43.6, 23, 0.9, 0.4)
    put(slip, prism(P, front, ring, inner, 44, 44 + h))
  }
  const highlight = () => {
    const active = serving || hover
    drawer.sil.classList.toggle('hi', active)
    screen.sil.classList.toggle('hi', !active)
  }

  const frame = register(stage, (dt: number) => {
    let moving = false
    if (stepS(open, dt)) moving = true
    if (stepS(receipt, dt)) moving = true
    drawDrawer()
    drawSlip()
    return moving
  })
  bag.add(frame.unregister)

  const retarget = () => {
    open.t = serving || hover ? 1 : 0
    receipt.t = serving ? 1 : 0.12
    highlight()
    frame.wake()
  }

  bag.add(
    pointer(stage, {
      move: (p: [number, number]) => {
        const [x, y] = unproj(C, p[0], p[1], 0)
        hover = x > -8 && x < 130 && y > -8 && y < 58
        retarget()
      },
      leave: () => {
        hover = false
        retarget()
      },
    }),
  )
  bag.add(() => svg.replaceChildren())

  drawDrawer()
  drawSlip()
  retarget()

  return {
    set: (state) => {
      serving = state.inService > 0
      retarget()
    },
    destroy: bag.dispose,
  }
}
