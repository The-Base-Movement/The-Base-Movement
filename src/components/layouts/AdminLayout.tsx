import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/members', icon: Users, label: 'Members' },
    { to: '/admin/verification', icon: ShieldCheck, label: 'Verifications' },
    { to: '/admin/chapters', icon: MapPin, label: 'Chapters' },
    { to: '/admin/polls', icon: BarChart3, label: 'Polls & Surveys' },
    { to: '/admin/store', icon: ShoppingBag, label: 'Merchandise' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

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
            {navItems.map((item) => {
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
        {/* Top Header */}
        <header className="h-24 bg-white border-b border-stone-100 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-stone-50"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-stone-600" /> : <Menu className="w-5 h-5 text-stone-600" />}
            </Button>
            
            <div className="hidden md:flex relative items-center group">
              <Search className="absolute left-3 w-4 h-4 text-stone-300 group-focus-within:text-[var(--brand-red)] transition-colors" />
              <input 
                type="text" 
                placeholder="Search resources..."
                className="pl-10 h-11 w-72 bg-stone-50 border-transparent focus:bg-white focus:border-stone-200 transition-all text-[10px] outline-none uppercase font-black tracking-widest"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-4">
              <button className="p-2 text-stone-400 hover:text-[var(--brand-black)] relative group">
                <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--brand-red)] rounded-full border-2 border-white"></span>
              </button>
            </div>
            
            <div className="flex items-center gap-4 border-l border-stone-100 pl-4 md:pl-8">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-[var(--brand-black)] uppercase tracking-tight leading-none">Super Admin</p>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1.5 leading-none">HQ Tier 1</p>
              </div>
              <div className="w-11 h-11 bg-[var(--brand-black)] text-white flex items-center justify-center font-black text-xs shadow-xl ring-2 ring-stone-50">
                SA
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
  )
}
