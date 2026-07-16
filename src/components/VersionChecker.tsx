import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

// How often to re-check for a newer deployed build while the tab stays open.
const CHECK_INTERVAL_MS = 5 * 60 * 1000

/**
 * Detects when a newer build has been deployed while the app is open and
 * prompts the user to reload. The build id is baked into this bundle as
 * import.meta.env.VITE_BUILD_ID; /version.json carries the id of the currently
 * deployed build. When they diverge, the running code is stale — offer a reload.
 *
 * This complements the stale-lazy-chunk auto-reload in main.tsx: that only
 * fires when a chunk 404s on navigation, whereas an old-but-complete bundle
 * (e.g. the registration form) keeps working with outdated logic until here.
 *
 * Renders nothing; client-only (guarded by useIsClient at the mount site).
 */
export function VersionChecker() {
  const promptedRef = useRef(false)

  useEffect(() => {
    const currentBuildId: string = import.meta.env.VITE_BUILD_ID ?? ''
    // No emitted version.json in dev, and dev build ids are throwaway stamps.
    if (import.meta.env.DEV || currentBuildId.startsWith('dev-')) return

    let cancelled = false

    async function check() {
      if (cancelled || promptedRef.current || document.visibilityState !== 'visible') return
      try {
        const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const { buildId } = (await res.json()) as { buildId?: string }
        if (buildId && buildId !== currentBuildId && !promptedRef.current) {
          promptedRef.current = true
          toast('A new version is available', {
            description: 'Reload to get the latest updates.',
            duration: Infinity,
            action: {
              label: 'Reload',
              onClick: () => window.location.reload(),
            },
          })
        }
      } catch {
        // Offline or a transient failure — ignore and try again next tick.
      }
    }

    check()
    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
    }
  }, [])

  return null
}
