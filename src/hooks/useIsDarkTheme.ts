/**
 * @file useIsDarkTheme.ts
 * @description Hook to monitor mutations to the `data-theme` attribute on the root html element.
 * Provides the active dark mode theme status dynamically.
 */

import { useState, useEffect } from 'react'

/**
 * Custom React hook detecting whether the application is running in dark mode theme.
 * Uses a MutationObserver to watch attribute updates on document.documentElement.
 *
 * @returns Boolean flag showing if the dark theme is active.
 */
export function useIsDarkTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  return isDark
}
