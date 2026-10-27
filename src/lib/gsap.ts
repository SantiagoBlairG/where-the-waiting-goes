import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Plugins are registered exactly once, here. Import gsap from this module only. */
gsap.registerPlugin(ScrollTrigger, useGSAP)

export { gsap, ScrollTrigger, useGSAP }

// Dev only: lets browser checks turn off lag smoothing, which makes animations crawl when a
// background pane throttles requestAnimationFrame.
if (import.meta.env.DEV) (window as unknown as { gsap: typeof gsap }).gsap = gsap
