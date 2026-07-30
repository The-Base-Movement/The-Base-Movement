/**
 * Analytics Component
 * -------------------------------------------------------------
 * Injector component for Umami analytics scripts.
 * Only loads the tracker after the user has granted analytics
 * consent (stored in localStorage under 'analytics_consent').
 *
 * Listens for the 'analytics-consent-granted' custom event so
 * Umami is injected immediately when the user accepts the
 * AnalyticsConsentBanner without requiring a page reload.
 */

import { useEffect } from 'react'

const CONSENT_KEY = 'analytics_consent'

function injectUmami() {
  const id = import.meta.env.VITE_UMAMI_WEBSITE_ID
  if (!id) return
  // Avoid double-injection
  if (document.querySelector(`script[data-website-id="${id}"]`)) return
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://cloud.umami.is/script.js'
  script.setAttribute('data-website-id', id)
  document.head.appendChild(script)
}

export function Analytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return

    // Load immediately if already consented
    if (localStorage.getItem(CONSENT_KEY) === 'granted') {
      injectUmami()
    }

    // React to user granting consent from the banner
    function handleGrant() {
      injectUmami()
    }
    window.addEventListener('analytics-consent-granted', handleGrant)
    return () => window.removeEventListener('analytics-consent-granted', handleGrant)
  }, [])

  return null
}
