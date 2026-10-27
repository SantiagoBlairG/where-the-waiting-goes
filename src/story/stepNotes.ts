import { ARRIVAL_INTERVAL_SECONDS, ORDER_COUNT, STATIONS, type StationId } from '@/simulation/config'
import type { Snapshot } from '@/simulation/types'

/**
 * Short floating notes that say what is happening at each step of the traced order and of the
 * rush. Every number is read from the model's constants or from the snapshot, never typed in.
 */
export type StepNote = {
  station: StationId
  /** Where, in plain words: "At the register". */
  where: string
  text: string
}

const [order, drinks, pickup] = STATIONS
const WHERE: Record<StationId, string> = { order: 'At the register', drinks: 'At the drinks', pickup: 'At pickup' }

const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
const lastArrivalSeconds = (ORDER_COUNT - 1) * ARRIVAL_INTERVAL_SECONDS

/** Beat 2: one order, three stops. */
export function stopNote(stop: number): StepNote {
  if (stop <= 0)
    return { station: 'order', where: WHERE.order, text: `You place your order and pay. This takes ${order.serviceSeconds} seconds.` }
  if (stop === 1)
    return { station: 'drinks', where: WHERE.drinks, text: `A barista makes your drink. This takes ${drinks.serviceSeconds} seconds.` }
  return { station: 'pickup', where: WHERE.pickup, text: `Your drink is handed over. This takes ${pickup.serviceSeconds} seconds.` }
}

/** Beat 3: the rush, one note per phase of the clock. */
export function rushNote(snapshot: Snapshot): StepNote {
  const t = snapshot.timeSeconds
  if (t < ARRIVAL_INTERVAL_SECONDS)
    return { station: 'order', where: WHERE.order, text: `The first order arrives. The cashier needs ${order.serviceSeconds} seconds to finish it.` }
  if (t < 80)
    return {
      station: 'order',
      where: WHERE.order,
      text: `A new order arrives every ${ARRIVAL_INTERVAL_SECONDS} seconds, but the cashier needs ${order.serviceSeconds}. A line starts at the register.`,
    }
  if (t < 200)
    return {
      station: 'drinks',
      where: WHERE.drinks,
      text: `Each drink takes ${drinks.serviceSeconds} seconds, so orders now start to wait for coffee too.`,
    }
  if (t < 300)
    return {
      station: 'pickup',
      where: WHERE.pickup,
      text: `Handing over a drink takes only ${pickup.serviceSeconds} seconds. Nobody waits here.`,
    }
  if (t < 480)
    return {
      station: 'drinks',
      where: WHERE.drinks,
      text: 'Orders arrive faster than the register and the drinks can finish them, so both lines keep growing.',
    }
  if (t < 600)
    return { station: 'order', where: WHERE.order, text: `The last order arrives at ${mmss(lastArrivalSeconds)}. No one new joins after this.` }
  return {
    station: 'drinks',
    where: WHERE.drinks,
    text: `Ten minutes in: ${snapshot.completed} orders are picked up and ${snapshot.inShop} are still in the shop.`,
  }
}
