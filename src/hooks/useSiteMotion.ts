/**
 * useSiteMotion — mount once in PublicLayout. Wires up the reveal opt-ins
 * ([data-fade], [data-fade-stagger]) on the current page and, via a debounced
 * MutationObserver, re-scans when async content mounts (spinner → content,
 * lazy Suspense sections). setupReveals is idempotent, so re-scans only touch
 * newly-added targets. Everything is torn down on route change / unmount.
 *
 * Public site only — the dashboard/admin shells don't call this.
 */
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initMotion } from '@/lib/motion/gsapCore'
import { setupReveals, PENDING_SELECTOR } from '@/lib/motion/reveal'

export function useSiteMotion(): void {
  const { pathname } = useLocation()
  const cleanups = useRef<Array<() => void>>([])

  useEffect(() => {
    initMotion()
    const root = document.getElementById('main-content') ?? document.body

    // Only do work (and refresh ScrollTrigger) when new targets have appeared.
    const scan = () => {
      if (!root.querySelector(PENDING_SELECTOR)) return
      cleanups.current.push(setupReveals(root))
      ScrollTrigger.refresh()
    }

    const raf = requestAnimationFrame(scan)

    let debounce = 0
    const mo = new MutationObserver(() => {
      window.clearTimeout(debounce)
      debounce = window.setTimeout(scan, 120)
    })
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(debounce)
      mo.disconnect()
      cleanups.current.forEach((fn) => fn())
      cleanups.current = []
    }
  }, [pathname])
}
