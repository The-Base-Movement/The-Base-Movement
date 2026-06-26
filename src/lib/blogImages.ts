export const BLOG_IMAGE_PLACEHOLDER = '/branding/og-image.png'

export function getBlogImageUrl(imageUrl?: string | null) {
  return imageUrl?.trim() || BLOG_IMAGE_PLACEHOLDER
}
