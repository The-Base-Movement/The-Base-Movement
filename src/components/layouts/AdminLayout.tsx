import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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

interface SidebarItemProps {
  to: string
  icon: React.ElementType
  label: string
  active?: boolean
}

const SidebarItem = ({ to, icon: Icon, label, active }: SidebarItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-none transition-all font-meta font-bold uppercase tracking-widest text-[11px]",
      active 
        ? "bg-[var(--brand-black)] text-white" 
        : "text-stone-500 hover:bg-stone-100 hover:text-[var(--brand-black)]"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </Link>
)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/members', icon: Users, label: 'Members' },
    { to: '/admin/chapters', icon: MapPin, label: 'Chapters' },
    { to: '/admin/polls', icon: BarChart3, label: 'Polls & Surveys' },
    { to: '/admin/store', icon: ShoppingBag, label: 'Merchandise' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-stone-50 flex font-inter">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-stone-100 bg-stone-50">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-[var(--brand-red)] flex items-center justify-center rounded-none shadow-lg shadow-brand-red/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black font-meta tracking-tighter text-[var(--brand-black)] leading-none uppercase">THE BASE</span>
                <span className="text-[9px] font-bold text-[var(--brand-red)] uppercase tracking-widest">Admin Office</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to}
              />
            ))}
          </nav>

          {/* Footer Navigation */}
          <div className="p-4 border-t border-stone-100">
            <SidebarItem
              to="/admin/login"
              icon={LogOut}
              label="Sign Out"
            />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="hidden md:flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-none border border-stone-200 w-64">
              <Search className="w-4 h-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none text-xs focus:ring-0 w-full placeholder:text-stone-400 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-stone-500">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--brand-red)] rounded-full border-2 border-white" />
            </Button>
            <div className="h-8 w-[1px] bg-stone-200 mx-2 hidden sm:block" />
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-[var(--brand-black)] leading-none">Super Admin</span>
                <span className="text-[10px] text-stone-400 font-medium mt-1">Headquarters</span>
              </div>
              <div className="w-8 h-8 bg-stone-200 rounded-none border border-stone-300 flex items-center justify-center font-bold text-stone-500 text-xs">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
