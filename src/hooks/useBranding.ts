import { createContext, useContext } from 'react'
import type { BrandingSettings } from '@/types/branding'

export interface BrandingContextType {
  settings: BrandingSettings
  refreshSettings: () => Promise<void>
}

export const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}
