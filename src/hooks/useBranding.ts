/**
 * @file useBranding.ts
 * @description Exposes a custom React hook to access site settings and theme customization details.
 */

import { createContext, useContext } from 'react'
import type { BrandingSettings } from '@/types/branding'

/**
 * Interface representing the site branding settings context values
 */
export interface BrandingContextType {
  /** Dynamic site colors, logo URLs, custom radii, tab colors, and font settings */
  settings: BrandingSettings
  /** Triggers a reload of branding configurations from the database */
  refreshSettings: () => Promise<void>
}

export const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

/**
 * Custom React hook accessing the site dynamic branding configs.
 *
 * @returns Object including current BrandingSettings properties and refreshSettings method.
 * @throws Error if executed outside of BrandingProvider scope.
 */
export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}
