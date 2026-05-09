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
  registration_form_ghana_url: string
  registration_form_diaspora_url: string
  primary_email: string
  newsletter_email: string
  font_scale_global: number
  font_scale_headings: number
  button_border_radius: string
  button_font_weight: string
  button_neon_enabled: boolean
  button_primary_text_color: string
  button_gold_text_color: string
  button_destructive_text_color: string
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
  registration_form_ghana_url: '/docs/registration-form-ghana.pdf',
  registration_form_diaspora_url: '/docs/registration-form-diaspora.pdf',
  primary_email: 'info@thebasemovement.com',
  newsletter_email: 'info@thebasemovement.com',
  font_scale_global: 1.0,
  font_scale_headings: 1.0,
  muted_foreground_color: '0 0% 55%',
  on_surface_muted_color: '0 0% 55%',
  button_border_radius: '0.125rem',
  button_font_weight: '700',
  button_neon_enabled: true,
  button_primary_text_color: '0 0% 100%',
  button_gold_text_color: '220 15% 15%',
  button_destructive_text_color: '0 0% 100%'
}
