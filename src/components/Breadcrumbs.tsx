import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

// Human-readable label overrides for path segments
const LABEL_OVERRIDES: Record<string, string> = {
  blog: 'Insights',
  dashboard: 'Dashboard',
  admin: 'Admin',
  authors: 'Authors',
  broadcasts: 'Broadcasts',
  members: 'Members',
  store: 'Store',
  chapters: 'Chapters',
  settings: 'Settings',
  trash: 'Trash Vault',
  'media-library': 'Media Library',
  polls: 'Polls',
  regions: 'Regions',
  new: 'New',
  edit: 'Edit',
}

// Routes where the Breadcrumbs component should render
const SUPPORTED_PREFIXES = ['/dashboard', '/admin', '/blog', '/donate']

// Root labels and links per context
function getRootContext(pathname: string): { label: string; to: string } {
  if (pathname.startsWith('/admin')) return { label: 'Admin', to: '/admin/dashboard' }
  if (pathname.startsWith('/dashboard')) return { label: 'Dashboard', to: '/dashboard' }
  if (pathname.startsWith('/blog')) return { label: 'Home', to: '/' }
  return { label: 'Home', to: '/' }
}

// Segments to skip (already shown as root)
const SKIP_SEGMENTS = new Set(['dashboard', 'admin'])

function getLabel(value: string, post?: string): string {
  if (LABEL_OVERRIDES[value]) return LABEL_OVERRIDES[value]
  // UUID or numeric - use the post title if available, otherwise 'Details'
  if (/^[0-9a-f-]{8,}$/i.test(value) || !isNaN(Number(value))) return post || 'Details'
  return value.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

interface BreadcrumbsProps {
  /** Optional override for the last segment label (e.g. blog post title) */
  currentLabel?: string
}

export function Breadcrumbs({ currentLabel }: BreadcrumbsProps = {}) {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  if (!SUPPORTED_PREFIXES.some(p => location.pathname.startsWith(p))) return null

  const root = getRootContext(location.pathname)

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-8 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200/50 w-fit">
      <Link
        to={root.to}
        className="text-stone-400 hover:text-[var(--brand-green)] transition-colors flex items-center gap-1.5"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold font-meta">{root.label}</span>
      </Link>

      {pathnames.map((value, index) => {
        if (SKIP_SEGMENTS.has(value)) return null
        
        const last = index === pathnames.length - 1
        
        // Skip action segments if they are not the last segment (e.g. skip 'edit' in /admin/authors/edit/1)
        if (!last && ['edit', 'new'].includes(value)) return null

        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const label = last && currentLabel ? currentLabel : getLabel(value)

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-stone-300" />
            {last ? (
              <span className="text-xs font-semibold text-[var(--brand-green)] font-meta max-w-[200px] truncate">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="text-stone-400 hover:text-[var(--brand-green)] transition-colors text-xs font-semibold font-meta"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
