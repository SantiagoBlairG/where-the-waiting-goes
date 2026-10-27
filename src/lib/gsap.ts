import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Plugins are registered exactly once, here. Import gsap from this module only. */
gsap.registerPlugin(ScrollTrigger, Draggable, useGSAP)

// Follow the wall clock. With the default smoothing, a browser that renders few frames (a busy
// machine, an embedded pane) makes every tween crawl instead of just looking less smooth.
gsap.ticker.lagSmoothing(0)

export { gsap, Draggable, ScrollTrigger, useGSAP }

// Dev only: lets browser checks turn off lag smoothing, which makes animations crawl when a
// background pane throttles requestAnimationFrame.
if (import.meta.env.DEV) (window as unknown as { gsap: typeof gsap }).gsap = gsap
