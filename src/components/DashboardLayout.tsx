import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  LogOut, 
  User as UserIcon, 
  Settings as SettingsIcon,
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
  const [userPlatform, setUserPlatform] = useState('Member')
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
      
      setUserPlatform(localStorage.getItem('userPlatform') || 'General')
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
        className={`fixed left-0 top-0 h-full flex flex-col bg-muted/5 text-on-surface border-r border-border/40 z-50 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Fixed Header */}
        <div className={`py-8 flex items-center bg-white z-10 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'px-0 justify-center' : 'px-6 gap-3'}`}>
          <img src={settings.logo_url} alt="The Base Logo" className="h-10 w-10 object-contain shrink-0"  decoding="async" />
          {!isSidebarCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-bold text-on-surface leading-none mb-0 tracking-tight">The Base</h1>
              <p className="text-tiny text-accent font-bold tracking-tight mt-1 mb-0">Civic movement</p>
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto sidebar-scroll pb-8">
          <div className="space-y-1">
            {[
              { to: '/dashboard', icon: 'grid_view', label: 'Overview' },
              { to: '/dashboard/blog', icon: 'article', label: 'Updates' },
              { to: '/dashboard/agenda', icon: 'event_note', label: 'The Plan' },
              { to: '/dashboard/impact', icon: 'insights', label: 'Impact' },
              { to: '/dashboard/polls', icon: 'how_to_vote', label: 'Feedback' },
              { to: '/dashboard/store', icon: 'shopping_bag', label: 'Supplies' },
              { to: '/dashboard/donate', icon: 'volunteer_activism', label: 'Donations' },
              { to: '/dashboard/members', icon: 'groups', label: 'Verified' },
              { to: '/dashboard/chapters', icon: 'account_balance', label: 'Chapters' },
              { to: '/settings', icon: 'person', label: 'Account' },
            ].map((item) => (
              <Link 
                key={item.to}
                className={`flex items-center transition-all font-meta text-sm font-bold tracking-tight ${isSidebarCollapsed ? 'px-0 justify-center h-14' : 'px-6 py-3'} ${isActive(item.to) || (item.to !== '/dashboard' && location.pathname.startsWith(item.to)) ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
                to={item.to}
              >
                <span className={`material-symbols-outlined ${isSidebarCollapsed ? 'mr-0' : 'mr-3'}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>{item.icon}</span>
                {!isSidebarCollapsed && item.label}
              </Link>
            ))}
          </div>

          {/* Leader Portrait */}
          {!isSidebarCollapsed && (
            <div className="mx-4 my-8 flex flex-col gap-4 transition-opacity duration-300">
              <div className="overflow-hidden rounded-none relative group shrink-0 shadow-lg border border-border/10">
                <img src={settings.founder_image_url || "/founder.jpg"}
                  alt="Dr. George Oti Bonsu The Base Movement Founder"
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
                 decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
              </div>
              <div className="px-2">
                <p className="text-on-surface text-tiny font-bold tracking-tight leading-tight mb-1">
                  Dr. George Oti Bonsu
                </p>
                <p className="text-accent text-tiny font-bold tracking-tight mb-0">
                  Movement Founder
                </p>
              </div>
            </div>
          )}

          <div className={`pt-2 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-6'}`}>
            <Button 
              variant="primary"
              onClick={() => setIsShareModalOpen(true)}
              className={`w-full font-bold tracking-tight shadow-2xl shadow-primary/20 flex items-center justify-center overflow-hidden ${isSidebarCollapsed ? 'h-12 px-0' : 'h-14'}`}
            >
              {isSidebarCollapsed ? (
                <span className="material-symbols-outlined">share</span>
              ) : (
                <span className="text-tiny">Invite & Share</span>
              )}
            </Button>
            
            <div className={`mt-8 space-y-4 ${isSidebarCollapsed ? 'px-0 flex flex-col items-center' : 'pl-2'}`}>
              <Link 
                className={`flex items-center transition-all font-bold text-tiny tracking-tight ${isActive('/dashboard/contact') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`} 
                to="/dashboard/contact"
              >
                <span className={`material-symbols-outlined ${isSidebarCollapsed ? 'text-2xl' : 'text-lg mr-3'}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>help</span>
                {!isSidebarCollapsed && "Support"}
              </Link>

              <Link
                to="/"
                className={`flex items-center rounded-sm border border-border/40 text-on-surface/40 hover:border-primary hover:text-primary transition-all font-bold text-tiny tracking-tight group bg-white/50 ${isSidebarCollapsed ? 'w-10 h-10 justify-center' : 'w-full h-12 px-4 gap-3 mt-8'}`}
              >
                <span className="material-symbols-outlined text-base group-hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>arrow_back</span>
                {!isSidebarCollapsed && "Back to Site"}
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className={`min-h-screen bg-muted/10 flex flex-col pt-16 transition-all duration-300 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>

        {/* ── Topbar ── fixed, clears the sidebar */}
        <div className={`fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-border/40 shadow-sm transition-all duration-300 ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'}`}>
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
              
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-on-surface m-0 font-meta">
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
                      placeholder="Search updates..." 
                      className="w-full sm:w-64 pl-10 pr-4 py-2 bg-on-surface/5 border border-transparent focus:border-primary/20 focus:bg-white rounded-none text-xs font-medium transition-all outline-none"
                    />
                  </div>
              </div>

              {/* Vertical Separator */}
              <div className="h-6 w-px bg-border/20 mx-2 hidden lg:block"></div>

              {/* Notification Bell */}
              <button className="relative p-2.5 rounded-sm hover:bg-muted/10 transition-all group">
                <span
                  className="material-symbols-outlined text-on-surface/40 group-hover:text-primary transition-colors text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >notifications</span>
                {/* Unread badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-destructive rounded-full ring-2 ring-white text-micro flex items-center justify-center text-white font-bold tracking-tight">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-border/20 mx-8"></div>

              {/* User Avatar + Name with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-4 group outline-none">
                    {/* Avatar: real photo or initials fallback */}
                    <div className="w-10 h-10 rounded-sm overflow-hidden ring-4 ring-primary/5 group-hover:ring-primary/20 transition-all shadow-2xl shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl}
                          alt={userName}
                          className="w-full h-full object-cover"
                         decoding="async" />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center text-white text-tiny font-bold tracking-tight">
                          {initials || 'M'}
                        </div>
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs font-bold text-on-surface leading-none mb-1 capitalize tracking-tight">{userName?.toLowerCase()}</p>
                       <p className="text-tiny text-accent font-bold tracking-tight mb-0">
                        {userPlatform === 'ADMIN' ? 'Chapter Lead' : (userPlatform === 'PATRIOT' ? 'Member' : 'Member')} {userRegNo && `· ${userRegNo}`}
                      </p>
                    </div>
                    <span
                      className="material-symbols-outlined text-on-surface/20 text-[18px] group-hover:text-primary transition-colors"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
                    >expand_more</span>
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
                      <span className="text-[11px] font-bold tracking-tight text-on-surface/70 group-hover:text-on-surface">Member Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer p-3 focus:bg-primary/5 transition-colors group">
                    <Link to="/dashboard/settings?tab=security" className="flex items-center gap-3 w-full">
                      <SettingsIcon className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      <span className="text-[11px] font-bold tracking-tight text-on-surface/70 group-hover:text-on-surface">Security Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/10" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer p-3 focus:bg-destructive/5 transition-colors group text-destructive"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <LogOut className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[11px] font-bold tracking-tight">Sign out of Base</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex-1 main-content-wrapper px-6 md:px-10 py-8">
          <Outlet />
        </div>

        {/* Dashboard Footer */}
        <footer className="mt-16 py-16 px-12 border-t border-border/10 bg-muted/5">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-tiny text-muted-foreground/40 mb-0 font-bold tracking-tight">© {new Date().getFullYear()} The Base Movement. Ghana First.</p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
              <Link className="font-bold text-xs text-muted-foreground/40 hover:text-primary transition-colors" to="/dashboard/privacy">Privacy Policy</Link>
              <Link className="font-bold text-xs text-muted-foreground/40 hover:text-primary transition-colors" to="/dashboard/terms">Terms of Service</Link>
              <Link className="font-bold text-xs text-muted-foreground/40 hover:text-primary transition-colors" to="/dashboard/contact">Support Portal</Link>
            </div>
          </div>
        </footer>
      </main>
      <BackToTop />
    </div>
  )
}
