/** Live state the figures answer to, taken straight from a station snapshot. */
export type StationFigureState = {
  /** Orders waiting for a free worker. */
  queue: number
  /** Orders being made right now. */
  inService: number
}
