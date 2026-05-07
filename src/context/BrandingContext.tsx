import React, { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import { Helmet } from 'react-helmet-async'
import { defaultSettings, type BrandingSettings } from '@/types/branding'
import { BrandingContext } from '@/hooks/useBranding'

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
    let isMounted = true

    async function initializeBranding() {
      try {
        const data = await adminService.getSiteSettings()
        if (isMounted) {
          setSettings(prev => ({
            ...prev,
            ...(data as Partial<BrandingSettings>)
          }))
        }
      } catch (err) {
        console.error('[BRANDING] Failed to fetch site settings:', err)
      }
    }

    initializeBranding()
    
    // Listen for branding updates (custom event from AdminSettings)
    const handleBrandingUpdate = () => {
      initializeBranding()
    }
    window.addEventListener('site_settings_updated', handleBrandingUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('site_settings_updated', handleBrandingUpdate)
    }
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

        {/* Dynamic Theme Colors */}
        <style>
          {`
            :root {
              --primary: ${settings.primary_color};
              --brand-green: ${settings.primary_color};
              --ring: ${settings.primary_color};
              --accent: ${settings.accent_color};
              --brand-gold: ${settings.accent_color};
              --destructive: ${settings.destructive_color};
              --brand-red: ${settings.destructive_color};

              /* Typography Management */
              --font-scale: ${settings.font_scale_global || 1.0};
              --font-heading-scale: ${settings.font_scale_headings || 1.0};
              
              /* Derived Responsive Sizes with clamp() */
              --h1-size: clamp(calc(1.75rem * var(--font-heading-scale)), calc(4.5vw * var(--font-heading-scale)), calc(3.5rem * var(--font-heading-scale)));
              --h2-size: clamp(calc(1.5rem * var(--font-heading-scale)), calc(3.5vw * var(--font-heading-scale)), calc(2.75rem * var(--font-heading-scale)));
              --h3-size: clamp(calc(1.25rem * var(--font-heading-scale)), calc(2.5vw * var(--font-heading-scale)), calc(2rem * var(--font-heading-scale)));
              --h4-size: clamp(calc(1.1rem * var(--font-heading-scale)), calc(2vw * var(--font-heading-scale)), calc(1.5rem * var(--font-heading-scale)));
              --h5-size: clamp(calc(1rem * var(--font-heading-scale)), calc(1.5vw * var(--font-heading-scale)), calc(1.25rem * var(--font-heading-scale)));
              --h6-size: clamp(calc(0.875rem * var(--font-heading-scale)), calc(1.2vw * var(--font-heading-scale)), calc(1.1rem * var(--font-heading-scale)));
              
              /* Body Text Scaling */
              --p-size: clamp(calc(0.875rem * var(--font-scale)), calc(0.5vw + 0.75rem), calc(1.125rem * var(--font-scale)));
              --text-tiny: clamp(0.65rem, 0.4vw + 0.5rem, 0.8rem);
            }
          `}
        </style>
      </Helmet>
      {children}
    </BrandingContext.Provider>
  )
}


