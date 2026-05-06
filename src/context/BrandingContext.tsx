import React, { createContext, useContext, useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Helmet } from 'react-helmet-async'

interface BrandingSettings {
  logo_url: string
  favicon_url: string
  og_image_url: string
  twitter_card_url: string
  primary_email: string
  newsletter_email: string
  [key: string]: unknown
}

const defaultSettings: BrandingSettings = {
  logo_url: '/logo.png',
  favicon_url: '/favicons/favicon-32x32.png',
  og_image_url: '/og-image.png',
  twitter_card_url: '/og-image.png',
  primary_email: 'info@thebasemovement.com',
  newsletter_email: 'info@thebasemovement.com'
}

interface BrandingContextType {
  settings: BrandingSettings
  refreshSettings: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings)

  const refreshSettings = async () => {
    try {
      const data = await adminService.getSiteSettings()
      setSettings({
        ...defaultSettings,
        ...(data as any)
      })
    } catch (err) {
      console.error('[BRANDING] Failed to fetch site settings:', err)
    }
  }

  useEffect(() => {
    refreshSettings()
    
    // Listen for branding updates (custom event from AdminSettings)
    const handleBrandingUpdate = () => {
      refreshSettings()
    }
    window.addEventListener('site_settings_updated', handleBrandingUpdate)
    return () => window.removeEventListener('site_settings_updated', handleBrandingUpdate)
  }, [])

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

export const useBranding = () => {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}
