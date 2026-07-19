/**
 * Scroll reveal — wires up the site's existing opt-in attributes:
 *   - [data-fade]         → the element fades + rises once when scrolled in.
 *   - [data-fade-stagger] → the element's direct children stagger in.
 *
 * Content is hidden via JS (never CSS) so SSR / no-JS always renders it visible.
 * No-ops under prefers-reduced-motion or the app's `.low-bandwidth` mode
 * (which also force-shows these targets via CSS as a backstop).
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initMotion, reducedMotion, M } from './gsapCore'

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
      stagger: M.stagger,
      overwrite: true,
      onComplete: () => gsap.set(targets, { willChange: 'auto' }),
    })

  // [data-fade] — batched so several entering together share one clean stagger.
  const singles = gsap.utils.toArray<HTMLElement>('[data-fade]', root)
  if (singles.length) {
    gsap.set(singles, { opacity: 0, y: M.distance, willChange: 'transform, opacity' })
    triggers.push(...ScrollTrigger.batch(singles, { start: M.start, once: true, onEnter: reveal }))
  }

  // [data-fade-stagger] — each group reveals its own direct children on enter.
  gsap.utils.toArray<HTMLElement>('[data-fade-stagger]', root).forEach((group) => {
    const kids = Array.from(group.children) as HTMLElement[]
    if (!kids.length) return
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
