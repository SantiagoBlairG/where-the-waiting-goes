/**
 * A small floating glass pill, centred at the top. Content scrolls beneath it and shows through
 * the blur. Plain anchors only, so nothing else needs to know it exists.
 * Motion ownership: CSS only (press scale and hover colour).
 */
export function SiteNav() {
  return (
    <nav aria-label="Page" className="glass fixed left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5 pl-5 text-sm font-semibold text-ink">
      <a href="#top" className="display press -ml-2 flex min-h-10 items-center whitespace-nowrap rounded-full pl-2 pr-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        Where the waiting goes
      </a>
      <a
        href="#experiment"
        className="press flex min-h-10 items-center whitespace-nowrap rounded-full bg-forest px-4 text-paper shadow-[inset_0_1px_0_rgb(255_255_255/0.25)] outline-none transition-[background-color,scale] duration-150 hover:bg-[#2f5348] focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Try it
      </a>
    </nav>
  )
}
