/**
 * Breadcrumbs Component
 * -------------------------------------------------------------
 * Global navigation breadcrumb component that maps routing path segment arrays
 * to user-friendly text labels. Supports:
 * - Dynamic context roots (Home vs Admin Command Center vs Member Dashboard)
 * - Custom overrides dictionary map (e.g. blog -> Updates)
 * - Automatic title resolution fallback from PageLabelContext
 * - Responsive light vs dark themes (using translucency variables)
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePageLabel } from '@/contexts/PageLabelContext'

// Human-readable label overrides for path segments
const LABEL_OVERRIDES: Record<string, string> = {
  blog: 'Updates',
  blogs: 'Blog posts',
  dashboard: 'Dashboard',
  admin: 'Admin',
  authors: 'Authors',
  broadcasts: 'Broadcasts',
  members: 'Members',
  store: 'Store',
  chapters: 'Chapters',
  'chapter-ops': 'Chapter Ops',
  settings: 'Settings',
  trash: 'Trash Vault',
  'media-library': 'Media Library',
  polls: 'Polls',
  regions: 'Regions',
  new: 'New',
  edit: 'Edit',
  officers: 'Leadership',
  'our-agenda': 'Our Agenda',
  contact: 'Contact',
  donate: 'Donate',
  impact: 'Impact',
  register: 'Register',
}

// Routes where the Breadcrumbs component should render
const SUPPORTED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/blog',
  '/donate',
  '/impact',
  '/store',
  '/our-agenda',
  '/polls',
  '/chapters',
  '/contact',
  '/press',
  '/privacy',
  '/terms',
  '/officers',
  '/register',
]

/**
 * Maps pathname prefixes to their respective root landing anchors and names.
 */
function getRootContext(pathname: string): { label: string; to: string } {
  if (pathname.startsWith('/admin')) return { label: 'Admin', to: '/admin/dashboard' }
  if (pathname.startsWith('/dashboard')) return { label: 'Dashboard', to: '/dashboard' }
  if (pathname.startsWith('/blog')) return { label: 'Home', to: '/' }
  return { label: 'Home', to: '/' }
}

// Segments to skip (already shown as root)
const SKIP_SEGMENTS = new Set(['dashboard', 'admin'])

/**
 * Resolves a text label for a given path segment string.
 * @param value - The raw URL segment (e.g., 'media-library')
 * @param pathname - The full current browser path
 * @param post - Optional display override for dynamic ID segments
 * @returns A formatted, human-readable string.
 *
 * Strips dash hyphens, capitalizes words, and handles UUID detail codes.
 */
function getLabel(value: string, pathname: string, post?: string): string {
  if (value === 'chapters' && pathname.startsWith('/admin')) return 'Chapter Management'
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value]
  if (/^[0-9a-f-]{8,}$/i.test(value) || !isNaN(Number(value))) return post || 'Details'
  return value
    .replace(/-/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface BreadcrumbsProps {
  /** Optional override for the last segment label (e.g. blog post title) */
  currentLabel?: string
  /** 'light' (default) for white/light backgrounds; 'dark' for dark hero backgrounds */
  variant?: 'light' | 'dark'
}

export function Breadcrumbs({ currentLabel: labelProp, variant = 'light' }: BreadcrumbsProps = {}) {
  const location = useLocation()
  const { currentLabel: contextLabel } = usePageLabel()
  const currentLabel = labelProp || contextLabel || undefined
  const pathnames = location.pathname.split('/').filter((x) => x)

  if (!SUPPORTED_PREFIXES.some((p) => location.pathname.startsWith(p))) return null

  const root = getRootContext(location.pathname)

  const isDark = variant === 'dark'

  const navClass = isDark
    ? 'breadcrumb-nav flex items-center gap-2 mb-6 mt-5 backdrop-blur-sm px-4 py-2 rounded-full border'
    : 'breadcrumb-nav flex items-center gap-2 mb-8 mt-5 backdrop-blur-sm px-4 py-2 rounded-full border'

  const navStyle = isDark
    ? { background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.15)' }
    : { background: 'hsl(var(--card) / 0.5)', borderColor: 'hsl(var(--border) / 0.5)' }

  const mutedClass = isDark
    ? 'text-white/50 hover:text-white transition-colors flex items-center gap-1.5 shrink-0'
    : 'hover:text-[hsl(var(--brand-green))] transition-colors flex items-center gap-1.5 shrink-0'

  const mutedStyle = isDark ? undefined : { color: 'hsl(var(--on-surface-muted))' }

  const chevronClass = isDark ? 'text-white/30 shrink-0' : 'shrink-0'
  const chevronStyle = isDark ? undefined : { color: 'hsl(var(--border))' }

  const activeClass = isDark
    ? 'text-xs font-medium text-white font-meta max-w-[140px] truncate shrink-0'
    : 'text-xs font-medium font-meta max-w-[140px] truncate shrink-0'

  const activeStyle = isDark ? undefined : { color: 'hsl(var(--primary))' }

  const inactiveLinkClass = isDark
    ? 'text-white/50 hover:text-white transition-colors text-xs font-medium font-meta shrink-0'
    : 'hover:text-[var(--brand-green)] transition-colors text-xs font-medium font-meta shrink-0'

  const inactiveLinkStyle = isDark ? undefined : { color: 'hsl(var(--on-surface-muted))' }

  return (
    <nav aria-label="Breadcrumb" className={navClass} style={navStyle}>
      <Link to={root.to} className={mutedClass} style={mutedStyle}>
        <span className="material-symbols-outlined shrink-0" style={{ fontSize: 14 }}>
          home
        </span>
        <span className="text-xs font-medium font-meta shrink-0">{root.label}</span>
      </Link>

      {pathnames.map((value, index) => {
        if (SKIP_SEGMENTS.has(value)) return null

        const last = index === pathnames.length - 1

        if (!last && ['edit', 'new'].includes(value)) return null

        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const segmentLabel = getLabel(value, location.pathname)

        return (
          <React.Fragment key={to}>
            <span
              className={`material-symbols-outlined ${chevronClass}`}
              style={{ fontSize: 12, ...chevronStyle }}
            >
              chevron_right
            </span>
            {last ? (
              <span className={activeClass} style={activeStyle}>
                {currentLabel || segmentLabel}
              </span>
            ) : (
              <Link to={to} className={inactiveLinkClass} style={inactiveLinkStyle}>
                {segmentLabel}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
