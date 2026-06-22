/**
 * @file useMediaQuery.ts
 * @description Custom React hook to query CSS Media Queries dynamically in JavaScript.
 * Automatically synchronizes view state with screen sizes.
 */

import { useState, useEffect } from 'react'

/**
 * Custom React hook detecting whether a media query matches the current viewport state.
 *
 * @param query - The media query string to evaluate (e.g. `(min-width: 1024px)`)
 * @returns Boolean matching status of the media query.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    const listener = () => setMatches(media.matches)

    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}
