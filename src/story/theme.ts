/**
 * The room changes color as the story does. Each beat has a background, a text color that
 * passes contrast on it, a quieter text color, a counter color and a ring (coffee stain) color.
 * Contrast of text on its background: ink on butter 13:1, ink on tomato 6:1, white on cobalt 7:1,
 * paper on espresso 16:1.
 */
export type RoomTheme = {
  bg: string
  fg: string
  fg2: string
  counter: string
  ring: string
}

const BUTTER: RoomTheme = { bg: '#ffd84a', fg: '#1d120d', fg2: '#4a3426', counter: '#eab928', ring: '#1d120d' }
const TOMATO: RoomTheme = { bg: '#ff5a36', fg: '#1d120d', fg2: '#2a1710', counter: '#e1431f', ring: '#1d120d' }
const COBALT: RoomTheme = { bg: '#2b3fe0', fg: '#ffffff', fg2: '#dfe4ff', counter: '#2131b6', ring: '#ffffff' }
const ESPRESSO: RoomTheme = { bg: '#1d120d', fg: '#fff3dc', fg2: '#e6d3b8', counter: '#33201a', ring: '#ffd84a' }

/** One theme per beat, in story order. */
export const BEAT_THEMES: readonly RoomTheme[] = [BUTTER, BUTTER, BUTTER, COBALT, TOMATO, ESPRESSO, BUTTER]

/** The rush starts calm and ends under pressure: its background follows the clock. */
export const RUSH_FROM = BUTTER
export const RUSH_TO = TOMATO

/** The static story shows the rush mid-way, so its room sits half way between butter and tomato. */
export const RUSH_MID: RoomTheme = { bg: '#ff9a3f', fg: '#1d120d', fg2: '#2f1d12', counter: '#e57a22', ring: '#1d120d' }
