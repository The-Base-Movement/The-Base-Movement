import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import { Helmet } from 'react-helmet-async'
import { BrandingSettings, defaultSettings } from '@/types/branding'

interface BrandingContextType {
  settings: BrandingSettings
  refreshSettings: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings)

  const refreshSettings = useCallback(async () => {
    try {
      const data = await adminService.getSiteSettings()
      setSettings(prev => ({
        ...prev,
        ...(data as Partial<BrandingSettings>)
      }))
    } catch (err) {
      console.error('[BRANDING] Failed to fetch site settings:', err)
    }
  }, [])

  useEffect(() => {
    refreshSettings()
    
    // Listen for branding updates (custom event from AdminSettings)
    const handleBrandingUpdate = () => {
      refreshSettings()
    }
    window.addEventListener('site_settings_updated', handleBrandingUpdate)
    return () => window.removeEventListener('site_settings_updated', handleBrandingUpdate)
  }, [refreshSettings])

  return (
    <BrandingContext.Provider value={{ settings, refreshSettings }}>
      <Helmet>
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href={settings.favicon_url} />
        
        {/* Open Graph */}
        <meta property="og:image" content={settings.og_image_url} />
        
        {/* Twitter */}
        <meta name="twitter:image" content={settings.twitter_card_url || settings.og_image_url} />
      </Helmet>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}

