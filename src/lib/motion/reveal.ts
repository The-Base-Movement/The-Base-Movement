/**
 * Scroll reveal — wires up the site's existing opt-in attributes:
 *   - [data-fade]         → the element fades + rises once when scrolled in.
 *   - [data-fade-stagger] → the element's direct children stagger in.
 *
 * Incremental + idempotent: each element is handled once (marked with
 * `data-fade-done`), so it's safe to call repeatedly as async / lazy content
 * mounts. Content is hidden via JS (never CSS) so SSR / no-JS renders it
 * visible. No-ops under prefers-reduced-motion or the app's `.low-bandwidth`
 * mode (which also force-show these targets via CSS as a backstop).
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initMotion, reducedMotion, M } from './gsapCore'

const DONE = 'data-fade-done'
export const PENDING_SELECTOR = `[data-fade]:not([${DONE}]), [data-fade-stagger]:not([${DONE}])`

export function setupReveals(root: ParentNode = document): () => void {
  initMotion()
  if (reducedMotion() || document.querySelector('.low-bandwidth')) return () => {}

  const triggers: ScrollTrigger[] = []

  const reveal = (targets: Element[]) =>
    gsap.to(targets, {
      opacity: 1,
      y: 0,
      duration: M.duration,
      ease: M.ease,
      // Cap total stagger so large grids (many cards) don't drag on.
      stagger: Math.min(M.stagger, 0.6 / Math.max(targets.length, 1)),
      overwrite: true,
      onComplete: () => gsap.set(targets, { willChange: 'auto' }),
    })

  // [data-fade] — batched so several entering together share one clean stagger.
  const singles = gsap.utils.toArray<HTMLElement>(`[data-fade]:not([${DONE}])`, root)
  if (singles.length) {
    singles.forEach((el) => el.setAttribute(DONE, ''))
    gsap.set(singles, { opacity: 0, y: M.distance, willChange: 'transform, opacity' })
    triggers.push(...ScrollTrigger.batch(singles, { start: M.start, once: true, onEnter: reveal }))
  }

  // [data-fade-stagger] — each group reveals its own direct children on enter.
  gsap.utils.toArray<HTMLElement>(`[data-fade-stagger]:not([${DONE}])`, root).forEach((group) => {
    const kids = Array.from(group.children) as HTMLElement[]
    if (!kids.length) return
    group.setAttribute(DONE, '')
    gsap.set(kids, { opacity: 0, y: M.distance, willChange: 'transform, opacity' })
    triggers.push(
      ScrollTrigger.create({
        trigger: group,
        start: M.start,
        once: true,
        onEnter: () => reveal(kids),
      })
    )
  })

  return () => triggers.forEach((t) => t.kill())
}
