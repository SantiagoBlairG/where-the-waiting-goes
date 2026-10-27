/**
 * A small floating pill, centered at the top. Plain anchors only: no script, no transform of its
 * own, so nothing else needs to know it exists. Motion ownership: none (CSS hover color only).
 */
export function SiteNav() {
  return (
    <nav
      aria-label="Page"
      className="fixed left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full bg-paperp-1.5 pl-5 text-sm font-semibold text-ink shadow-[0_6px_24px_-8px_rgb(27_38_34/0.35)]"
    >
      <a href="#top" className="display flex min-h-10 items-center whitespace-nowrap pr-3 text-base outline-none focus-visible:underline">
        Where the waiting goes
      </a>
      <a
        href="#experiment"
        className="flex min-h-10 items-center whitespace-nowrap rounded-full bg-forest px-4 text-paper outline-none transition-colors hover:bg-forest/90 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Try it
      </a>
    </nav>
  )
}
