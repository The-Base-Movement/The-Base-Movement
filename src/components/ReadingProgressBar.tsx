/**
 * ReadingProgressBar Component
 * -------------------------------------------------------------
 * Fixed 4 px stripe across the very top of the viewport indicating how far down
 * the current public page the visitor has scrolled.
 *
 * Only active on public routes (all paths starting with `/` that do NOT start
 * with `/admin` or `/dashboard`). On excluded routes it returns null and resets
 * the progress to 0 via a deferred `setTimeout` to avoid a synchronous
 * setState-in-effect React warning.
 *
 * Uses passive scroll + resize listeners for performance.
 * Gradient: brand-red → brand-gold → brand-green.
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PUBLIC_PREFIXES = ['/']
const EXCLUDED_PREFIXES = ['/admin', '/dashboard']

export default function ReadingProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const location = useLocation()

  const isPublic =
    PUBLIC_PREFIXES.some((p) => location.pathname.startsWith(p)) &&
    !EXCLUDED_PREFIXES.some((p) => location.pathname.startsWith(p))

  useEffect(() => {
    if (!isPublic) {
      const t = setTimeout(() => setScrollProgress(0), 0)
      return () => clearTimeout(t)
    }

    const handler = () => {
      const scrolled =
        window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      const total = document.documentElement.scrollHeight - document.documentElement.clientHeight
      setScrollProgress(total > 0 ? (scrolled / total) * 100 : 0)
    }

    // Defer the initial calculation to avoid synchronous setState in the effect body
    const t = setTimeout(handler, 0)

    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('resize', handler, { passive: true })

    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', handler)
    }
  }, [isPublic, location.pathname])

  if (!isPublic) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 4,
        zIndex: 300,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${scrollProgress}%`,
          background:
            'linear-gradient(to right, hsl(var(--brand-red)), hsl(var(--brand-gold)), hsl(var(--brand-green)))',
          transition: 'width 150ms ease-out',
        }}
      />
    </div>
  )
}
