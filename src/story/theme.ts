/**
 * The room changes tone as the story does, but gently: soft greens and sands from the client's
 * palette, with one deep forest moment for the reveal. Each beat has a background, a text color
 * that passes contrast on it, a quieter text color, a ring (coffee stain) color and two soft glows.
 * Contrast of text on its background: ink on stone 11:1, ink on mist 11:1, ink on sand 9:1,
 * paper on forest 6.7:1.
 */
export type RoomTheme = {
  bg: string
  fg: string
  fg2: string
  ring: string
  /** Two soft color glows drawn over the background, as rgba strings so they can be tweened. */
  glowA: string
  glowB: string
}

const STONE: RoomTheme = {
  bg: '#e2dfda',
  fg: '#1b2622',
  fg2: '#46554e',
  ring: '#1b2622',
  glowA: 'rgba(210,196,158,0.75)',
  glowB: 'rgba(200,222,211,0.7)',
}
const MIST: RoomTheme = {
  bg: '#c8ded3',
  fg: '#1b2622',
  fg2: '#3c4d46',
  ring: '#1b2622',
  glowA: 'rgba(226,223,218,0.8)',
  glowB: 'rgba(136,164,154,0.45)',
}
const SAND: RoomTheme = {
  bg: '#e6d3ad',
  fg: '#1b2622',
  fg2: '#4a4630',
  ring: '#1b2622',
  glowA: 'rgba(168,87,15,0.22)',
  glowB: 'rgba(226,223,218,0.8)',
}
const SAGE: RoomTheme = {
  bg: '#b6d0c3',
  fg: '#1b2622',
  fg2: '#35463f',
  ring: '#1b2622',
  glowA: 'rgba(200,222,211,0.9)',
  glowB: 'rgba(56,98,85,0.3)',
}
const FOREST: RoomTheme = {
  bg: '#386255',
  fg: '#f4efe4',
  fg2: '#cfe0d6',
  ring: '#d2c49e',
  glowA: 'rgba(136,164,154,0.5)',
  glowB: 'rgba(210,196,158,0.28)',
}

/** One theme per beat, in story order. */
export const BEAT_THEMES: readonly RoomTheme[] = [STONE, MIST, STONE, SAGE, SAND, FOREST, STONE, MIST]

/** The rush starts calm and ends under pressure: its background warms from stone to sand with the clock. */
export const RUSH_FROM = STONE
export const RUSH_TO = SAND

/** The static story shows the rush half way through. */
export const RUSH_MID: RoomTheme = {
  bg: '#e4d9c1',
  fg: '#1b2622',
  fg2: '#454636',
  ring: '#1b2622',
  glowA: 'rgba(168,87,15,0.16)',
  glowB: 'rgba(200,222,211,0.7)',
}

/** The soft glow layer, built from two tweened colors. */
export const GLOW_BACKGROUND =
  'radial-gradient(60% 55% at 88% 6%, var(--glow-a), transparent 70%), radial-gradient(55% 55% at 6% 96%, var(--glow-b), transparent 70%)'
