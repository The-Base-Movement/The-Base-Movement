export interface BrandingSettings {
  logo_url: string
  favicon_url: string
  og_image_url: string
  twitter_card_url: string
  founder_image_url: string
  hero_bg_url: string
  banner_image_url: string
  party_hq_image_url: string
  primary_color: string
  accent_color: string
  destructive_color: string
  primary_email: string
  newsletter_email: string
  [key: string]: unknown
}

export const defaultSettings: BrandingSettings = {
  logo_url: '/branding/logo.png',
  favicon_url: '/branding/favicon.ico',
  og_image_url: '/branding/og-image.png',
  twitter_card_url: '/branding/twitter-card.png',
  founder_image_url: '/branding/founder-image.jpg',
  hero_bg_url: '/branding/hero-background-image.png',
  banner_image_url: '/branding/base-banner-image.png',
  party_hq_image_url: '/branding/party-headquarters-image.webp',
  primary_color: '156 100% 21%',
  accent_color: '45 80% 45%',
  destructive_color: '0 85% 44%',
  primary_email: 'info@thebasemovement.com',
  newsletter_email: 'info@thebasemovement.com'
}
