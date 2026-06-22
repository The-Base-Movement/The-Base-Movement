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

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: true,
    // Capture 10% of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture 5% of sessions for session replay (errors always captured)
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
  })
}

export { Sentry }
