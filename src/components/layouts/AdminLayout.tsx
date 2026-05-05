import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  Shield,
  Bell,
  Search,
  ShieldCheck,
  FileText,
  Zap,
  DollarSign,
  ShoppingBag,
  Megaphone,
  Target,
  Trophy,
  Brain,
  ShieldAlert,
  Vote,
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

import { adminService } from '@/services/adminService'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { AdminUser } from '@/types/admin'




export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Core': true,
    'People': false,
    'Operations': false,
    'Finance': false,
    'Communications': false
  })
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(adminService.getCurrentUser())

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
    window.addEventListener('admin_density_changed', applyDensity)
    return () => window.removeEventListener('admin_density_changed', applyDensity)
  }, [])

  useEffect(() => {
    const init = async () => {

      const currentUser = await adminService.initialize()
      if (!currentUser) {
        navigate('/admin-login')
      } else {
        setUser(currentUser)
      }
    }
    init()
  }, [navigate])


  const navGroups = [
    {
      label: "Core",
      icon: LayoutDashboard,
      items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/blogs', icon: FileText, label: 'Blog Posts', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
        { to: '/admin/media', icon: ImageIcon, label: 'Media Library', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
        { to: '/admin/settings', icon: Settings, label: 'Settings', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
      ]
    },
    {
      label: "People",
      icon: Users,
      items: [
        { to: '/admin/members', icon: Users, label: 'Members', permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' } },
        { to: '/admin/administrators', icon: Shield, label: 'Administrators', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
        { to: '/admin/verification', icon: ShieldCheck, label: 'Verifications', permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' } },

        { to: '/admin/leadership', icon: Zap, label: 'Leadership', permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' } },
        { to: '/admin/chapters', icon: MapPin, label: 'Chapters', permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' } },
        { to: '/admin/regions', icon: MapPin, label: 'Regions', permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' } },
      ]
    },
    {
      label: "Operations",
      icon: Target,
      items: [
        { to: '/admin/polls', icon: BarChart3, label: 'Polls & Surveys', permission: { action: 'MANAGE_POLLS', resource: 'POLLS' } },
        { to: '/admin/sentiment-intelligence', icon: Brain, label: 'Sentiment Analysis', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
        { to: '/admin/mobilization-metrics', icon: Trophy, label: 'Mobilization', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
        { to: '/admin/directives', icon: Target, label: 'Operations', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
        { to: '/admin/rally-command', icon: Target, label: 'Events', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
        { to: '/admin/ground-game', icon: Vote, label: 'Canvassing', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
        { to: '/admin/war-room', icon: ShieldAlert, label: 'Alerts', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
      ]
    },
    {
      label: "Finance",
      icon: DollarSign,
      items: [
        { to: '/admin/donations', icon: DollarSign, label: 'Financial Audit', permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' } },
        { to: '/admin/store', icon: ShoppingBag, label: 'Store', permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' } },
        { to: '/admin/orders', icon: ShoppingBag, label: 'Orders', permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' } },
        { to: '/admin/logistics-intelligence', icon: BarChart3, label: 'Logistics', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
      ]
    },
    {
      label: "Communications",
      icon: Megaphone,
      items: [
        { to: '/admin/broadcasts', icon: Megaphone, label: 'Broadcasts', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
      ]
    }

  ]

  const filteredNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.permission) return true;
      // @ts-expect-error type assertion
      return adminService.can(item.permission.action, item.permission.resource);
    })
  })).filter(group => group.items.length > 0)

  const toggleGroup = (groupLabel: string) => {
    if (!isSidebarOpen) setIsSidebarOpen(true)
    setOpenGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }))
  }

  const handleLogout = () => {
    // Basic logout logic
    navigate('/admin-login')
  }

  return (
    <div className="h-screen bg-stone-50 font-inter text-stone-900 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-[var(--brand-black)] text-white transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:w-20 lg:translate-x-0"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className={cn(
            "h-24 flex items-center border-b border-white/5 overflow-hidden transition-all duration-300",
            isSidebarOpen ? "px-8" : "px-5"
          )}>
            <Link to="/admin/dashboard" className="flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 bg-white flex items-center justify-center shadow-2xl p-1.5 shrink-0">
                <img src="/logo.png" alt="The Base Logo" className="w-full h-full object-contain" />
              </div>
              <div className={cn(
                "transition-all duration-300 origin-left",
                isSidebarOpen ? "opacity-100 scale-100" : "opacity-0 scale-0 w-0"
              )}>
                <p className="text-white font-black font-meta text-lg leading-tight tracking-tighter normal-case whitespace-nowrap">The Base</p>
                <p className="text-stone-500 text-[9px] font-bold normal-case mt-0.5 leading-none whitespace-nowrap">Admin panel</p>
              </div>

            </Link>
          </div>


          {/* Navigation */}
          <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
            {/* View Site External Link */}
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 px-3 py-2 mb-6 mx-2 transition-all relative group bg-white/5 hover:bg-white/10 rounded-md border border-white/10",
                isSidebarOpen ? "" : "justify-center px-0"
              )}
            >
              <Zap className="w-4 h-4 text-stone-400 group-hover:text-white shrink-0" />
              <span className={cn(
                "text-[11px] font-medium tracking-wide transition-all duration-300 text-stone-400 group-hover:text-white",
                isSidebarOpen ? "opacity-100" : "opacity-0 w-0 hidden"
              )}>
                View site
              </span>
            </a>

            {filteredNavGroups.map((group) => {
              const isOpen = openGroups[group.label]

              return (
                <div key={group.label} className="space-y-1">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-stone-400 hover:text-white hover:bg-white/5 transition-colors group",
                      isSidebarOpen ? "" : "justify-center"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <group.icon className="w-5 h-5 shrink-0" />
                      <span className={cn(
                        "text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-300",
                        isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                      )}>
                        {group.label}
                      </span>
                    </div>
                    {isSidebarOpen && (
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isOpen ? "rotate-180" : ""
                      )} />
                    )}
                  </button>

                  {/* Group Items */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-300",
                    isOpen && isSidebarOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                  )}>
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.to
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 ml-8 transition-all relative group/item rounded-md mr-4",
                            isActive 
                              ? "bg-white/10 text-white" 
                              : "text-stone-500 hover:text-stone-200 hover:bg-white/5"
                          )}
                          onClick={() => {
                            if (window.innerWidth < 1024) setIsSidebarOpen(false)
                          }}
                        >
                          <span className={cn(
                            "text-xs font-medium tracking-wide whitespace-nowrap transition-all duration-300",
                            isSidebarOpen ? "opacity-100" : "opacity-0"
                          )}>
                            {item.label}
                          </span>
                          {isActive && (
                            <>
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-[var(--brand-red)] shadow-[0_0_10px_rgba(206,17,38,0.8)]" />
                              <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-red)]/5 to-transparent pointer-events-none" />
                            </>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <button 
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 text-stone-400 hover:text-white hover:bg-red-500/10 transition-all group overflow-hidden",
                isSidebarOpen ? "" : "justify-center"
              )}
            >
              <LogOut className="w-5 h-5 group-hover:text-red-500 shrink-0" />
              <span className={cn(
                "text-[11px] font-medium whitespace-nowrap transition-all duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
              )}>
                Sign out
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Utility Bar - Clean, Compact, Functional */}
        <header className="h-14 bg-white border-b border-stone-200 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {/* Sidebar Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-9 w-9 text-stone-500 hover:bg-stone-50 hover:text-[var(--brand-green)] transition-all"
            >
              <Menu className="w-4 h-4" />
            </Button>
            
            {/* Integrated Command Search */}
            <div className="max-w-md w-full relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 group-focus-within:text-[var(--brand-green)] transition-colors" />
              <input 
                type="text" 
                placeholder="Search..."
                className="w-full h-9 pl-9 pr-4 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 focus:ring-0 transition-all text-xs outline-none font-medium placeholder:text-stone-400 rounded-md"
              />
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-stone-500 hover:bg-stone-50 hover:text-[var(--brand-green)] transition-all relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-[var(--brand-red)] rounded-full border-2 border-white" />
            </Button>
            
            <div className="h-4 w-px bg-stone-200 mx-1" />
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 pl-2 py-1 px-2 hover:bg-stone-50 rounded-lg transition-colors cursor-pointer group">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-medium text-stone-400 mt-0.5 leading-none">
                      {user?.role === 'SUPER_ADMIN' 
                        ? 'System Admin' 
                        : user?.role === 'REGIONAL_DIRECTOR'
                          ? 'Regional Director'
                          : user?.role === 'CONSTITUENCY_LEAD'
                            ? 'Constituency Lead'
                            : 'Staff Verifier'}
                    </p>

                  </div>
                  <div className="w-8 h-8 bg-[var(--brand-black)] text-white flex items-center justify-center font-bold text-[10px] rounded-full ring-2 ring-stone-100 group-hover:ring-[var(--brand-green)] transition-all overflow-hidden">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name.split(' ').map(n => n[0]).join('') || 'HQ'
                    )}
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-stone-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="cursor-pointer w-full flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Administrative settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/logs" className="cursor-pointer w-full flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>View audit logs</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </header>



        {/* Content Area */}
        <main 
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
          style={{ 
            padding: 'var(--admin-padding, 2.5rem)',
            fontSize: `calc(1rem * var(--admin-font-scale, 1))` 
          }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {children || <Outlet />}
          </div>
        </main>

      </div>
    </div>
  )
}
