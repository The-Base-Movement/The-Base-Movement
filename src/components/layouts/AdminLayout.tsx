import { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Shield,
  Bell,
  Search,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

import { adminService, AdminPermission } from '@/services/adminService'

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const user = adminService.getCurrentUser()

  const navItems: ( { to: string, icon: any, label: string, permission?: { action: AdminPermission['action'], resource: AdminPermission['resource'] } } )[] = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/members', icon: Users, label: 'Members', permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' } },
    { to: '/admin/verification', icon: ShieldCheck, label: 'Verifications', permission: { action: 'VERIFY_MEMBER', resource: 'MEMBERS' } },
    { to: '/admin/chapters', icon: MapPin, label: 'Chapters', permission: { action: 'MANAGE_CHAPTER', resource: 'CHAPTERS' } },
    { to: '/admin/polls', icon: BarChart3, label: 'Polls & Surveys', permission: { action: 'MANAGE_POLLS', resource: 'POLLS' } },
    { to: '/admin/store', icon: ShoppingBag, label: 'Merchandise', permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' } },
    { to: '/admin/settings', icon: Settings, label: 'Settings', permission: { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' } },
  ]

  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true
    return adminService.can(item.permission.action, item.permission.resource)
  })

  const handleLogout = () => {
    // Basic logout logic
    navigate('/admin-login')
  }

  return (
    <div className="min-h-screen bg-stone-50 font-inter text-stone-900 flex overflow-hidden">
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
                <p className="text-white font-black font-meta text-lg leading-none tracking-tighter uppercase whitespace-nowrap">The Base</p>
                <p className="text-[var(--brand-red)] text-[8px] font-black uppercase tracking-[0.2em] mt-1 leading-none whitespace-nowrap">Admin Office</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 transition-all relative group",
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-stone-400 hover:text-white hover:bg-white/5"
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) setIsSidebarOpen(false)
                  }}
                >
                  <item.icon className={cn(
                    "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-[var(--brand-red)]" : ""
                  )} />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300",
                    isSidebarOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--brand-red)] shadow-[0_0_15px_rgba(255,0,0,0.5)]" />
                  )}
                </Link>
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
                "text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300",
                isSidebarOpen ? "opacity-100" : "opacity-0 w-0"
              )}>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header - Redesigned */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-stone-200/60 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-8">
            {/* Sidebar Toggle with Premium Hover */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hover:bg-[var(--brand-black)] hover:text-white transition-all duration-300 rounded-none w-12 h-12 border border-transparent hover:border-white/20"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <div className="h-8 w-px bg-stone-200 hidden lg:block" />
            </div>
            
            {/* Command Search - Refined */}
            <div className="hidden lg:flex relative items-center group">
              <div className="absolute left-4 p-1 bg-stone-100 rounded-sm group-focus-within:bg-[var(--brand-red)] transition-colors duration-300">
                <Search className="w-3.5 h-3.5 text-stone-400 group-focus-within:text-white transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search command center..."
                className="pl-14 h-12 w-[400px] bg-stone-50 border border-stone-100 focus:bg-white focus:border-[var(--brand-black)] focus:ring-0 transition-all text-[11px] outline-none uppercase font-black tracking-widest placeholder:text-stone-300 shadow-sm focus:shadow-md"
              />
              <div className="absolute right-4 flex items-center gap-1 opacity-40 group-focus-within:opacity-0 transition-opacity">
                <span className="px-1.5 py-0.5 border border-stone-300 text-[8px] font-bold">⌘</span>
                <span className="px-1.5 py-0.5 border border-stone-300 text-[8px] font-bold">K</span>
              </div>
            </div>
          </div>

          {/* Topbar Actions - Polished */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative group w-12 h-12 rounded-none hover:bg-stone-50">
                <Bell className="w-5 h-5 text-stone-500 group-hover:rotate-12 group-hover:text-[var(--brand-red)] transition-all" />
                <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-[var(--brand-red)] rounded-full border-2 border-white animate-pulse" />
              </Button>
              <Button variant="ghost" size="icon" className="w-12 h-12 rounded-none hover:bg-stone-50 text-stone-500 hidden sm:flex">
                <Shield className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="h-10 w-px bg-stone-200" />
            
            <div className="flex items-center gap-5 pl-2 group cursor-pointer">
              <div className="text-right hidden md:block">
                <p className="text-[11px] font-black text-[var(--brand-black)] uppercase tracking-tight leading-none group-hover:text-[var(--brand-red)] transition-colors">
                  {user?.name || 'Administrative Officer'}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-1.5">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-none">
                    {user?.role.replace('_', ' ') || 'HQ Access'}
                  </p>
                </div>
              </div>
              <div className="relative shrink-0">
                <div className="w-12 h-12 bg-[var(--brand-black)] text-white flex items-center justify-center font-black text-xs shadow-2xl relative z-10 group-hover:-translate-y-1 group-hover:-translate-x-1 transition-transform duration-300 uppercase">
                  {user?.name.split(' ').map(n => n[0]).join('') || 'HQ'}
                </div>
                <div className="absolute inset-0 bg-[var(--brand-red)] translate-y-0.5 translate-x-0.5 z-0" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
          <div className="max-w-7xl mx-auto w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}
