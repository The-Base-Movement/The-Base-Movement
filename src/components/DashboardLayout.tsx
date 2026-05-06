import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import BackToTop from './BackToTop'
import { ShareModal } from './ShareModal'
import { authService } from '@/services/authService'
import { adminService } from '@/services/adminService'

export default function DashboardLayout() {
  const location = useLocation()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('Member')
  const [userPlatform, setUserPlatform] = useState('Member')
  const [userRegNo, setUserRegNo] = useState('')

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
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
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() || '')
    .join('')

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
      <nav className={`fixed left-0 top-0 h-full flex flex-col bg-stone-100 dark:bg-zinc-950 text-emerald-700 dark:text-emerald-400 w-64 border-r border-stone-200 dark:border-zinc-800 z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Fixed Header */}
        <div className="px-6 py-8 flex items-center gap-3 bg-stone-100 dark:bg-zinc-950 z-10 shrink-0">
          <img src="/logo.png" alt="The Base Logo" className="h-10 w-10"  decoding="async" />
          <div>
            <h1 className="text-lg text-emerald-900 dark:text-white leading-none mb-0">The Base</h1>
            <p className="text-[9px] text-accent font-bold tracking-widest mt-1 mb-0 uppercase">Civic Movement</p>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto sidebar-scroll pb-8">
          <div className="space-y-1">
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>dashboard</span>
              Overview
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard/blog') || location.pathname.startsWith('/dashboard/blog/') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard/blog"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>article</span>
              Updates
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard/agenda') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard/agenda"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>event_note</span>
              The Plan
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard/impact') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard/impact"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>insights</span>
              Impact
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard/polls') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard/polls"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>how_to_vote</span>
              Feedback
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard/store') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard/store"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>shopping_bag</span>
              Supplies
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard/donate') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard/donate"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>volunteer_activism</span>
              Donations
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard/members') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard/members"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>groups</span>
              Verified
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/dashboard/chapters') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/dashboard/chapters"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>account_balance</span>
              Chapters
            </Link>
            <Link 
              className={`flex items-center px-6 py-3 transition-all font-meta text-sm font-semibold tracking-wider ${isActive('/settings') ? 'text-emerald-800 dark:text-emerald-200 bg-stone-200/50 dark:bg-zinc-800/50 border-l-4 border-emerald-700' : 'text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-800'}`} 
              to="/settings"
            >
              <span className="material-symbols-outlined mr-3" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>person</span>
              Profile
            </Link>
          </div>

          {/* Leader Portrait */}
          <div className="mx-4 my-8 overflow-hidden rounded-none relative group shrink-0 shadow-lg">
            <img src="/founder.jpg"
              alt="Dr. George Oti Bonsu The Base Movement Founder"
              className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-105"
             decoding="async" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white text-[10px] font-bold tracking-widest leading-tight mb-0 uppercase">
                Dr. George Oti Bonsu
              </p>
              <p className="text-white/70 text-[9px] font-bold tracking-wider mt-0.5 mb-0 uppercase">
                Movement Founder
              </p>
            </div>
          </div>

          <div className="px-6 pt-2">
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-full py-3 bg-primary text-white font-meta text-xs font-bold tracking-widest rounded-none hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20"
            >
              Invite & Share
            </button>
            <div className="mt-6 space-y-4">
              <Link 
                className={`flex items-center transition-colors text-sm font-semibold tracking-wider font-meta ${isActive('/dashboard/contact') ? 'text-emerald-700' : 'text-stone-500 hover:text-emerald-700'}`} 
                to="/dashboard/contact"
              >
                <span className="material-symbols-outlined text-sm mr-2" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>help</span>
                Support
              </Link>
            </div>

            {/* Back to Landing Page */}
            <Link
              to="/"
              className="mt-6 flex items-center gap-2 w-full py-2.5 px-3 rounded-none border border-stone-200 text-stone-500 hover:border-primary hover:text-primary transition-all text-xs font-meta font-bold tracking-widest group bg-white/50"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>arrow_back</span>
              Back to Site
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="md:ml-64 min-h-screen bg-off-white flex flex-col pt-16">

        {/* ── Topbar ── fixed, clears the sidebar */}
        <div className="fixed top-0 left-0 md:left-64 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-6 md:px-10 h-16">

            {/* Left: Hamburger (Mobile) + Breadcrumb */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--brand-light-gray)] text-stone-600"
              >
                <span className="material-symbols-outlined text-[24px]">menu</span>
              </button>
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <img src="/logo.png" alt="The Base" className="h-6 w-6"  decoding="async" />
                  <span className="text-primary font-black text-xs tracking-tighter sm:hidden">The Base</span>
                </Link>
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-stone-400 tracking-widest uppercase font-bold">
                  <span className="text-primary">The Base</span>
                  <span className="text-stone-300">/</span>
                  <span className="text-stone-900">{getPageTitle()}</span>
                </div>
              </div>
          </div>

          {/* Right: Actions + Avatar */}
            <div className="flex items-center gap-4">

              {/* Search */}
              <div className="relative hidden md:block">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
                >search</span>
                <input
                  type="text"
                  placeholder="Search…"
                  className="pl-9 pr-4 py-1.5 text-sm bg-stone-100 border border-stone-200 rounded-none text-stone-600 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all w-48 focus:w-64"
                />
              </div>

              {/* Notification Bell */}
              <button className="relative p-2 rounded-full hover:bg-[var(--brand-light-gray)] transition-colors group">
                <span
                  className="material-symbols-outlined text-stone-500 group-hover:text-primary transition-colors text-[22px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >notifications</span>
                {/* Unread badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] bg-destructive rounded-full ring-2 ring-white text-[8px] flex items-center justify-center text-white font-black">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="h-7 w-px bg-stone-200"></div>

              {/* User Avatar + Name */}
              <button className="flex items-center gap-3 group">
                {/* Avatar: real photo or initials fallback */}
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all shadow-sm shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl}
                      alt={userName}
                      className="w-full h-full object-cover"
                     decoding="async" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xs font-bold font-meta tracking-wider">
                      {initials || 'M'}
                    </div>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-on-surface leading-none mb-1">{userName}</p>
                   <p className="text-[10px] text-accent font-bold tracking-widest uppercase mb-0">
                    {userPlatform} {userRegNo && `· ${userRegNo}`} · Verified
                  </p>
                </div>
                <span
                  className="material-symbols-outlined text-stone-400 text-[18px] group-hover:text-primary transition-colors"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
                >expand_more</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <Outlet />
        </div>

        {/* Dashboard Footer */}
        <footer className="mt-12 py-12 px-12 border-t border-stone-200 bg-stone-50">
          <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-stone-500 mb-0 uppercase font-bold tracking-widest">© 2024 The Base Movement. Ghana First.</p>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
              <Link className="font-meta text-xs text-stone-400 hover:underline hover:text-emerald-600 transition-colors" to="/dashboard/privacy">Privacy Policy</Link>
              <Link className="font-meta text-xs text-stone-400 hover:underline hover:text-emerald-600 transition-colors" to="/dashboard/terms">Terms of Service</Link>
              <Link className="font-meta text-xs text-stone-400 hover:underline hover:text-emerald-600 transition-colors" to="/dashboard/contact">Contact Us</Link>
            </div>
          </div>
        </footer>
      </main>
      <BackToTop />
    </div>
  )
}
