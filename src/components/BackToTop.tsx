import { useState, useEffect } from 'react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.scrollY > 400
    }
    return false
  })

  const toggleVisibility = () => {
    // Using scrollY for better modern browser support
    if (window.scrollY > 400) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

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
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_upward</span>
    </button>
  )
}
