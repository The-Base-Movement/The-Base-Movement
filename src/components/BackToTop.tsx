/**
 * BackToTop Component
 * -------------------------------------------------------------
 * Floating navigation shortcut button that appears on scroll.
 * Monitors window scroll position to toggle visibility past 400px scroll depth.
 * Triggers a smooth-scroll upward on click.
 */

import { useState, useEffect } from 'react'

/**
 * BackToTop component definition.
 */
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > 400
    }
    return false
  })

  /**
   * Toggles visibility state based on window scroll Y position.
   */
  const toggleVisibility = () => {
    // Using scrollY for better modern browser support
    if (window.scrollY > 400) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  /**
   * Performs a smooth scroll animation back to the top of the window page.
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-24 sm:bottom-8 right-6 sm:right-8 z-50 w-12 h-12 rounded-full shadow-lg border border-border/80 transition-all duration-300 ease-out bg-surface text-on-surface hover:border-primary flex items-center justify-center group ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100 hover:-translate-y-1 hover:shadow-xl'
          : 'translate-y-12 opacity-0 scale-50 pointer-events-none'
      }`}
      style={{
        boxShadow: '0 8px 24px -4px rgba(0,0,0,0.18)',
      }}
      aria-label="Back to top"
    >
      <img
        src="/branding/patterns/eagle-in-flight.webp"
        alt=""
        aria-hidden="true"
        className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-110"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))',
        }}
      />
    </button>
  )
}
