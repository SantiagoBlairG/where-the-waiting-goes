import HL from './kernel.js'
import type { FigureMount } from './HairlineFigure'

/**
 * Walk-in: the opening of the story. A doorway on the left, three stepping stones (the three
 * stops every order makes) and a lidded cup waiting on a small counter at the end. At rest the
 * stones sit at uneven heights and the cup carries the one bright stroke: the destination. The
 * stone under the pointer rises, its neighbours a little less, and the bright stroke moves to it.
 *
 * Hairline rules leaned on: 01 (picks by each stone's rest centre), 03 (lift clamped),
 * 04 (one bright mark), 05 (designed rest), 09 (rounded solids).
 * Motion ownership: this figure's springs own every path in its svg.
 */
const { Cam, clamp, facing, fit, prism, proj, rings, unproj, spring, stepS, mk, put, register, pointer, disposer, solid } = HL

const STONES = [50, 92, 134] // centre x of each stop
const SIZE = 15 // half the side of a stone
const REST = [3.5, 6.5, 4.5] // uneven rest heights: the path is walked, not printed
const LIFT = 9

const falloff = (d: number) => (d === 0 ? 1 : d === 1 ? 0.3 : 0)

export const mountWalkIn: FigureMount<null> = ({ stage, svg, read }) => {
  const bag = disposer()
  const C = Cam(45, 0.5, 1.95)
  // The most extreme pose: the door's lintel and a fully lifted stone.
  fit(C, [[0, 0, 0], [206, 0, 0], [0, 58, 0], [206, 58, 0], [0, 0, 78], [206, 58, 40]], 200, 160)
  const P = proj(C)
  const front = facing(C)

  const g = mk('g', {}, svg)
  const part = (x0: number, y0: number, x1: number, y1: number, r: number, b: number, z0: number, z1: number) => {
    const el = solid(g)
    const [ring, inner] = rings(x0, y0, x1, y1, r, b)
    put(el, prism(P, front, ring, inner, z0, z1))
    return el
  }

  // Back to front, by x + y: the floor, the doorway, the stones, the counter, the cup.
  part(0, 0, 206, 58, 12, 2.2, 0, 5) // floor
  part(6, 6, 18, 13, 2, 0.8, 5, 74) // far door post
  part(6, 6, 18, 52, 3, 1, 70, 78) // lintel
  part(6, 45, 18, 52, 2, 0.8, 5, 74) // near door post

  let over: number | null = null
  const stones = STONES.map((cx, i) => ({
    cx,
    ring: rings(cx - SIZE, 29 - SIZE, cx + SIZE, 29 + SIZE, 5, 1.4),
    sp: spring(REST[i], { eps: 0.002 }),
    el: solid(g),
    drawn: NaN,
  }))

  part(160, 10, 200, 48, 7, 1.8, 5, 30) // counter
  const [cupRing, cupInner] = rings(172, 21, 188, 37, 8, 1.4)
  const [lidRing, lidInner] = rings(171, 20, 189, 38, 9, 1.2)
  const cup = solid(g)
  put(cup, prism(P, front, cupRing, cupInner, 30, 50))
  const lid = solid(g)
  put(lid, prism(P, front, lidRing, lidInner, 50, 54))

  const highlight = () => {
    stones.forEach((s, i) => s.el.sil.classList.toggle('hi', i === over))
    cup.sil.classList.toggle('hi', over === null)
    lid.sil.classList.toggle('hi', over === null)
  }

  const frame = register(stage, (dt: number) => {
    let moving = false
    for (const s of stones) {
      if (stepS(s.sp, dt)) moving = true
      const h = s.sp.x
      if (h === s.drawn) continue
      s.drawn = h
      put(s.el, prism(P, front, s.ring[0], s.ring[1], 5, 5 + h))
    }
    return moving
  })
  bag.add(frame.unregister)

  const retarget = () => {
    stones.forEach((s, i) => {
      const near = over === null ? 0 : LIFT * falloff(Math.abs(i - over))
      s.sp.t = clamp(REST[i] + near, 0, REST[i] + LIFT)
    })
    read.textContent = over === null ? 'rest' : `stop ${over + 1}`
    highlight()
    frame.wake()
  }

  bag.add(
    pointer(stage, {
      move: (p: [number, number]) => {
        // Rule 01: the floor plane never moves; pick the stone whose rest centre is nearest.
        const [x, y] = unproj(C, p[0], p[1], 5)
        if (y < -8 || y > 66 || x < 28 || x > 156) over = null
        else over = STONES.reduce((best, cx, i) => (Math.abs(x - cx) < Math.abs(x - STONES[best]) ? i : best), 0)
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

  return { set: () => {}, destroy: bag.dispose }
}
