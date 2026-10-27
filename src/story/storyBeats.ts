/**
 * The seven story beats: the exact copy and what the stage shows.
 * Numbers in the copy come from the model (see storySnapshots.ts and docs/simulation.md).
 * Keep each beat to a headline and at most one supporting sentence (plan.md §7).
 */
export type BeatId = 'familiar' | 'three-stops' | 'rush' | 'fix' | 'surprise' | 'reveal' | 'your-turn'

export type Beat = {
  id: BeatId
  headline: string
  /** Words in the headline set in the italic serif. */
  accent?: string
  support?: string
  /** What the stage shows, for people who cannot see it. */
  stageDescription: string
}

export const beats: readonly Beat[] = [
  {
    id: 'familiar',
    headline: 'If ordering gets faster, why doesn’t your coffee?',
    accent: 'coffee?',
    support: '8:45. A quick coffee before work.',
    stageDescription: 'One order dot waits at a café counter. A cup of coffee steams nearby.',
  },
  {
    id: 'three-stops',
    headline: 'Order. Make. Pick up.',
    accent: 'Pick up.',
    support: 'Every order makes the same three stops, in the same order.',
    stageDescription:
      'Three stations in a row: Order and pay, Make drinks, Pick up. One order dot is at the first station, with the next two stops ahead of it.',
  },
  {
    id: 'rush',
    headline: 'Now the morning rush arrives.',
    accent: 'rush',
    support:
      'Thirty orders in ten minutes. One person at each stop, and orders arrive faster than they can be finished.',
    stageDescription:
      'Five minutes into the rush: 3 orders wait at Order and pay, 2 wait at Make drinks, none wait at Pick up. 8 orders are done and 8 are still inside.',
  },
  {
    id: 'fix',
    headline: 'Put another person on the register.',
    accent: 'register.',
    support: 'Replay the same rush with an extra cashier. The line at the register is gone.',
    stageDescription:
      'Two cafés side by side after ten minutes, same 30 orders. Original team: 4 orders waiting to order. With an extra cashier: none waiting to order.',
  },
  {
    id: 'surprise',
    headline: 'Ordering is faster. Your coffee isn’t.',
    accent: 'isn’t.',
    support: 'Both cafés have handed over 18 drinks. With two cashiers, 9 orders are now waiting for coffee, up from 5.',
    stageDescription:
      'Same two cafés, with the drink counter highlighted. Original team: 5 orders waiting for drinks. With an extra cashier: 9 waiting. Both have 18 picked up and 12 still inside.',
  },
  {
    id: 'reveal',
    headline: 'We didn’t remove the wait. We moved it.',
    accent: 'moved it.',
    support:
      'One barista makes two drinks a minute, however fast orders arrive. That limiting step is the bottleneck.',
    stageDescription:
      'The café with an extra cashier. The Make drinks station is highlighted: capacity 2 orders a minute, 9 orders waiting.',
  },
  {
    id: 'your-turn',
    headline: 'Where would you put the extra person?',
    accent: 'extra person?',
    support: 'Your turn. Start the same rush from the beginning.',
    stageDescription:
      'The same three stations settle into a workspace. One extra worker waits on a bench beside them, ready to be placed at any station.',
  },
]

export const MODEL_LABEL = 'A simplified coffee-shop simulation'
export const SAME_RUSH_LABEL = 'Same 30 orders. Same 10 minutes.'
