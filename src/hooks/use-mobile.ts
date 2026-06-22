/**
 * @file use-mobile.ts
 * @description Mobile Media Query React Hook.
 * Detects whether the current viewport width is below the mobile breakpoint (768px).
 * Uses window.matchMedia under the hood for clean, performant event listening.
 */

import * as React from 'react'

/** Screen width breakpoint for mobile devices in pixels */
const MOBILE_BREAKPOINT = 768

/**
 * Custom React hook to detect if the viewport width is below the mobile breakpoint (768px).
 * Automatically updates on resize events.
 *
 * @returns Boolean flag indicating whether viewport is mobile-sized.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : undefined
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
