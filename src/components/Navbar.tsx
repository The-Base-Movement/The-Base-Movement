import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { useBranding } from '@/hooks/useBranding'
import { useIsClient } from '@/hooks/useIsClient'

export default function Navbar() {
  const { settings } = useBranding()
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isClient = useIsClient()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/150?u=a042581f4e29026704d')

  useEffect(() => {
    if (isClient) {
      // Deferring to an animation frame avoids the "cascading render" warning
      // by moving the state update out of the synchronous effect body.
      const handle = requestAnimationFrame(() => {
        setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true')
        const avatar = localStorage.getItem('userAvatar')
        if (avatar) setUserAvatar(avatar)
      })
      return () => cancelAnimationFrame(handle)
    }
  }, [isClient])
  const location = useLocation()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Effect 1: Close mobile menu & dropdown whenever the route changes
  useEffect(() => {
    function closeMenus() {
      setIsOpen(false)
      setIsDropdownOpen(false)
    }
    closeMenus()
  }, [location.pathname])

  // Effect 2: Subscribe to localStorage changes (login/logout, avatar updates)
  useEffect(() => {
    function checkLogin() {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true')
      setUserAvatar(localStorage.getItem('userAvatar') || 'https://i.pravatar.cc/150?u=a042581f4e29026704d')
    }
    window.addEventListener('storage', checkLogin)
    return () => window.removeEventListener('storage', checkLogin)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userAvatar')
    setIsLoggedIn(false)
    setIsDropdownOpen(false)
    // Optional: add navigation to home if not done externally
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-white border-b border-border/40 sticky top-0 z-50">
      <nav aria-label="Main Navigation" className="flex justify-between items-center max-w-[1440px] mx-auto px-8 h-20">
        <div className="flex items-center gap-4">
          <img alt="The Base Logo" className="h-10 w-10 object-contain" src={settings.logo_url}  decoding="async" />
          <Link to="/" className="text-on-surface hover:opacity-80 transition-opacity mb-0">
            <h1 className="text-xl font-bold tracking-tight mb-0">The Base</h1>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-10 text-xs font-bold tracking-tight">
          <Link 
            to="/" 
            className={`transition-colors duration-200 ${isActive('/') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            Home
          </Link>
          <Link 
            to="/blog" 
            className={`transition-colors duration-200 ${isActive('/blog') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            Updates
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/polls" : "/polls"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/polls' : '/polls') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            Polls
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/agenda" : "/our-agenda"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/agenda' : '/our-agenda') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            The Plan
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/chapters" : "/chapters"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/chapters' : '/chapters') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            Chapters
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/store" : "/store"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/store' : '/store') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            Supplies
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/donate" : "/donate"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/donate' : '/donate') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            Donate
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/contact" : "/contact"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/contact' : '/contact') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            Contact
          </Link>
          {isLoggedIn && (
            <Link 
              to="/dashboard" 
              className={`transition-colors duration-200 ${isActive('/dashboard') ? 'text-primary' : 'text-primary/60 hover:text-primary'}`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
              >
                <img src={userAvatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-primary object-cover"  decoding="async" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-border/40 shadow-2xl rounded-sm py-3 z-50">
                  <div className="px-5 py-3 border-b border-border/10 mb-2">
                    <p className="text-xs font-bold text-on-surface tracking-tight mb-0 leading-none">Member portal</p>
                    <p className="text-micro text-accent font-bold tracking-tight mt-1 mb-0 leading-none">Active patriot</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-micro font-bold tracking-tight text-on-surface hover:bg-muted/5 transition-colors">
                    <User className="w-4 h-4 text-primary" /> Dashboard
                  </Link>
                  <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-micro font-bold tracking-tight text-on-surface hover:bg-muted/5 transition-colors">
                    <Settings className="w-4 h-4 text-on-surface/20" /> Settings
                  </Link>
                  <div className="border-t border-border/10 mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-5 py-3 text-micro font-bold tracking-tight text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hover:text-primary">
                <Link to="/login">
                  Login
                </Link>
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link to="/register">
                  Register
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsOpen(!isOpen)} className="text-on-surface/40 hover:text-primary transition-colors p-2">
            <span className="material-symbols-outlined text-3xl">{isOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-border/10 shadow-2xl px-6 py-8 space-y-2">
          <Link to="/" className={`block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive('/') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Home</Link>
          <Link to="/blog" className={`block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive('/blog') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Updates</Link>
          <Link to={isLoggedIn ? "/dashboard/polls" : "/polls"} className={`block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? '/dashboard/polls' : '/polls') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Polls</Link>
          <Link to={isLoggedIn ? "/dashboard/agenda" : "/our-agenda"} className={`block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? '/dashboard/agenda' : '/our-agenda') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>The Plan</Link>
          <Link to={isLoggedIn ? "/dashboard/chapters" : "/chapters"} className={`block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? '/dashboard/chapters' : '/chapters') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Chapters</Link>
          <Link to={isLoggedIn ? "/dashboard/store" : "/store"} className={`block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? '/dashboard/store' : '/store') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Supplies</Link>
          <Link to={isLoggedIn ? "/dashboard/donate" : "/donate"} className={`block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? '/dashboard/donate' : '/donate') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Donate</Link>
          <Link to={isLoggedIn ? "/dashboard/contact" : "/contact"} className={`block py-2.5 px-4 rounded-sm text-xs font-bold tracking-tight ${isActive(isLoggedIn ? '/dashboard/contact' : '/contact') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Contact</Link>
          
          <div className="pt-8 flex flex-col gap-3 border-t border-border/10 mt-4">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-3 py-3 px-4 bg-primary/5 text-primary rounded-sm text-micro font-bold tracking-tight"><User className="w-4 h-4"/> Dashboard</Link>
                <Link to="/settings" className="flex items-center gap-3 py-3 px-4 text-on-surface/60 rounded-sm text-micro font-bold tracking-tight"><Settings className="w-4 h-4"/> Settings</Link>
                <button onClick={handleLogout} className="flex items-center gap-3 py-3 px-4 text-destructive rounded-sm text-micro font-bold tracking-tight text-left"><LogOut className="w-4 h-4"/> Logout</button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="gold" className="w-full">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
