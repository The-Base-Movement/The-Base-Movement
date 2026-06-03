import { useState, useEffect } from 'react'

export default function ReadingProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as Element
      const isRoot =
        target === document.documentElement ||
        target === document.body ||
        target === (document as unknown as Element)

      const scrollTop = isRoot ? window.scrollY : target.scrollTop
      const totalHeight = isRoot
        ? document.documentElement.scrollHeight - window.innerHeight
        : target.scrollHeight - target.clientHeight

      setScrollProgress(totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0)
    }

    // capture: true catches scroll on inner containers (they don't bubble)
    document.addEventListener('scroll', handler, true)
    return () => document.removeEventListener('scroll', handler, true)
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-[4px] z-[100] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  )
}
