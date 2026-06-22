/**
 * @file useStore.ts
 * @description Hook to retrieve the global StoreProvider context.
 * Exposes dynamic application actions and global stores.
 */

import { useContext } from 'react'
import { StoreContext } from '@/types/StoreContext'

/**
 * Custom React hook accessing global StoreContext state.
 *
 * @returns Global store state values and actions.
 * @throws Error if executed outside of StoreProvider.
 */
export const useStore = () => {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
