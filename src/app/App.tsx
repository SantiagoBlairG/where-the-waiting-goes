import { SiteNav } from '@/app/SiteNav'
import { Experiment } from '@/experiment/Experiment'
import { StoryRoot } from '@/story/StoryRoot'

export function App() {
  return (
    <main id="top">
      {/* First in tab order, ahead of the floating nav. Visible only while focused. */}
      <a
        href="#experiment"
        className="fixed left-4 top-4 z-50 -translate-y-20 rounded-control bg-paper px-4 py-2 text-sm font-semibold text-forest shadow-lg outline-none focus-visible:translate-y-0 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Skip to experiment
      </a>
      <SiteNav />
      <StoryRoot />
      <Experiment />
    </main>
  )
}
