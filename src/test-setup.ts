import '@testing-library/jest-dom/vitest'

// jsdom has no IntersectionObserver; the Hairline kernel uses one to sleep off screen.
class StubIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??= StubIntersectionObserver as unknown as typeof IntersectionObserver

// Nor matchMedia (used for prefers-reduced-motion).
globalThis.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent: () => false,
})) as unknown as typeof matchMedia
