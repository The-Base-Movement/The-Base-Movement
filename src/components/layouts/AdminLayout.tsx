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
  ShoppingBag
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
      {!isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(true)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[var(--brand-black)] border-r border-white/5 transition-transform duration-300 transform lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 bg-white flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="The Base Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-white font-black font-meta text-lg leading-none tracking-tighter uppercase">The Base</p>
              <p className="text-[var(--brand-red)] text-[8px] font-black uppercase tracking-[0.2em] mt-1 leading-none">Admin Office</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                    isActive 
                      ? "bg-[var(--brand-red)] text-white shadow-lg shadow-brand-red/20" 
                      : "text-stone-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-stone-500")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-white/5">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-[var(--brand-red)] transition-colors group"
            >
              <LogOut className="w-4 h-4 text-stone-500 group-hover:text-[var(--brand-red)]" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-stone-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-stone-400 hover:text-[var(--brand-black)]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
              <input 
                type="text" 
                placeholder="Quick search (⌘+K)" 
                className="pl-10 pr-4 py-2 bg-stone-50 border border-stone-100 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-red)] w-64 rounded-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-stone-400 hover:text-[var(--brand-black)] relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--brand-red)] rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-stone-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-tight leading-none">Super Admin</p>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">HQ Tier 1</p>
              </div>
              <div className="w-10 h-10 bg-[var(--brand-black)] text-white flex items-center justify-center font-bold text-xs shadow-md">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Content Area Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          {children}
        </div>
      </main>
    </div>
  )
}
