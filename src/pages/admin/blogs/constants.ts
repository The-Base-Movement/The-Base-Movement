/**
 * blogs/constants.ts
 * ─────────────────────────────────────────────────────────────────
 * Shared constants used across Blogs sub-components.
 * CATEGORY_PLACEHOLDERS: fallback Unsplash cover images keyed by category.
 */

/** Fallback cover image per category when a post has no imageUrl */
export const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  Movement:
    'https://images.unsplash.com/photo-1540910419842-dfb322c98b3c?q=80&w=1200&auto=format&fit=crop',
  Youth:
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
  Economy:
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
  Diaspora:
    'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=1200&auto=format&fit=crop',
  Integrity:
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop',
  Community:
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
  Impact:
    'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=1200&auto=format&fit=crop',
}

/** Catch-all fallback when a category has no placeholder */
export const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop'

/** Allowed blog post categories */
export const CATEGORIES = ['Movement', 'Youth', 'Economy', 'Diaspora', 'Integrity', 'Community']
