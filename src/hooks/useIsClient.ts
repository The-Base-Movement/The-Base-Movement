/**
 * @file useIsClient.ts
 * @description Hook to determine if the component is running on the client (browser).
 * Safe for SSR and avoids the "cascading render" warning by using
 * React's useSyncExternalStore for hydration synchronization.
 */

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

/**
 * Hook to determine if the component is running on the client (browser).
 * Safe for SSR and avoids the "cascading render" warning by using
 * React's useSyncExternalStore for hydration synchronization.
 *
 * @returns Boolean flag indicating if execution is occurring in browser client.
 */
export function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
