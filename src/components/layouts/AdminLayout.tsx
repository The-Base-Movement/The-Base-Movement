import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import SEO from '@/components/SEO'
import { cn, getCountryFlag } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { donationService } from '@/services/donationService'
import { authService } from '@/services/authService'
import { useBranding } from '@/hooks/useBranding'
import { useAuth } from '@/context/AuthContext'
import { CountryBadge } from '@/components/CountryBadge'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageLabelProvider } from '@/contexts/PageLabelContext'
import type { GlobalSearchResult, AdminUser, Notification, AdminPermission } from '@/types/admin'
import { SubmitTicketModal } from '@/components/admin/SubmitTicketModal'

const FINANCE_OFFICER_ALLOWED_PATHS = [
  '/admin/finance-dashboard',
  '/admin/donations',
  '/admin/spending-ledger',
  '/admin/store',
  '/admin/orders',
  '/admin/finance-requests',
  '/admin/finance-requests/review-inbox',
]

const EXECUTIVE_ALLOWED_PATHS = [
  '/admin/executive',
  '/admin/finance-dashboard',
  '/admin/finance-requests',
  '/admin/finance-requests/review-inbox',
  '/admin/war-room',
  '/admin/mobilization-metrics',
  '/admin/ground-game',
  '/admin/polling-stations',
  '/admin/broadcasts',
  '/admin/directives',
  '/admin/deploy',
  '/admin/priorities',
  '/admin/polls',
  '/admin/plan-manager',
  '/admin/roadmap',
  '/admin/party-officials',
  '/admin/administrators',
  '/admin/members',
]

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const { settings } = useBranding()
  const { session } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  )
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
  const prevPathname = useRef('')
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(adminService.getCurrentUser())
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  )
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState<number>(0)
  const [pendingDonationsCount, setPendingDonationsCount] = useState<number>(0)
  const [submitTicketOpen, setSubmitTicketOpen] = useState(false)

  const canSubmitTicket =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'FOUNDER' ||
    (user?.permissions ?? []).some(
      (p) => p.action === 'SUBMIT_IT_TICKET' && p.resource === 'IT_SUPPORT'
    )

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    const applyDensity = () => {
      const density = localStorage.getItem('admin_interface_density') || 'Comfortable'
      const root = document.documentElement

      if (density === 'Compact') {
        root.style.setProperty('--admin-padding', '1.5rem')
        root.style.setProperty('--admin-gap', '1rem')
        root.style.setProperty('--admin-font-scale', '0.95')
      } else if (density === 'High Density') {
        root.style.setProperty('--admin-padding', '1rem')
        root.style.setProperty('--admin-gap', '0.75rem')
        root.style.setProperty('--admin-font-scale', '0.9')
      } else {
        root.style.setProperty('--admin-padding', '3rem')
        root.style.setProperty('--admin-gap', '2rem')
        root.style.setProperty('--admin-font-scale', '1')
      }
    }

    applyDensity()
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('admin_density_changed', applyDensity)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('admin_density_changed', applyDensity)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const currentUser = await adminService.initialize()
      if (!currentUser) {
        navigate('/admin-login')
      } else {
        setUser(currentUser)

        // Resolve avatar from auth session (using the one from AuthContext if available)
        const sessionAvatar = session?.user?.user_metadata?.avatar_url || null
        setAvatarUrl(currentUser.avatarUrl || sessionAvatar || null)

        // Fetch unread notifications
        try {
          const [notes, pendingVer, pendingDon] = await Promise.all([
            adminService.getNotifications(),
            adminService.getPendingVerifications(),
            donationService.getPendingDonations(),
          ])
          setNotifications(notes)
          setUnreadCount(notes.filter((n: Notification) => !n.is_read).length)
          setPendingVerificationsCount(pendingVer.length)
          setPendingDonationsCount(pendingDon.length)
        } catch (err) {
          console.error('Failed to fetch admin notifications/counts:', err)
        }
      }
    }
    init()
  }, [navigate, session])

  // 15-minute inactivity timeout — sign out and return to admin login
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const TIMEOUT_MS = 15 * 60 * 1000
    const reset = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      inactivityTimer.current = setTimeout(async () => {
        await authService.logout()
        navigate('/admin-login')
      }, TIMEOUT_MS)
    }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [navigate])

  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await adminService.markNotificationRead(id)
      if (success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
      await Promise.all(unreadIds.map((id) => adminService.markNotificationRead(id)))
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  // Global Search Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true)
        setShowSearchResults(true)
        try {
          const results = await adminService.globalSearch(searchQuery)
          setSearchResults(results)
        } catch (error) {
          console.error('Search failed:', error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  interface NavItem {
    to: string
    icon: string
    label: string
    pill?: string
    superAdminOnly?: boolean
    executiveOnly?: boolean
    permission?: {
      action: AdminPermission['action']
      resource: AdminPermission['resource']
    }
    subItems?: NavItem[]
  }

  const navGroups: { label: string; icon: string; items: NavItem[] }[] = [
    {
      label: 'Overview',
      icon: 'dashboard',
      items: [
        {
          to: '/admin/executive',
          icon: 'corporate_fare',
          label: 'Executive Dashboard',
          executiveOnly: true,
        },
        { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/admin/war-room', icon: 'radio', label: 'War Room', pill: 'LIVE' },
        { to: '/admin/analytics', icon: 'bar_chart', label: 'Analytics' },
        { to: '/admin/logistics-intelligence', icon: 'inventory_2', label: 'Logistics' },
        { to: '/admin/mobilization-metrics', icon: 'my_location', label: 'Deployment metrics' },
        { to: '/admin/sentiment-intelligence', icon: 'psychology', label: 'Sentiment AI' },
        { to: '/admin/ml-intelligence', icon: 'auto_awesome', label: 'ML Intelligence' },
      ],
    },
    {
      label: 'Members',
      icon: 'group',
      items: [
        {
          to: '/admin/members',
          icon: 'group',
          label: 'Member directory',
          permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
        },
        {
          to: '/admin/verification',
          icon: 'verified_user',
          label: 'KYC queue',
          pill: pendingVerificationsCount > 0 ? pendingVerificationsCount.toString() : undefined,
          permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' },
        },
        {
          to: '/admin/leadership',
          icon: 'shield',
          label: 'Leadership hub',
          permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
        },
      ],
    },
    {
      label: 'Finance',
      icon: 'account_balance_wallet',
      items: [
        {
          to: '/admin/finance-dashboard',
          icon: 'analytics',
          label: 'Finance dashboard',
          permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
        },
        {
          to: '/admin/donations',
          icon: 'payments',
          label: 'Donations',
          pill: pendingDonationsCount > 0 ? pendingDonationsCount.toString() : undefined,
          permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
        },
        {
          to: '/admin/spending-ledger',
          icon: 'receipt_long',
          label: 'Expenses',
          permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
        },
        {
          to: '/admin/finance-requests',
          icon: 'request_quote',
          label: 'Finance requests',
          permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
        },
        {
          to: '/admin/finance-requests/review-inbox',
          icon: 'inbox',
          label: 'Review inbox',
          permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
        },
      ],
    },
    {
      label: 'Logistics',
      icon: 'inventory_2',
      items: [
        {
          to: '/admin/store',
          icon: 'shopping_bag',
          label: 'Store inventory',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/orders',
          icon: 'local_shipping',
          label: 'Member orders',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/regions',
          icon: 'location_on',
          label: 'Jurisdictions',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
      ],
    },
    {
      label: 'Field',
      icon: 'location_on',
      items: [
        {
          to: '/admin/chapters',
          icon: 'location_on',
          label: 'Chapter management',
          permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
        },
        {
          to: '/admin/constituencies',
          icon: 'map',
          label: 'Constituency management',
          permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
        },
        {
          to: '/admin/regional-hub',
          icon: 'shield',
          label: 'Regional hub',
          permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' },
        },
        {
          to: '/admin/ground-game',
          icon: 'how_to_vote',
          label: 'Constituency Operations',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/polling-stations',
          icon: 'ballot',
          label: 'Polling stations',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/broadcasts',
          icon: 'campaign',
          label: 'Mass mobilization',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/newsletter',
          icon: 'mail',
          label: 'Newsletter',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/directives',
          icon: 'my_location',
          label: 'Tactical directives',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/deploy',
          icon: 'my_location',
          label: 'Deploy asset',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/priorities',
          icon: 'shield',
          label: 'Strategic focus',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
      ],
    },
    {
      label: 'Content',
      icon: 'description',
      items: [
        {
          to: '/admin/blogs',
          icon: 'description',
          label: 'Blog posts',
          permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
        },
        {
          to: '/admin/authors',
          icon: 'edit',
          label: 'Authors',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/media',
          icon: 'image',
          label: 'Media library',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/polls',
          icon: 'how_to_vote',
          label: 'Polls',
          permission: { action: 'MANAGE_POLLS', resource: 'POLLS' },
        },
        {
          to: '/admin/jobs',
          icon: 'work',
          label: 'Jobs Board',
          permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
        },
        {
          to: '/admin/moderation',
          icon: 'shield_person',
          label: 'Moderation',
          permission: { action: 'MANAGE_BLOGS', resource: 'BLOGS' },
        },
        {
          to: '/admin/plan-manager',
          icon: 'route',
          label: 'Mission plan',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
      ],
    },
    {
      label: 'System',
      icon: 'settings',
      items: [
        {
          to: '/admin/administrators',
          icon: 'shield',
          label: 'Administrators',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/roles',
          icon: 'manage_accounts',
          label: 'Roles manager',
          superAdminOnly: true,
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/it-department',
          icon: 'computer',
          label: 'IT Department',
          superAdminOnly: true,
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
          subItems: [
            { to: '/admin/it-department', icon: 'dashboard', label: 'Overview' },
            { to: '/admin/it-department/tickets', icon: 'confirmation_number', label: 'Helpdesk' },
            { to: '/admin/it-department/projects', icon: 'folder_open', label: 'Projects' },
            { to: '/admin/it-department/notes', icon: 'sticky_note_2', label: 'Notes' },
            { to: '/admin/it-department/todos', icon: 'checklist', label: 'To-Dos' },
            {
              to: '/admin/it-department/security-protocols',
              icon: 'security',
              label: 'Security Protocols',
            },
            { to: '/admin/it-department/system', icon: 'shield', label: 'System' },
            { to: '/admin/it-department/licenses', icon: 'license', label: 'Licenses' },
            { to: '/admin/it-department/assets', icon: 'inventory_2', label: 'Assets' },
            { to: '/admin/it-department/hierarchy', icon: 'account_tree', label: 'Hierarchy' },
          ],
        },
        {
          to: '/admin/party-officials',
          icon: 'badge',
          label: 'Party Officials',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/roadmap',
          icon: 'route',
          label: 'Mission roadmap',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/settings',
          icon: 'settings',
          label: 'Core settings',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
        {
          to: '/admin/trash',
          icon: 'delete',
          label: 'Audit trash',
          permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
        },
      ],
    },
  ]

  const filteredNavGroups = useMemo(() => {
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.superAdminOnly) {
            const role = user?.role
            if (role !== 'SUPER_ADMIN' && role !== 'FOUNDER') return false
          }
          if (item.executiveOnly) {
            const role = user?.role
            if (role !== 'EXECUTIVE' && role !== 'SUPER_ADMIN' && role !== 'FOUNDER') return false
          }
          if (user?.role === 'FINANCE_OFFICER') {
            return FINANCE_OFFICER_ALLOWED_PATHS.includes(item.to)
          }
          if (user?.role === 'EXECUTIVE') {
            return EXECUTIVE_ALLOWED_PATHS.includes(item.to)
          }
          if (!item.permission) return true
          return adminService.can(item.permission.action, item.permission.resource)
        }),
      }))
      .filter((group) => group.items.length > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (prevPathname.current !== location.pathname) {
      prevPathname.current = location.pathname
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
    }
  }, [location.pathname, filteredNavGroups])

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

  const handleLogout = () => {
    navigate('/admin-login')
  }

  return (
    <div className="h-screen bg-[#f1f5ee] font-meta text-on-surface flex overflow-hidden admin-context">
      <SEO noindex />
      <div
        className={cn(
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden',
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0f1310] text-white transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-black',
          isSidebarOpen ? 'translate-x-0 w-[220px]' : '-translate-x-full lg:w-0 lg:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col">
          <div
            className={cn(
              'h-16 flex items-center border-b border-white/[0.08] mb-3 overflow-hidden transition-all duration-300',
              isSidebarOpen ? 'px-[18px]' : 'px-5'
            )}
          >
            <Link to="/admin/dashboard" className="flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 bg-background flex items-center justify-center shadow-2xl p-1.5 shrink-0">
                <img
                  src={settings.logo_url}
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em]">
                View Site
              </span>
            </a>
          </div>

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
                        <span className="text-[9px] font-medium text-white/35 tracking-[0.08em] uppercase whitespace-nowrap py-1">
                          {group.label}
                        </span>
                      ) : (
                        <span
                          className="material-symbols-outlined shrink-0"
                          style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}
                        >
                          {group.icon}
                        </span>
                      )}
                    </div>
                    {isSidebarOpen && (
                      <span
                        className={cn(
                          'material-symbols-outlined text-white/30 transition-transform duration-200',
                          isOpen ? 'rotate-180' : ''
                        )}
                        style={{ fontSize: 14 }}
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
                                    <span className="whitespace-nowrap flex-1">
                                      {subItem.label}
                                    </span>
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
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center py-4 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  logout
                </span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header
          style={{
            height: 80,
            background: '#fff',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            flexShrink: 0,
            gap: 12,
          }}
        >
          {/* Left: hamburger + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="ico"
              style={{ width: 32, height: 32, flexShrink: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                menu
              </span>
            </button>

            {/* Search — hidden on mobile */}
            <div
              className="desktop-only"
              style={{ position: 'relative', maxWidth: 380, width: '100%' }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 9,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 15,
                  color: 'hsl(var(--on-surface-muted))',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
                search
              </span>
              <input
                aria-label="Search command center…"
                id="admin-search"
                name="adminSearch"
                type="search"
                autoComplete="off"
                placeholder="Search command center…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                style={{
                  width: '100%',
                  height: 34,
                  paddingLeft: 30,
                  paddingRight: 12,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  background: 'hsl(var(--container-low))',
                  color: 'hsl(var(--on-surface))',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Search results */}
              {showSearchResults && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setShowSearchResults(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 6,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      zIndex: 50,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          letterSpacing: '.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Global search
                      </span>
                      {isSearching && (
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 14,
                            color: 'hsl(var(--primary))',
                            animation: 'spin 1s linear infinite',
                          }}
                        >
                          sync
                        </span>
                      )}
                    </div>

                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                      {searchResults.length > 0 ? (
                        searchResults.map((result) => (
                          <Link
                            key={`${result.type}-${result.id}`}
                            to={result.to}
                            onClick={() => {
                              setShowSearchResults(false)
                              setSearchQuery('')
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '10px 12px',
                              borderBottom: '1px solid hsl(var(--border))',
                              textDecoration: 'none',
                              color: 'inherit',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = 'hsl(var(--container-low))')
                            }
                            onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                          >
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 4,
                                background: 'hsl(var(--container-low))',
                                border: '1px solid hsl(var(--border))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <span
                                className="material-symbols-outlined"
                                style={{ fontSize: 14, color: 'hsl(var(--primary))' }}
                              >
                                {result.type === 'Member'
                                  ? 'person'
                                  : result.type === 'Article'
                                    ? 'article'
                                    : result.type === 'Chapter'
                                      ? 'place'
                                      : result.type === 'Product'
                                        ? 'shopping_bag'
                                        : result.type === 'Broadcast'
                                          ? 'campaign'
                                          : 'edit'}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  fontSize: 12.5,
                                  color: 'hsl(var(--on-surface))',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div
                                  style={{
                                    fontFamily: "'Public Sans', sans-serif",
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    fontSize: 10.5,
                                    color: 'hsl(var(--on-surface-muted))',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    marginTop: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  {result.subtitle.split(' · ').map((part, i, arr) => (
                                    <span key={i} className="inline-flex items-center gap-1">
                                      <CountryBadge flag={getCountryFlag(part)} />
                                      {i < arr.length - 1 && (
                                        <span className="mx-1 text-white/20">·</span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span
                              style={{
                                fontFamily: "'Public Sans', sans-serif",
                                fontWeight: 'var(--font-weight-medium, 500)',
                                fontSize: 9.5,
                                color: 'hsl(var(--on-surface-muted))',
                                padding: '2px 6px',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: 3,
                                flexShrink: 0,
                              }}
                            >
                              {result.type}
                            </span>
                          </Link>
                        ))
                      ) : !isSearching ? (
                        <div
                          style={{
                            padding: '28px 16px',
                            textAlign: 'center',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 12,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          No records found for "{searchQuery}"
                        </div>
                      ) : null}
                    </div>

                    <div
                      style={{
                        padding: '8px 12px',
                        background: 'hsl(var(--container-low))',
                        borderTop: '1px solid hsl(var(--border))',
                        textAlign: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 10.5,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        Press{' '}
                        <kbd
                          style={{
                            padding: '1px 5px',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 3,
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 10,
                          }}
                        >
                          ESC
                        </kbd>{' '}
                        to dismiss
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: notifications + divider + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* IT Support */}
            {canSubmitTicket && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSubmitTicketOpen(true)}
                style={{ gap: 6, padding: '0 10px', flexShrink: 0 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  support_agent
                </span>
                <span className="desktop-only">IT Support</span>
              </button>
            )}
            {/* Notification bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="ico"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                style={{ width: 32, height: 32, position: 'relative' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      right: 3,
                      minWidth: 14,
                      height: 14,
                      padding: '0 3px',
                      background: 'hsl(var(--destructive))',
                      color: '#fff',
                      borderRadius: 99,
                      border: '1.5px solid #fff',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationsOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setIsNotificationsOpen(false)}
                  />
                  <div
                    className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0"
                    style={{
                      top: windowWidth < 640 ? 80 : 'calc(100% + 12px)',
                      width: windowWidth < 640 ? 'auto' : 320,
                      background: '#fff',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      zIndex: 50,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid hsl(var(--border))',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'hsl(var(--container-low))',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        Alert center
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'hsl(var(--primary))',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 10,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {notifications.length > 0 ? (
                        notifications.map((note) => (
                          <div
                            key={note.id}
                            onClick={() => !note.is_read && handleMarkAsRead(note.id)}
                            style={{
                              padding: '14px 18px',
                              borderBottom: '1px solid hsl(var(--border))',
                              background: note.is_read ? 'transparent' : 'rgba(206, 17, 38, 0.03)',
                              cursor: note.is_read ? 'default' : 'pointer',
                              display: 'flex',
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                background: note.is_read
                                  ? 'hsl(var(--container-low))'
                                  : 'hsl(var(--destructive))',
                                color: note.is_read ? 'hsl(var(--on-surface-muted))' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                {note.type === 'Alert'
                                  ? 'warning'
                                  : note.type === 'Action'
                                    ? 'rocket_launch'
                                    : note.type === 'Info'
                                      ? 'psychology'
                                      : 'notifications'}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  fontSize: 11.5,
                                  color: 'hsl(var(--on-surface))',
                                  marginBottom: 2,
                                }}
                              >
                                {note.title}
                              </div>
                              <div
                                style={{
                                  fontFamily: "'Public Sans', sans-serif",
                                  fontWeight: 'var(--font-weight-medium, 500)',
                                  fontSize: 10.5,
                                  color: 'hsl(var(--on-surface-muted))',
                                  lineHeight: 1.4,
                                  marginBottom: 6,
                                }}
                              >
                                {note.message}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span
                                  style={{
                                    fontFamily: "'Public Sans', sans-serif",
                                    fontWeight: 'var(--font-weight-medium, 500)',
                                    fontSize: 9,
                                    color: 'hsl(var(--on-surface-muted))',
                                    opacity: 0.6,
                                  }}
                                >
                                  {new Date(note.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {!note.is_read && (
                                  <div
                                    style={{
                                      width: 5,
                                      height: 5,
                                      borderRadius: '50%',
                                      background: 'hsl(var(--destructive))',
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 32,
                              color: 'hsl(var(--on-surface-muted))',
                              opacity: 0.2,
                            }}
                          >
                            notifications_off
                          </span>
                          <p
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 12,
                              color: 'hsl(var(--on-surface-muted))',
                              marginTop: 12,
                            }}
                          >
                            No strategic alerts
                          </p>
                        </div>
                      )}
                    </div>

                    <Link
                      to="/admin/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        borderTop: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--container-low))',
                        textDecoration: 'none',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      View all intelligence
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div
              style={{ width: 1, height: 20, background: 'hsl(var(--border))', margin: '0 4px' }}
            />

            {/* User dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '5px 8px',
                  border: '1px solid transparent',
                  borderRadius: 4,
                  background: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'hsl(var(--container-low))')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                {/* Name + role — hidden on mobile */}
                <div className="desktop-only" style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      lineHeight: 1.3,
                    }}
                  >
                    {user?.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 10.5,
                      color: 'hsl(var(--on-surface-muted))',
                      lineHeight: 1.3,
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
                                    : 'Staff Verifier'}
                  </div>
                </div>
                {/* Avatar */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'hsl(var(--primary))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
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
                      .join('') || 'HQ'
                  )}
                </div>
              </button>

              {/* Dropdown panel */}
              {isUserMenuOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      width: 220,
                      background: '#fff',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 6,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      zIndex: 50,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--border))' }}
                    >
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {user?.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          marginTop: 2,
                        }}
                      >
                        {user?.email}
                      </div>
                    </div>
                    {[
                      { to: '/admin/settings', icon: 'settings', label: 'Administrative settings' },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsUserMenuOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 14px',
                          textDecoration: 'none',
                          color: 'hsl(var(--on-surface))',
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'hsl(var(--container-low))')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid hsl(var(--border))' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        border: 'none',
                        background: 'none',
                        color: 'hsl(var(--destructive))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'hsl(var(--container-low))')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                        logout
                      </span>
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out admin-content-area"
          style={{
            fontSize: `calc(1rem * var(--admin-font-scale, 1))`,
          }}
        >
          <PageLabelProvider>
            <div className="max-w-7xl mx-auto w-full">
              <Breadcrumbs />
              {children || <Outlet />}

              {/* Movement Slogan Footer */}
              <footer
                style={{
                  marginTop: 40,
                  paddingTop: 24,
                  paddingBottom: 24,
                  borderTop: '1px solid hsl(var(--border) / 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  opacity: 0.5,
                  transition: 'opacity 0.5s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
              >
                <div style={{ display: 'flex' }}>
                  <div style={{ height: 3, width: 32, background: 'hsl(var(--destructive))' }} />
                  <div style={{ height: 3, width: 32, background: 'hsl(var(--accent))' }} />
                  <div style={{ height: 3, width: 32, background: 'hsl(var(--primary))' }} />
                </div>
                <div
                  style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9,
                      color: 'hsl(var(--on-surface))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Ghana First, Jobs for the Youth!
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 9,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    © {new Date().getFullYear()} The Base Movement · Operational Command Center
                  </p>
                </div>
              </footer>
            </div>
          </PageLabelProvider>
        </main>
      </div>
      {submitTicketOpen && user && (
        <SubmitTicketModal userId={user.id} onClose={() => setSubmitTicketOpen(false)} />
      )}
    </div>
  )
}
