import HL from './kernel.js'
import type { FigureMount } from './HairlineFigure'
import type { StationFigureState } from './figures'

/**
 * Make drinks: an espresso machine and grinder on a counter, with a ticket rail along the
 * front. Every waiting order is one ticket standing on the rail (up to nine), so the queue is
 * visible as geometry. While a drink is being made the group head lowers over the cup and the
 * cup takes the bright stroke; otherwise the group head carries it.
 *
 * Motion ownership: this figure's springs and tweens own every path in its svg.
 */
const { Cam, facing, fit, prism, proj, rings, unproj, spring, stepS, tween, tset, tval, tdone, mk, put, register, pointer, disposer, solid } = HL

const MAX_TICKETS = 9

export const mountEspresso: FigureMount<StationFigureState> = ({ stage, svg }, initial) => {
  const bag = disposer()
  const C = Cam(45, 0.5, 2.3)
  fit(C, [[0, 0, 0], [112, 0, 0], [0, 54, 0], [112, 54, 0], [0, 0, 74], [112, 0, 74]], 200, 172)
  const P = proj(C)
  const front = facing(C)

  let queue = initial.queue
  let serving = initial.inService > 0
  let hover = false
  const lower = spring(0, { eps: 0.002 })

  const g = mk('g', {}, svg)
  const part = (x0: number, y0: number, x1: number, y1: number, r: number, b: number, z0: number, z1: number) => {
    const el = solid(g)
    const [ring, inner] = rings(x0, y0, x1, y1, r, b)
    put(el, prism(P, front, ring, inner, z0, z1))
    return el
  }

  part(0, 0, 112, 54, 9, 2.2, 0, 26) // counter
  part(10, 6, 66, 38, 7, 1.8, 26, 64) // machine body
  part(78, 8, 98, 28, 10, 2, 26, 50) // grinder base
  part(82, 12, 94, 24, 6, 1.4, 50, 72) // hopper
  part(18, 36, 48, 58, 3, 1, 26, 27.6) // drip tray
  const cup = part(27, 41, 39, 53, 6, 1.4, 27.6, 36.4)
  const head = solid(g)

  // Ticket rail: one ticket per waiting order, standing along the front of the counter.
  const tickets = Array.from({ length: MAX_TICKETS }, (_, i) => {
    const x = 56 + i * 5.2
    const [ring, inner] = rings(x, 40, x + 2.6, 52, 0.9, 0.35)
    return { ring, inner, tw: tween(0), el: solid(g), drawn: NaN }
  })

  let drawnLower = NaN
  const drawHead = () => {
    const dz = lower.x * 4
    if (dz === drawnLower) return
    drawnLower = dz
    const [ring, inner] = rings(25, 37, 41, 45, 3.2, 1)
    put(head, prism(P, front, ring, inner, 41 - dz, 53 - dz))
  }
  const highlight = () => {
    const active = serving || hover
    head.sil.classList.toggle('hi', !active)
    cup.sil.classList.toggle('hi', active)
  }

  const retargetTickets = (now: number) => {
    tickets.forEach((t, i) => tset(t.tw, i < queue ? 1 : 0, now, i * 45))
  }

  const frame = register(stage, (dt: number, now: number) => {
    let moving = false
    if (stepS(lower, dt)) moving = true
    drawHead()
    for (const t of tickets) {
      const v = tval(t.tw, now)
      if (!tdone(t.tw, now)) moving = true
      const h = v < 0.01 ? 0 : 2 + v * 13
      if (h === t.drawn) continue
      t.drawn = h
      if (h === 0) {
        t.el.sil.setAttribute('d', '')
        t.el.cr.setAttribute('d', '')
      } else put(t.el, prism(P, front, t.ring, t.inner, 26, 26 + h))
    }
    return moving
  })
  bag.add(frame.unregister)

  const retarget = () => {
    lower.t = serving || hover ? 1 : 0
    highlight()
    frame.wake()
  }

  bag.add(
    pointer(stage, {
      move: (p: [number, number]) => {
        const [x, y] = unproj(C, p[0], p[1], 0)
        hover = x > -8 && x < 120 && y > -8 && y < 62
        retarget()
      },
      leave: () => {
        hover = false
        retarget()
      },
    }),
  )
  bag.add(() => svg.replaceChildren())

  drawHead()
  retargetTickets(performance.now())
  retarget()

  return {
    set: (state) => {
      queue = Math.min(state.queue, MAX_TICKETS)
      serving = state.inService > 0
      retargetTickets(performance.now())
      retarget()
    },
    destroy: bag.dispose,
  }
}
