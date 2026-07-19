/**
 * Motion core — single place to register GSAP and hold the motion vocabulary.
 * Everything here is SSR-safe: nothing touches `window` until a function runs.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

/** Register ScrollTrigger exactly once (client-only). Safe to call repeatedly. */
export function initMotion(): void {
  if (registered || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger)
  registered = true
}

/** True when the visitor asked the OS to reduce motion. */
export function reducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * The one motion vocabulary reused everywhere. Restrained on purpose:
 * short durations, small travel, opacity + transform only.
 */
export const M = {
  duration: 0.5, // reveal fade-rise
  ease: 'power2.out',
  distance: 16, // px translateY for reveals
  stagger: 0.08, // between grouped items
  start: 'top 85%', // when a reveal fires
} as const
