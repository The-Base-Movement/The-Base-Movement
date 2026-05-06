export interface BrandingSettings {
  logo_url: string
  favicon_url: string
  og_image_url: string
  twitter_card_url: string
  primary_email: string
  newsletter_email: string
  [key: string]: unknown
}

export const defaultSettings: BrandingSettings = {
  logo_url: '/branding/logo.png',
  favicon_url: '/favicons/favicon-32x32.png',
  og_image_url: '/branding/og-image.png',
  twitter_card_url: '/branding/twitter-card.png',
  primary_email: 'info@thebasemovement.com',
  newsletter_email: 'info@thebasemovement.com'
}
