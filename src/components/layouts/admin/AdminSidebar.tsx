/**
 * Admin Sidebar Navigation Component
 * -------------------------------------------------------------
 * Renders the primary sidebar navigation menu for the admin dashboard,
 * supporting collapsible groups, sub-items, responsive toggling, and
 * role-based route access controls.
 */

import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { getNavGroups } from './navConfig'
import type { AdminUser } from '@/types/admin'

interface AdminSidebarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  user: AdminUser | null
  avatarUrl: string | null
  logoUrl: string
  handleLogout: () => void
  pendingVerificationsCount: number
  pendingDonationsCount: number
  unreadMessagesCount?: number
}

// Sidebar navigation container component containing all admin navigation paths
export function AdminSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  user,
  avatarUrl,
  logoUrl,
  handleLogout,
  pendingVerificationsCount,
  pendingDonationsCount,
  unreadMessagesCount = 0,
}: AdminSidebarProps) {
  const location = useLocation()
  const [prevPathname, setPrevPathname] = useState('')

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Overview: true,
    Members: true,
    Finance: true,
    Logistics: true,
    Field: true,
    Content: true,
    System: true,
  })

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Compute filtered navigation groups based on user roles and permissions
  const filteredNavGroups = useMemo(() => {
    const navGroups = getNavGroups(
      pendingVerificationsCount,
      pendingDonationsCount,
      unreadMessagesCount
    )
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          // Explicit role allow-list takes precedence over every other gate.
          if (item.allowedRoles) {
            return !!user?.role && item.allowedRoles.includes(user.role)
          }
          if (item.superAdminOnly) {
            const role = user?.role
            if (role !== 'SUPER_ADMIN' && role !== 'FOUNDER') return false
          }
          if (item.executiveOnly) {
            const role = user?.role
            if (role !== 'EXECUTIVE' && role !== 'SUPER_ADMIN' && role !== 'FOUNDER') return false
          }
          if (!item.permission) return true
          return adminService.can(item.permission.action, item.permission.resource)
        }),
      }))
      .filter((group) => group.items.length > 0)
  }, [user, pendingVerificationsCount, pendingDonationsCount, unreadMessagesCount])

  // Synchronize active sidebar group with route changes
  useEffect(() => {
    if (prevPathname === location.pathname) return

    const timer = setTimeout(() => {
      setPrevPathname(location.pathname)

      const currentPath = location.pathname
      const activeGroup = filteredNavGroups.find((group) =>
        group.items.some((item) => {
          if (item.to === currentPath) return true
          if (item.subItems?.some((sub) => sub.to === currentPath)) return true
          if (item.to !== '/admin/dashboard' && currentPath.startsWith(item.to)) return true
          return false
        })
      )

      if (activeGroup) {
        setOpenGroups((prev) => {
          const nextGroups: Record<string, boolean> = {}
          Object.keys(prev).forEach((key) => {
            nextGroups[key] = key === activeGroup.label
          })
          return nextGroups
        })
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [location.pathname, filteredNavGroups, prevPathname])

  const toggleGroup = (groupLabel: string) => {
    if (!isSidebarOpen) setIsSidebarOpen(true)
    setOpenGroups((prev) => {
      const isCurrentlyOpen = prev[groupLabel]
      const newOpenGroups: Record<string, boolean> = {}
      Object.keys(prev).forEach((key) => {
        newOpenGroups[key] = key === groupLabel ? !isCurrentlyOpen : false
      })
      return newOpenGroups
    })
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0f1310] text-white transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-black',
        isSidebarOpen
          ? 'translate-x-0 w-[220px]'
          : '-translate-x-full w-[220px] lg:w-[76px] lg:translate-x-0'
      )}
    >
      <div className="h-full flex flex-col">
        {/* Brand Header */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-white/[0.08] mb-3 overflow-hidden transition-all duration-300',
            isSidebarOpen ? 'justify-start px-[18px]' : 'justify-center px-0'
          )}
        >
          <Link
            to="/admin/dashboard"
            className={cn('flex items-center shrink-0', isSidebarOpen ? 'gap-4' : 'gap-0')}
          >
            <div
              className={cn(
                'bg-white flex items-center justify-center shadow-2xl shrink-0 transition-all duration-300',
                isSidebarOpen ? 'w-10 h-10 p-1.5' : 'w-9 h-9 p-1'
              )}
              style={{ borderRadius: 'var(--radius-md)' }}
            >
              <img
                src={logoUrl}
                alt="The Base Logo"
                className="w-full h-full object-contain"
                decoding="async"
              />
            </div>
            <div
              className={cn(
                'transition-all duration-300 origin-left',
                isSidebarOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 w-0'
              )}
            >
              <p className="text-white font-medium text-sm leading-none mb-0 tracking-tight">
                The Base
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <p className="text-[hsl(var(--destructive))] text-[9px] font-semibold tracking-[0.08em] uppercase leading-none">
                  Admin · Ops
                </p>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <p className="text-white/40 text-[8px] font-medium uppercase leading-none tracking-tight">
                  HQ
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* View Site link */}
        <div
          className={cn(
            'px-3 mb-2 transition-all duration-300',
            isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
          )}
        >
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white/90 hover:text-white rounded-lg transition-all group border border-white/5"
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: 16, color: 'hsl(var(--accent))' }}
            >
              open_in_new
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em]">View Site</span>
          </a>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto scrollbar-hide">
          {filteredNavGroups.map((group) => {
            const isOpen = openGroups[group.label]

            return (
              <div key={group.label} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1 hover:bg-white/5 transition-colors group',
                    isSidebarOpen ? '' : 'justify-center'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {isSidebarOpen ? (
                      <span
                        className="text-[9px] font-medium tracking-[0.08em] uppercase whitespace-nowrap py-1"
                        style={{ color: 'hsl(var(--accent))' }}
                      >
                        {group.label}
                      </span>
                    ) : (
                      <span
                        className="material-symbols-outlined shrink-0"
                        style={{ fontSize: 16, color: 'hsl(var(--accent))' }}
                      >
                        {group.icon}
                      </span>
                    )}
                  </div>
                  {isSidebarOpen && (
                    <span
                      className={cn(
                        'material-symbols-outlined transition-transform duration-200',
                        isOpen ? 'rotate-180' : ''
                      )}
                      style={{ fontSize: 14, color: 'hsl(var(--accent))' }}
                    >
                      expand_more
                    </span>
                  )}
                </button>

                {/* Group Items */}
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-300 relative',
                    isOpen && isSidebarOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                  )}
                >
                  {group.items.map((item) => {
                    const hasSubItems = item.subItems && item.subItems.length > 0
                    const isParentActive = hasSubItems
                      ? location.pathname.startsWith(item.to)
                      : location.pathname === item.to

                    const isExpanded = !!(
                      expandedItems[item.to] ||
                      (hasSubItems && location.pathname.startsWith(item.to))
                    )

                    return (
                      <div key={item.to} className="space-y-0.5">
                        <div className="flex items-center justify-between relative group/item mx-[8px] rounded-[3px]">
                          <Link
                            to={item.to}
                            className={cn(
                              'flex items-center gap-[10px] px-[10px] py-[8px] flex-1 transition-all rounded-[3px] font-display font-medium text-[11.5px]',
                              isParentActive && !hasSubItems
                                ? 'bg-[hsl(var(--destructive))] text-white shadow-sm'
                                : isParentActive
                                  ? 'text-white bg-white/5 font-semibold'
                                  : 'text-white/70 hover:text-white hover:bg-white/5'
                            )}
                            onClick={() => {
                              if (hasSubItems) {
                                setExpandedItems((prev) => ({
                                  ...prev,
                                  [item.to]: !prev[item.to],
                                }))
                              }
                              if (!hasSubItems && window.innerWidth < 1024) {
                                setIsSidebarOpen(false)
                              }
                            }}
                          >
                            <span
                              className="material-symbols-outlined shrink-0"
                              style={{ fontSize: 16 }}
                            >
                              {item.icon}
                            </span>
                            <span className="whitespace-nowrap flex-1">{item.label}</span>
                            {item.pill && (
                              <span
                                className={cn(
                                  'px-[7px] py-[1px] rounded-full text-[9px] font-semibold mr-1',
                                  isParentActive
                                    ? 'bg-black/30 text-white'
                                    : 'bg-[hsl(var(--destructive))] text-white'
                                )}
                              >
                                {item.pill}
                              </span>
                            )}
                          </Link>

                          {hasSubItems && (
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setExpandedItems((prev) => ({
                                  ...prev,
                                  [item.to]: !prev[item.to],
                                }))
                              }}
                              className={cn(
                                'absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors duration-150',
                                isParentActive ? 'text-white/70' : ''
                              )}
                            >
                              <span
                                className={cn(
                                  'material-symbols-outlined transition-transform duration-200 block',
                                  isExpanded ? 'rotate-180' : ''
                                )}
                                style={{ fontSize: 14 }}
                              >
                                expand_more
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Sub-items container */}
                        {hasSubItems && (
                          <div
                            className={cn(
                              'overflow-hidden transition-all duration-300 relative space-y-0.5',
                              isExpanded && isSidebarOpen
                                ? 'max-h-[500px] opacity-100 mt-0.5'
                                : 'max-h-0 opacity-0'
                            )}
                          >
                            {item.subItems?.map((subItem) => {
                              const isSubActive =
                                subItem.to === item.to
                                  ? location.pathname === subItem.to
                                  : location.pathname.startsWith(subItem.to)

                              return (
                                <Link
                                  key={subItem.to}
                                  to={subItem.to}
                                  className={cn(
                                    'flex items-center gap-[8px] pl-[34px] pr-[10px] py-[6px] mx-[8px] transition-all rounded-[3px] font-display font-medium text-[10.5px]',
                                    isSubActive
                                      ? 'bg-[hsl(var(--destructive))] text-white shadow-sm'
                                      : 'text-white/50 hover:text-white hover:bg-white/5'
                                  )}
                                  onClick={() => {
                                    if (window.innerWidth < 1024) setIsSidebarOpen(false)
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined shrink-0"
                                    style={{ fontSize: 13 }}
                                  >
                                    {subItem.icon}
                                  </span>
                                  <span className="whitespace-nowrap flex-1">{subItem.label}</span>
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Footer — user profile + sign out */}
        <div className="bg-black/20 border-t border-white/5">
          {isSidebarOpen ? (
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-sm)',
                    background: 'hsl(var(--primary))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.name || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      decoding="async"
                    />
                  ) : (
                    user?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2) || 'HQ'
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: '#fff',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user?.name || 'Admin'}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9.5,
                      color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.3,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {user?.role === 'FOUNDER'
                      ? 'Movement Founder'
                      : user?.role === 'ORGANIZER'
                        ? 'Strategic Organizer'
                        : user?.role === 'EXECUTIVE'
                          ? 'Executive'
                          : user?.role === 'SUPER_ADMIN'
                            ? 'System Admin'
                            : user?.role === 'ADMIN'
                              ? 'Administrator'
                              : user?.role === 'FINANCE_OFFICER'
                                ? 'Finance Officer'
                                : user?.role === 'REGIONAL_DIRECTOR'
                                  ? 'Regional Director'
                                  : user?.role === 'CONSTITUENCY_LEAD'
                                    ? 'Constituency Lead'
                                    : 'Staff'}
                  </div>
                </div>
              </div>
              <Link
                to="/dashboard"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  marginBottom: 6,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  person
                </span>
                Member Dashboard
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 11,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  logout
                </span>
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-center py-3 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                style={{ textDecoration: 'none' }}
                title="Member Dashboard"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  person
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center py-4 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  logout
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
