import { describe, expect, it } from 'vitest'
import { rushNote, stopNote } from './stepNotes'
import { RUSH_STEPS } from './timeline'

describe('step notes', () => {
  it('has a note for every stop, naming the station and its service time from the model', () => {
    expect(stopNote(0)).toMatchObject({ station: 'order' })
    expect(stopNote(0).text).toContain('24 seconds')
    expect(stopNote(1)).toMatchObject({ station: 'drinks' })
    expect(stopNote(1).text).toContain('30 seconds')
    expect(stopNote(2)).toMatchObject({ station: 'pickup' })
    expect(stopNote(2).text).toContain('15 seconds')
  })

  it('has a non-empty note for every rush step, and they move forward in the story order', () => {
    const seen: string[] = []
    for (const snap of RUSH_STEPS) {
      const note = rushNote(snap)
      expect(note.text.length).toBeGreaterThan(10)
      if (seen.at(-1) !== note.text) seen.push(note.text)
    }
    // Seven phases, each shown once, never flipping back and forth.
    expect(seen).toHaveLength(7)
    expect(new Set(seen).size).toBe(7)
  })

  it('states the real totals at the end and the real last arrival time', () => {
    const end = rushNote(RUSH_STEPS[RUSH_STEPS.length - 1])
    expect(end.text).toContain('18 orders are picked up')
    expect(end.text).toContain('12 are still in the shop')
    expect(rushNote(RUSH_STEPS[28]).text).toContain('9:40')
  })

  it('only claims what the model shows: a line at the register by 60 s, a drinks line by 120 s, none at pickup ever', () => {
    expect(RUSH_STEPS[3].stations[0].queue).toBeGreaterThan(0) // t = 60 s
    expect(RUSH_STEPS[6].stations[1].queue).toBeGreaterThan(0) // t = 120 s
    for (const snap of RUSH_STEPS) expect(snap.stations[2].queue).toBe(0)
  })
})
