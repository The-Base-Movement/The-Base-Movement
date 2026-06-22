/**
 * Analytics Component
 * -------------------------------------------------------------
 * Injector component for Umami analytics scripts.
 * Mounts the tracker script block dynamically to document head in production environments.
 */

import { useEffect } from 'react'

/**
 * Analytics component definition.
 */
export function Analytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return
    const id = import.meta.env.VITE_UMAMI_WEBSITE_ID
    if (!id) return
    const script = document.createElement('script')
    script.defer = true
    script.src = 'https://cloud.umami.is/script.js'
    script.setAttribute('data-website-id', id)
    document.head.appendChild(script)
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  return null
}
