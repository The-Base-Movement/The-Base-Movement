/**
 * @file BrandingContext.tsx
 * @description Provides site branding settings context, allowing components to retrieve primary colors,
 * fonts, and layout assets loaded dynamically from the backend settings service. Also inserts
 * a dynamic HTML <style> tag into the <head> using react-helmet-async.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { defaultSettings, type BrandingSettings } from '@/types/branding'
import { BrandingContext } from '@/hooks/useBranding'
import { publicSiteService } from '@/services/publicSiteService'

/**
 * Provider component for the site branding context.
 * Fetches dynamic branding colors, typography settings, tab configurations, and button designs
 * from backend service settings and injects them as global CSS variables in the document root.
 *
 * @param props - Component props
 * @param props.children - The child nodes of the branding provider
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings)

  const refreshSettings = useCallback(async () => {
    try {
      const data = await publicSiteService.getSiteSettings()
      setSettings((prev) => ({
        ...prev,
        ...(data as Partial<BrandingSettings>),
      }))
    } catch (err) {
      console.error('[BRANDING] Failed to fetch site settings:', err)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function initializeBranding() {
      try {
        const data = await publicSiteService.getSiteSettings()
        if (isMounted) {
          setSettings((prev) => ({
            ...prev,
            ...(data as Partial<BrandingSettings>),
          }))
        }
      } catch (err) {
        console.error('[BRANDING] Failed to fetch site settings:', err)
      }
    }

    initializeBranding()

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
            html:root {
              --primary: ${settings.primary_color};
              --brand-green: ${settings.primary_color};
              --ring: ${settings.primary_color};
              --accent: ${settings.accent_color};
              --brand-gold: ${settings.accent_color};
              --destructive: ${settings.destructive_color};
              --brand-red: ${settings.destructive_color};

              /* Muted Text Management */
              --muted-foreground: ${settings.muted_foreground_color || '131 5% 40%'};
              --on-surface-muted: ${settings.on_surface_muted_color || '131 5% 40%'};

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

              /* Button Configuration */
              --button-radius: ${settings.button_border_radius || '0.125rem'};
              --button-font-weight: ${settings.button_font_weight || '700'};
              --primary-foreground: ${settings.button_primary_text_color || '0 0% 100%'};
              --primary-hover: ${settings.button_primary_hover_bg_color || '156 100% 15%'};
              --accent-foreground: ${settings.button_gold_text_color || '0 0% 100%'};
              --accent-hover: ${settings.button_accent_hover_bg_color || '45 80% 35%'};
              
              --destructive-foreground: ${settings.button_destructive_text_color || '0 0% 100%'};
              --destructive-hover: ${settings.button_destructive_hover_bg_color || '0 85% 35%'};
              
              --active-tab-bg: ${settings.button_active_tab_bg_color || settings.primary_color};
              --active-tab-hover: ${settings.button_active_tab_hover_bg_color || '156 100% 15%'};
              
              --inactive-tab-bg: ${settings.button_inactive_tab_bg_color || '0 0% 100%'};
              --inactive-tab-text: ${settings.button_inactive_tab_text_color || '156 100% 21%'};
              --inactive-tab-hover: ${settings.button_inactive_tab_hover_bg_color || '0 0% 95%'};
            }
          `}
        </style>
      </Helmet>
      {children}
    </BrandingContext.Provider>
  )
}
