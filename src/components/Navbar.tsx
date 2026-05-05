import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User, Settings, LogOut } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true'
  )
  const [userAvatar, setUserAvatar] = useState(
    () => localStorage.getItem('userAvatar') || 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
  )
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
    <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <nav className="flex justify-between items-center max-w-[1280px] mx-auto px-8 h-20">
        <div className="flex items-center gap-4">
          <img alt="The Base Logo" className="h-10 w-10" src="/logo.png"  decoding="async" />
          <Link to="/" className="text-emerald-900 dark:text-emerald-50 hover:opacity-80 transition-opacity mb-0">
            <h1 className="text-xl mb-0">The Base</h1>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-bold tracking-tight uppercase">
          <Link 
            to="/" 
            className={`transition-colors duration-200 ${isActive('/') ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 pb-1' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700'}`}
          >
            Home
          </Link>
          <Link 
            to="/blog" 
            className={`transition-colors duration-200 ${isActive('/blog') ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 pb-1' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700'}`}
          >
            Blog
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/agenda" : "/our-agenda"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/agenda' : '/our-agenda') ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 pb-1' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700'}`}
          >
            Our Agenda
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/store" : "/store"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/store' : '/store') ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 pb-1' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700'}`}
          >
            Store
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/donate" : "/donate"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/donate' : '/donate') ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 pb-1' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700'}`}
          >
            Donate
          </Link>
          <Link 
            to={isLoggedIn ? "/dashboard/contact" : "/contact"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/contact' : '/contact') ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 pb-1' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-700'}`}
          >
            Contact
          </Link>
          {isLoggedIn && (
            <Link 
              to="/dashboard" 
              className={`transition-colors duration-200 font-bold ${isActive('/dashboard') ? 'text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 pb-1' : 'text-[var(--brand-green)] hover:text-emerald-700'}`}
            >
              Dashboard
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
              >
                <img src={userAvatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-[var(--brand-green)] object-cover"  decoding="async" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-charcoal-dark mb-0">Member Portal</p>
                    <p className="text-xs text-slate-500 mb-0 font-bold uppercase tracking-widest">Active</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-dark hover:bg-slate-50 font-meta transition-colors">
                    <User className="w-4 h-4 text-[var(--brand-green)]" /> Dashboard
                  </Link>
                  <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-charcoal-dark hover:bg-slate-50 font-meta transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" /> Profile Settings
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-[var(--brand-red)] hover:bg-red-50 font-meta transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="px-6 py-2 border border-[var(--brand-green)] text-[var(--brand-green)] text-sm font-bold uppercase tracking-widest hover:bg-surface-warm transition-all active:scale-95">
                Login
              </Link>
              <Link to="/register" className="px-6 py-2 bg-[var(--brand-green)] text-white text-sm font-bold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsOpen(!isOpen)} className="text-slate-500 hover:text-emerald-800">
            <span className="material-symbols-outlined text-3xl">{isOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg px-4 py-4 space-y-4 font-meta">
          <Link to="/" className={`block py-2 ${isActive('/') ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}>Home</Link>
          <Link to="/blog" className={`block py-2 ${isActive('/blog') ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}>Blog</Link>
          <Link to={isLoggedIn ? "/dashboard/agenda" : "/our-agenda"} className={`block py-2 ${isActive(isLoggedIn ? '/dashboard/agenda' : '/our-agenda') ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}>Our Agenda</Link>
          <Link to={isLoggedIn ? "/dashboard/store" : "/store"} className={`block py-2 ${isActive(isLoggedIn ? '/dashboard/store' : '/store') ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}>Store</Link>
          <Link to={isLoggedIn ? "/dashboard/donate" : "/donate"} className={`block py-2 ${isActive(isLoggedIn ? '/dashboard/donate' : '/donate') ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}>Donate</Link>
          <Link to={isLoggedIn ? "/dashboard/contact" : "/contact"} className={`block py-2 ${isActive(isLoggedIn ? '/dashboard/contact' : '/contact') ? 'text-emerald-800 font-bold' : 'text-slate-600'}`}>Contact</Link>
          <div className="pt-4 flex flex-col gap-3 border-t border-gray-100">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 py-2 text-emerald-800 font-bold"><User className="w-4 h-4"/> Dashboard</Link>
                <Link to="/settings" className="flex items-center gap-2 py-2 text-slate-600"><Settings className="w-4 h-4"/> Profile Settings</Link>
                <button onClick={handleLogout} className="flex items-center gap-2 py-2 text-[var(--brand-red)] font-bold text-left"><LogOut className="w-4 h-4"/> Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-center px-6 py-3 border border-[var(--brand-green)] text-[var(--brand-green)] font-meta transition-all active:scale-95">Login</Link>
                <Link to="/register" className="text-center px-6 py-3 bg-[var(--brand-green)] text-white font-meta transition-all active:scale-95">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
