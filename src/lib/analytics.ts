/**
 * @file analytics.ts
 * @description Provides a global wrapper function to track custom user events via Umami Analytics.
 */

declare global {
  interface Window {
    /** Optional global Umami tracking object injected by the analytics script */
    umami?: {
      track: (event: string, data?: Record<string, string | number | boolean>) => void
    }
  }
}

/**
 * Tracks a custom event in the analytics provider (Umami).
 * Safely handles missing window.umami definitions.
 *
 * @param event - String key representing the event type/name (e.g. 'register_button_clicked')
 * @param data - Optional key-value object containing contextual event metadata
 */
export function trackEvent(event: string, data?: Record<string, string | number | boolean>) {
  window.umami?.track(event, data)
}
