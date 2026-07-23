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
      className={`fixed bottom-24 sm:bottom-8 right-8 z-50 w-12 h-12 shadow-2xl transition-all duration-500 ease-in-out bg-primary text-white border-none cursor-pointer flex items-center justify-center ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-12 opacity-0 scale-50 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
        arrow_upward
      </span>
    </button>
  )
}
