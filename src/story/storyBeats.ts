import { ARRIVAL_INTERVAL_SECONDS, ORDER_COUNT, STATIONS, capacityPerMinute } from '@/simulation/config'
import { baselineAtClose, cashierAtClose } from './storySnapshots'

/**
 * The story beats: the exact copy and what the stage shows.
 * Every number in the copy is read from the model (config and storySnapshots), never typed in.
 * In `support`, **double asterisks** mark the key words, shown in bold (see RichText).
 */
export type BeatId = 'familiar' | 'three-stops' | 'rush' | 'fix' | 'surprise' | 'reveal' | 'pickup' | 'your-turn'

export type Beat = {
  id: BeatId
  headline: string
  /** Words in the headline set in the italic serif. */
  accent?: string
  support?: string
  /** What the stage shows, for people who cannot see it. */
  stageDescription: string
}

const [order, drinks, pickup] = STATIONS
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const say = (n: number) => words[n] ?? String(n)
const minutes = (ORDER_COUNT * ARRIVAL_INTERVAL_SECONDS) / 60
const q = (snap: typeof baselineAtClose, i: number) => snap.stations[i].queue
const moreThan = (d: number) => (d === 0 ? 'the same as' : d === 1 ? 'just one more than' : `${say(Math.abs(d))} ${d > 0 ? 'more' : 'fewer'} than`)

export const beats: readonly Beat[] = [
  {
    id: 'familiar',
    headline: 'If ordering gets faster, why doesn’t your coffee?',
    accent: 'coffee?',
    support: `8:45, a quick coffee before work. Follow **one order**, yours, from the moment you walk in to the moment the cup is in your hand.`,
    stageDescription: 'Your order waits at the café counter, the first of three stops.',
  },
  {
    id: 'three-stops',
    headline: 'Order. Make. Pick up.',
    accent: 'Pick up.',
    support: `Every order makes the **same three stops**: you **order and pay** (about ${order.serviceSeconds} s), a barista **makes the drink** (about ${drinks.serviceSeconds} s), then it is **handed over** (about ${pickup.serviceSeconds} s). Times vary: a card is quicker than a question, an espresso quicker than a latte. One worker at each stop.`,
    stageDescription: `Three stations in a row: Order and pay, Make drinks, Pick up. Your order moves from one to the next. They take about ${order.serviceSeconds}, ${drinks.serviceSeconds} and ${pickup.serviceSeconds} seconds on average.`,
  },
  {
    id: 'rush',
    headline: 'Now the morning rush arrives.',
    accent: 'rush',
    support: `**${ORDER_COUNT} customers** in ${say(minutes)} minutes: **one every ${ARRIVAL_INTERVAL_SECONDS} seconds**. The register needs about ${order.serviceSeconds} and the barista about ${drinks.serviceSeconds}, so both fall behind and **lines start to grow**.`,
    stageDescription: `The rush clock runs from 0:00 to 10:00. Lines grow at Order and pay and at Make drinks; Pick up has a short line now and then. At 10:00, ${baselineAtClose.completed} coffees are handed over and ${baselineAtClose.inShop} customers are still waiting.`,
  },
  {
    id: 'fix',
    headline: 'Put another person on the register.',
    accent: 'register.',
    support: `The obvious fix: replay the **same rush** with a **second cashier**. Orders are taken twice as fast, and the **line at the register is gone**.`,
    stageDescription: `The same rush with an extra cashier, at 10:00. Customers in line at Order and pay: ${q(cashierAtClose, 0)}, down from ${q(baselineAtClose, 0)}.`,
  },
  {
    id: 'surprise',
    headline: 'Ordering is faster. Your coffee isn’t.',
    accent: 'isn’t.',
    support: `By 10:00 the café with two cashiers has handed over **${cashierAtClose.completed} coffees**, ${moreThan(cashierAtClose.completed - baselineAtClose.completed)} ${baselineAtClose.completed}. But **${q(cashierAtClose, 1)} drinks** now wait at the barista, up from ${q(baselineAtClose, 1)}. The wait did not disappear.`,
    stageDescription: `Make drinks is highlighted: ${q(cashierAtClose, 1)} drinks waiting, up from ${q(baselineAtClose, 1)}. Coffees handed over: ${cashierAtClose.completed} with two cashiers, ${baselineAtClose.completed} without.`,
  },
  {
    id: 'reveal',
    headline: 'We didn’t remove the wait. We moved it.',
    accent: 'moved it.',
    support: `One barista makes **${fmt(capacityPerMinute(drinks, 1))} drinks a minute**, however fast orders come in. The slowest step is the **bottleneck**: it sets the pace for **every order** behind it.`,
    stageDescription: `Make drinks is highlighted: capacity ${fmt(capacityPerMinute(drinks, 1))} drinks a minute, ${q(cashierAtClose, 1)} drinks waiting.`,
  },
  {
    id: 'pickup',
    headline: 'And pickup? Only the odd hiccup.',
    accent: 'hiccup.',
    support: `Most handovers take seconds, but now and then one takes much longer: a name called twice, a missing lid. Then a **short line** forms. On average one worker keeps up, **${fmt(capacityPerMinute(pickup, 1))} a minute**, as many as arrive, and drinks only reach pickup as fast as they are made.`,
    stageDescription: `Pick up is highlighted: one worker, ${q(baselineAtClose, 2)} drink waiting, one being handed over. On average it hands over ${fmt(capacityPerMinute(pickup, 1))} a minute.`,
  },
  {
    id: 'your-turn',
    headline: 'Where would you put the extra person?',
    accent: 'extra person?',
    support: 'Your turn. You have **one extra worker**: the register, the drinks or pickup. Replay the **same rush** and see where the waiting goes.',
    stageDescription: 'The same three stations, back at the start of the rush, ready for your experiment.',
  },
]

export const MODEL_LABEL = 'A simplified coffee-shop simulation'
export const SAME_RUSH_LABEL = 'Same 30 orders. Same 10 minutes.'

/** Copy without the bold markers, for places that take plain text. */
export const plain = (text: string) => text.replaceAll('**', '')
