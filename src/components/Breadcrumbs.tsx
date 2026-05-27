import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { usePageLabel } from '@/contexts/PageLabelContext'

// Human-readable label overrides for path segments
const LABEL_OVERRIDES: Record<string, string> = {
  blog: 'Updates',
  dashboard: 'Dashboard',
  admin: 'Admin',
  authors: 'Authors',
  broadcasts: 'Broadcasts',
  members: 'Members',
  store: 'Store',
  chapters: 'Chapters',
  'chapter-hub': 'Reg.',
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
]

// Root labels and links per context
function getRootContext(pathname: string): { label: string; to: string } {
  if (pathname.startsWith('/admin')) return { label: 'Admin', to: '/admin/dashboard' }
  if (pathname.startsWith('/dashboard')) return { label: 'Dashboard', to: '/dashboard' }
  if (pathname.startsWith('/blog')) return { label: 'Home', to: '/' }
  return { label: 'Home', to: '/' }
}

// Segments to skip (already shown as root)
const SKIP_SEGMENTS = new Set(['dashboard', 'admin'])

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
    ? 'flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/15 w-fit max-w-full overflow-hidden'
    : 'flex items-center gap-2 mb-8 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200/50 w-fit max-w-full overflow-hidden'

  const mutedClass = isDark
    ? 'text-white/50 hover:text-white transition-colors flex items-center gap-1.5'
    : 'text-stone-400 hover:text-[var(--brand-green)] transition-colors flex items-center gap-1.5'

  const chevronClass = isDark ? 'text-white/30' : 'text-stone-300'

  const activeClass = isDark
    ? 'text-xs font-medium text-white font-meta max-w-[120px] sm:max-w-[200px] truncate'
    : 'text-xs font-medium text-[var(--brand-green)] font-meta max-w-[120px] sm:max-w-[200px] truncate'

  const inactiveLinkClass = isDark
    ? 'text-white/50 hover:text-white transition-colors text-xs font-medium font-meta'
    : 'text-stone-400 hover:text-[var(--brand-green)] transition-colors text-xs font-medium font-meta'

  return (
    <nav aria-label="Breadcrumb" className={navClass}>
      <Link to={root.to} className={mutedClass}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          home
        </span>
        <span className="text-xs font-medium font-meta">{root.label}</span>
      </Link>

      {pathnames.map((value, index) => {
        if (SKIP_SEGMENTS.has(value)) return null

        const last = index === pathnames.length - 1

        if (!last && ['edit', 'new'].includes(value)) return null

        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const label = last && currentLabel ? currentLabel : getLabel(value, location.pathname)

        return (
          <React.Fragment key={to}>
            <span className={`material-symbols-outlined ${chevronClass}`} style={{ fontSize: 12 }}>
              chevron_right
            </span>
            {last ? (
              <span className={activeClass}>{label}</span>
            ) : (
              <Link to={to} className={inactiveLinkClass}>
                {label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
