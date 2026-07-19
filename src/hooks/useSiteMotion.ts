/**
 * useSiteMotion — mount once in PublicLayout. On every route change it re-scans
 * the page for the reveal opt-ins ([data-fade], [data-fade-stagger]), wires them
 * up, and refreshes ScrollTrigger. Cleans up on route change / unmount so
 * triggers never leak between pages.
 *
 * Public site only — the dashboard/admin shells don't call this.
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initMotion } from '@/lib/motion/gsapCore'
import { setupReveals } from '@/lib/motion/reveal'

export function useSiteMotion(): void {
  const { pathname } = useLocation()
  const cleanup = useRef<() => void>(() => {})

  useEffect(() => {
    initMotion()

    // Wait a frame so lazy/Suspense section content is in the DOM before scanning.
    const raf = requestAnimationFrame(() => {
      cleanup.current = setupReveals()
      ScrollTrigger.refresh()
    })

    return () => {
      cancelAnimationFrame(raf)
      cleanup.current()
      cleanup.current = () => {}
    }
  }, [pathname])
}
