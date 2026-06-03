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

  // Reset to 0 on every route change
  useEffect(() => {
    const t = setTimeout(() => setScrollProgress(0), 0)
    return () => clearTimeout(t)
  }, [location.pathname])

  useEffect(() => {
    if (!isPublic) return

    const handler = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(total > 0 ? (scrolled / total) * 100 : 0)
    }

    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [isPublic])

  if (!isPublic) return null

  return (
    <div className="fixed top-0 left-0 w-full h-[4px] z-[300] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  )
}
