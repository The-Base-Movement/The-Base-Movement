import { useEffect } from 'react'

const PROPERTY_ID = import.meta.env.VITE_TAWK_PROPERTY_ID as string | undefined
const WIDGET_ID = import.meta.env.VITE_TAWK_WIDGET_ID as string | undefined

declare global {
  interface Window {
    Tawk_API: object
    Tawk_LoadStart: Date
  }
}

export default function TawkChat() {
  useEffect(() => {
    if (!PROPERTY_ID || !WIDGET_ID) return
    if (window.location.hostname === 'localhost') return
    if (window.Tawk_API) return

    window.Tawk_API = {}
    window.Tawk_LoadStart = new Date()

    const s1 = document.createElement('script')
    const s0 = document.getElementsByTagName('script')[0]
    s1.async = true
    s1.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`
    s1.charset = 'UTF-8'
    s1.setAttribute('crossorigin', '*')
    s0.parentNode?.insertBefore(s1, s0)
  }, [])

  return null
}
