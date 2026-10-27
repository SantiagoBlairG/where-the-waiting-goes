/** Isometric projection shared by all line illustrations (one projection, one light direction). */
const COS = Math.cos(Math.PI / 6)
const SIN = 0.5
export const UNIT = 12

export type Origin = { ox: number; oy: number }

export function project(x: number, y: number, z: number, { ox, oy }: Origin): [number, number] {
  return [ox + (x - y) * COS * UNIT, oy + (x + y) * SIN * UNIT - z * UNIT]
}
