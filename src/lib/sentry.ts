/**
 * @file sentry.ts
 * @description Provides a lazy initialization wrapper for Sentry monitoring so
 * the SDK stays out of the main boot graph unless it is actually enabled.
 */

let sentryModulePromise: Promise<typeof import('@sentry/react')> | null = null

function loadSentry() {
  sentryModulePromise ??= import('@sentry/react')
  return sentryModulePromise
}

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

  void loadSentry().then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      sendDefaultPii: true,
      // ponytail: lowered to avoid 429 rate-limit on free tier
      tracesSampleRate: 0.02,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 0.5,
      enableLogs: true,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
        // ponytail: warn+error only — capturing log/info/debug would flood the free-tier quota
        Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
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
  })
}

/**
 * Emit a Sentry metric without eagerly importing the SDK (keeps the lazy-load).
 * Usage: trackMetric(m => m.count('register_submitted', 1))
 */
export function trackMetric(fn: (m: typeof import('@sentry/react').metrics) => void) {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || import.meta.env.DEV) return
  void loadSentry().then((Sentry) => fn(Sentry.metrics))
}

export function captureException(
  error: unknown,
  context?: Parameters<typeof import('@sentry/react').captureException>[1]
) {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn || import.meta.env.DEV) return
  void loadSentry().then((Sentry) => {
    Sentry.captureException(error, context)
  })
}
