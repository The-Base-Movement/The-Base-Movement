import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  LogOut, 
  User as UserIcon, 
  Search 
} from 'lucide-react'
import BackToTop from './BackToTop'
import { ShareModal } from './ShareModal'
import { Button } from './ui/neon-button'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'
import { useBranding } from '@/hooks/useBranding'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardLayout() {
  const { settings } = useBranding()
  const location = useLocation()
  const navigate = useNavigate()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('Member')
  const [userRegNo, setUserRegNo] = useState('')

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const readProfile = () => {
      const user = authService.getUser()
      if (user) {
        setUserName(user.user_metadata?.full_name || 'Member')
        setAvatarUrl(user.user_metadata?.avatar_url || null)
      } else {
        // Fallback to local storage for persistence across reloads if service not ready
        setAvatarUrl(localStorage.getItem('userAvatar'))
        setUserName(localStorage.getItem('userName') || 'Member')
      }
      
      setUserRegNo(localStorage.getItem('userRegNo') || '')
    }
    readProfile()
    
    // Fetch unread notification count
    const fetchUnread = async () => {
      const notes = await adminService.getNotifications()
      setUnreadCount(notes.filter(n => !n.is_read).length)
    }
    fetchUnread()

    window.addEventListener('storage', readProfile)
    return () => window.removeEventListener('storage', readProfile)
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    const closeSidebar = () => setIsSidebarOpen(false)
    closeSidebar()
  }, [location.pathname])

  // Derive initials from the stored name
  const initials = (userName || 'Member')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const handleLogout = async () => {
    try {
      await authService.logout()
      localStorage.removeItem('userToken')
      localStorage.removeItem('userName')
      localStorage.removeItem('userEmail')
      localStorage.removeItem('userAvatar')
      localStorage.removeItem('userPlatform')
      localStorage.removeItem('userRegNo')
      navigate('/login')
    } catch (error) {
      console.error('[AUTH] Sign out sequence failed:', error)
      // Fallback redirect
      navigate('/login')
    }
  }

  const isActive = (path: string) => location.pathname === path

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Overview'
    if (path === '/dashboard/blog') return 'Updates'
    if (path.startsWith('/dashboard/blog/')) return 'Update Article'
    if (path === '/dashboard/agenda') return 'The Plan'
    if (path === '/dashboard/impact') return 'Impact'
    if (path === '/dashboard/polls') return 'Feedback'
    if (path === '/dashboard/store') return 'Supplies'
    if (path === '/dashboard/donate') return 'Donations'
    if (path === '/dashboard/members') return 'Verified'
    if (path === '/dashboard/chapters') return 'Chapters'
    if (path.startsWith('/dashboard/chapter/')) return 'Chapter Details'
    if (path === '/dashboard/contact') return 'Support'
    if (path === '/settings') return 'Profile'
    if (path === '/dashboard/wishlist') return 'Wishlist'
    if (path === '/dashboard/cart') return 'Cart'
    if (path === '/dashboard/checkout') return 'Checkout'
    if (path === '/dashboard/summary') return 'Order Summary'
    return 'Member Portal'
  }

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[45] md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title="Invite others to join The Base"
      />

      {/* Navigation Shell (SideNavBar) */}
      <aside
        aria-label="Dashboard Sidebar"
        className={`fixed left-0 top-0 h-full flex flex-col bg-[#181d19] text-white border-r-[4px] border-accent z-50 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-60'}`}
      >
        {/* Fixed Header */}
        <div className={`py-[24px] flex items-center border-b border-white/[0.08] mb-3 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-[22px] gap-[10px]'}`}>
          <img src={settings.logo_url} alt="The Base Logo" className="h-8 w-8 object-contain shrink-0"  decoding="async" />
          {!isSidebarCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-[16px] font-extrabold text-white leading-none mb-0 tracking-tight">The Base</h1>
              <p className="text-[9px] text-accent font-bold tracking-[0.04em] uppercase mt-1 mb-0">Member portal</p>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto sidebar-scroll">
          {[
            { label: 'Navigation', items: [
              { to: '/dashboard', icon: 'dashboard', label: 'Overview' },
              { to: '/dashboard/blog', icon: 'article', label: 'Updates' },
              { to: '/dashboard/agenda', icon: 'event_note', label: 'The Plan' },
              { to: '/dashboard/impact', icon: 'insights', label: 'Impact' },
              { to: '/dashboard/polls', icon: 'how_to_vote', label: 'Feedback' },
              { to: '/dashboard/chapters', icon: 'account_balance', label: 'Chapters' },
            ]},
            { label: 'Mobilization', items: [
              { to: '/dashboard/donate', icon: 'volunteer_activism', label: 'Donate' },
              { to: '/dashboard/store', icon: 'storefront', label: 'Supplies' },
              { to: '/dashboard/feedback', icon: 'forum', label: 'Feedback Hub' },
              { to: '/dashboard/members', icon: 'groups', label: 'Verified Patriots' },
            ]},
            { label: 'Personal', items: [
              { to: '/settings', icon: 'settings', label: 'Settings' },
            ]},
          ].map((group) => (
            <div key={group.label} className="nav-sec mt-2">
              {!isSidebarCollapsed && (
                <h6 className="text-[9px] font-bold text-white/40 tracking-[0.08em] uppercase mb-2 mt-2 px-6 font-meta">{group.label}</h6>
              )}
              <div className="space-y-0.5 px-4">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    className={`flex items-center transition-all font-meta text-[12px] font-bold tracking-tight rounded-[4px] ${isSidebarCollapsed ? 'px-0 justify-center h-14' : 'px-[12px] py-[10px]'} ${isActive(item.to) || (item.to !== '/dashboard' && location.pathname.startsWith(item.to)) ? 'bg-[hsl(var(--primary))] text-white shadow-lg shadow-primary/10' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                    to={item.to}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${isSidebarCollapsed ? 'mr-0' : 'mr-[10px]'}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{item.icon}</span>
                    {!isSidebarCollapsed && item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className={`mt-8 mb-8 px-4 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
             <Button 
                variant="primary"
                onClick={() => setIsShareModalOpen(true)}
                className={`w-full font-bold tracking-tight shadow-2xl shadow-primary/20 flex items-center justify-center overflow-hidden ${isSidebarCollapsed ? 'h-12 w-12 rounded-full' : 'h-12 text-tiny'}`}
              >
                {isSidebarCollapsed ? (
                  <span className="material-symbols-outlined">share</span>
                ) : (
                  <span>Invite & Share</span>
                )}
              </Button>
          </div>
        </div>

        {/* User identification footer */}
        {!isSidebarCollapsed && (
          <div className="mt-auto px-[22px] py-6 border-t border-white/[0.08] flex items-center gap-3">
             <div className="w-8 h-8 rounded-full border-[1.5px] border-accent overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-[10px] font-bold">
                    {initials}
                  </div>
                )}
             </div>
             <div className="min-w-0">
                <b className="block text-[12px] text-white font-bold leading-none mb-1 truncate capitalize">{userName?.toLowerCase()}</b>
                <span className="block text-[10px] text-white/50 truncate">Patriot ID: {userRegNo?.slice(0, 8)}</span>
             </div>
          </div>
        )}
      </aside>

      {/* Main Content Canvas */}
      <main className={`min-h-screen bg-muted/10 flex flex-col pt-16 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-60'}`}>

        {/* ── Topbar ── fixed, clears the sidebar */}
        <div className={`fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/40 shadow-sm transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-60'}`}>
          <div className="flex items-center justify-between px-6 md:px-10 h-16">

            {/* Left: Hamburger (Mobile) + Current Page Title */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(true)
                  } else {
                    setIsSidebarCollapsed(!isSidebarCollapsed)
                  }
                }}
                className="p-2 -ml-2 rounded-sm hover:bg-muted/10 text-on-surface/60 transition-colors"
              >
                <span className="material-symbols-outlined text-[28px]">menu</span>
              </button>
              
              <h1 className="text-[20px] md:text-[24px] font-extrabold tracking-tight text-on-surface m-0 font-meta">
                {getPageTitle()}
              </h1>
            </div>

            {/* Right: Actions + Avatar */}
            <div className="flex items-center gap-4">

              {/* Search */}
              <div className="relative hidden lg:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search infrastructure..." 
                      className="w-[280px] pl-10 pr-4 py-2 bg-on-surface/5 border border-transparent focus:border-primary/20 focus:bg-white rounded-none text-xs font-medium transition-all outline-none"
                    />
                  </div>
              </div>

              {/* Notification Bell */}
              <button className="relative p-2.5 rounded-sm hover:bg-muted/10 transition-all group">
                <span
                  className="material-symbols-outlined text-on-surface/40 group-hover:text-primary transition-colors text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-destructive rounded-full ring-2 ring-white text-micro flex items-center justify-center text-white font-bold tracking-tight">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-4 group outline-none">
                    <div className="w-10 h-10 rounded-sm overflow-hidden ring-4 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-2xl shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" decoding="async" />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-white text-tiny font-bold tracking-tight">
                          {initials || 'M'}
                        </div>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2 bg-white border-border/40 shadow-2xl rounded-none">
                  <DropdownMenuLabel className="p-4">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-bold text-on-surface leading-none capitalize">{userName?.toLowerCase()}</p>
                      <p className="text-tiny font-bold text-muted-foreground/60 tracking-tight truncate">{userRegNo || 'Unverified Account'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/10" />
                  <DropdownMenuItem asChild className="cursor-pointer p-3 focus:bg-primary/5 transition-colors group">
                    <Link to="/dashboard/settings" className="flex items-center gap-3 w-full">
                      <UserIcon className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      <span className="text-tiny font-bold tracking-tight text-on-surface/70 group-hover:text-on-surface">Member Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer p-3 focus:bg-destructive/5 transition-colors group text-destructive"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <LogOut className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="text-tiny font-bold tracking-tight">Sign out</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex-1 main-content-wrapper px-[32px] py-[28px] pb-[60px]">
          <div className="max-w-[1440px] mx-auto w-full">
            <Outlet />
          </div>
        </div>

        {/* Dashboard Footer */}
        <footer className="mt-16 py-10 px-12 border-t border-border/10 bg-muted/5">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-micro text-muted-foreground/40 mb-0 font-bold tracking-tight uppercase">© {new Date().getFullYear()} The Base Movement. National Infrastructure.</p>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <Link className="font-bold text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors" to="/dashboard/privacy">Privacy</Link>
              <Link className="font-bold text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors" to="/dashboard/terms">Terms</Link>
              <Link className="font-bold text-micro uppercase text-muted-foreground/40 hover:text-primary transition-colors" to="/dashboard/contact">Support</Link>
            </div>
          </div>
        </footer>
      </main>
      <BackToTop />
    </div>
  )
}
