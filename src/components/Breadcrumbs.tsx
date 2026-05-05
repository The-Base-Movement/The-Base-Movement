import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  // Only show in dashboard or admin
  if (!location.pathname.includes('/dashboard') && !location.pathname.includes('/admin')) return null

  return (
    <nav className="flex items-center gap-2 mb-8 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200/50 w-fit">
      <Link 
        to={location.pathname.includes('/admin') ? "/admin/dashboard" : "/dashboard"} 
        className="text-stone-400 hover:text-[var(--brand-green)] transition-colors flex items-center gap-1.5"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold font-meta">{location.pathname.includes('/admin') ? "Admin" : "Dashboard"}</span>
      </Link>
      
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        
        // Skip 'dashboard' and 'admin' as we already have the Home icon link
        if (value === 'dashboard' || value === 'admin') return null

        const label = isNaN(Number(value)) 
          ? value.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          : 'Details'

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3 h-3 text-stone-300" />
            {last ? (
              <span className="text-xs font-semibold text-[var(--brand-green)] font-meta">
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
