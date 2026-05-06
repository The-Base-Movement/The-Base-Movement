import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from './ui/neon-button'

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
    <Button
      variant="primary"
      size="sm"
      onClick={scrollToTop}
      className={`fixed bottom-24 sm:bottom-8 right-8 z-50 w-12 h-12 p-0 shadow-2xl transition-all duration-500 ease-in-out ${
        isVisible 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-12 opacity-0 scale-50 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      <ArrowUp className="w-5 h-5" />
    </Button>
  )
}
