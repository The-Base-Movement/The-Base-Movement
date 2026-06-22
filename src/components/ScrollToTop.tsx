/**
 * ScrollToTop Component
 * -------------------------------------------------------------
 * Utility component that resets the window scroll position to the top whenever
 * the current route pathname changes. Renders nothing (returns null).
 *
 * Mount once at the root app level (inside `<Router>`) so all route transitions
 * start from the top of the page.
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
