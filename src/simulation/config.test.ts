import { expect, it } from 'vitest'
import { STATIONS, capacityPerMinute } from './config'

const [order, drinks, pickup] = STATIONS

it('computes capacity as workers x 60 / service seconds', () => {
  expect(capacityPerMinute(order, 1)).toBe(2.5)
  expect(capacityPerMinute(drinks, 1)).toBe(2)
  expect(capacityPerMinute(drinks, 2)).toBe(4)
  expect(capacityPerMinute(pickup, 1)).toBe(3)
})

it('keeps the three stations in process order', () => {
  expect(STATIONS.map((s) => s.name)).toEqual(['Order & pay', 'Make drinks', 'Pick up'])
})
