import { adminService } from '@/services/adminService'
import { DEFAULT_PAGE_CONFIGS, type PageSEOConfig } from '@/types/seo'

const SEO_SETTINGS_KEY = 'seo_page_configs'

class SEOService {
  private static instance: SEOService

  static getInstance(): SEOService {
    if (!SEOService.instance) {
      SEOService.instance = new SEOService()
    }
    return SEOService.instance
  }

  /**
   * Fetches all page SEO configurations from Supabase site_settings,
   * merging saved overrides with default preset pages.
   */
  async getPageConfigs(): Promise<PageSEOConfig[]> {
    try {
      const settings = await adminService.getSiteSettings()
      const savedRaw = settings[SEO_SETTINGS_KEY]

      let savedConfigs: PageSEOConfig[] = []
      if (typeof savedRaw === 'string') {
        try {
          savedConfigs = JSON.parse(savedRaw)
        } catch {
          savedConfigs = []
        }
      } else if (Array.isArray(savedRaw)) {
        savedConfigs = savedRaw as PageSEOConfig[]
      }

      // Merge saved configs into DEFAULT_PAGE_CONFIGS presets
      const configMap = new Map<string, PageSEOConfig>()
      DEFAULT_PAGE_CONFIGS.forEach((preset) => configMap.set(preset.path, preset))
      savedConfigs.forEach((saved) => {
        if (saved && saved.path) {
          const existing = configMap.get(saved.path)
          configMap.set(saved.path, {
            ...existing,
            ...saved,
          })
        }
      })

      return Array.from(configMap.values())
    } catch (err) {
      console.error('[SEO SERVICE] Failed to fetch page configs:', err)
      return DEFAULT_PAGE_CONFIGS
    }
  }

  /**
   * Saves a single page SEO configuration into Supabase.
   */
  async savePageConfig(config: PageSEOConfig): Promise<boolean> {
    try {
      const currentConfigs = await this.getPageConfigs()
      const updatedConfig = {
        ...config,
        updatedAt: new Date().toISOString(),
      }

      const existingIndex = currentConfigs.findIndex((c) => c.path === config.path)
      if (existingIndex >= 0) {
        currentConfigs[existingIndex] = updatedConfig
      } else {
        currentConfigs.push(updatedConfig)
      }

      const success = await adminService.updateSiteSetting(
        SEO_SETTINGS_KEY,
        JSON.stringify(currentConfigs)
      )

      if (success) {
        // Also save per-page key for fast O(1) dynamic lookup by SEO.tsx
        await adminService.updateSiteSetting(`seo_page_${config.path}`, updatedConfig)
      }

      return success
    } catch (err) {
      console.error('[SEO SERVICE] Failed to save page config:', err)
      return false
    }
  }

  /**
   * Saves the entire list of page configs into Supabase site_settings.
   */
  async saveAllPageConfigs(configs: PageSEOConfig[]): Promise<boolean> {
    try {
      const success = await adminService.updateSiteSetting(
        SEO_SETTINGS_KEY,
        JSON.stringify(configs)
      )

      if (success) {
        for (const config of configs) {
          await adminService.updateSiteSetting(`seo_page_${config.path}`, config)
        }
      }

      return success
    } catch (err) {
      console.error('[SEO SERVICE] Failed to bulk save page configs:', err)
      return false
    }
  }
}

export const seoService = SEOService.getInstance()
