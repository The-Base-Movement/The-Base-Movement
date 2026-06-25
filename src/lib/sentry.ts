/**
 * @file sentry.ts
 * @description Provides a initialization wrapper for Sentry application monitoring in production mode.
 */

import * as Sentry from '@sentry/react'

/**
 * Initializes Sentry application instrumentation settings for production logs.
 * Sets sampling rate metrics and enables BrowserTracing / SessionReplay integrations.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || import.meta.env.DEV) return

  const IGNORED_ERRORS = [
    'Failed to fetch',
    'Load failed',
    'NetworkError',
    'AbortError',
    'TypeError: cancelled',
    'TypeError: Cancelled',
    'ChunkLoadError',
    'Loading chunk',
    'Importing a module script failed',
    'ResizeObserver loop',
    'Non-Error promise rejection',
    'Object Not Found Matching',
    'instantSearchSDKJSBridgeClearHighlights',
    'ceCurrentVideo.tele498',
  ]

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: true,
    // ponytail: lowered to avoid 429 rate-limit on free tier
    tracesSampleRate: 0.02,
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    beforeSend(event) {
      const msg = event.exception?.values?.[0]?.value ?? ''
      if (IGNORED_ERRORS.some((pattern) => msg.includes(pattern))) return null

      const frames = event.exception?.values?.[0]?.stacktrace?.frames
      if (
        frames?.some(
          (f) => f.filename?.includes('extensions://') || f.filename?.includes('moz-extension://')
        )
      ) {
        return null
      }

      return event
    },
    ignoreErrors: IGNORED_ERRORS,
  })
}

export { Sentry }
