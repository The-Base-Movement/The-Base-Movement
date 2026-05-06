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
    <header className="bg-white border-b border-border/40 sticky top-0 z-50">
      <nav className="flex justify-between items-center max-w-[1440px] mx-auto px-8 h-20">
        <div className="flex items-center gap-4">
          <img alt="The Base Logo" className="h-10 w-10" src="/logo.png"  decoding="async" />
          <Link to="/" className="text-on-surface hover:opacity-80 transition-opacity mb-0">
            <h1 className="text-xl font-black uppercase tracking-tighter mb-0">The Base</h1>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-10 text-[10px] font-black tracking-widest">
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
            to={isLoggedIn ? "/dashboard/agenda" : "/our-agenda"} 
            className={`transition-colors duration-200 ${isActive(isLoggedIn ? '/dashboard/agenda' : '/our-agenda') ? 'text-primary' : 'text-on-surface/40 hover:text-primary'}`}
          >
            The Plan
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

        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity"
              >
                <img src={userAvatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-primary object-cover"  decoding="async" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-border/40 shadow-2xl rounded-2xl py-3 z-50">
                  <div className="px-5 py-3 border-b border-border/10 mb-2">
                    <p className="text-xs font-black text-on-surface tracking-tighter mb-0 leading-none">Member portal</p>
                    <p className="text-[9px] text-accent font-black tracking-[0.2em] mt-1 mb-0 uppercase leading-none">Active patriot</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[10px] font-black tracking-widest text-on-surface hover:bg-muted/5 transition-colors">
                    <User className="w-4 h-4 text-primary" /> Dashboard
                  </Link>
                  <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[10px] font-black tracking-widest text-on-surface hover:bg-muted/5 transition-colors">
                    <Settings className="w-4 h-4 text-on-surface/20" /> Settings
                  </Link>
                  <div className="border-t border-border/10 mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-5 py-3 text-[10px] font-black tracking-widest text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="px-6 h-11 flex items-center justify-center border border-primary text-primary text-[10px] font-black tracking-widest hover:bg-primary/5 transition-all active:scale-95 rounded-xl">
                Login
              </Link>
              <Link to="/register" className="px-6 h-11 flex items-center justify-center bg-primary text-white text-[10px] font-black tracking-widest hover:brightness-110 transition-all active:scale-95 rounded-xl shadow-lg shadow-primary/20">
                Register
              </Link>
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
          <Link to="/" className={`block py-3 px-4 rounded-xl text-[10px] font-black tracking-widest ${isActive('/') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Home</Link>
          <Link to="/blog" className={`block py-3 px-4 rounded-xl text-[10px] font-black tracking-widest ${isActive('/blog') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Updates</Link>
          <Link to={isLoggedIn ? "/dashboard/agenda" : "/our-agenda"} className={`block py-3 px-4 rounded-xl text-[10px] font-black tracking-widest ${isActive(isLoggedIn ? '/dashboard/agenda' : '/our-agenda') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>The Plan</Link>
          <Link to={isLoggedIn ? "/dashboard/store" : "/store"} className={`block py-3 px-4 rounded-xl text-[10px] font-black tracking-widest ${isActive(isLoggedIn ? '/dashboard/store' : '/store') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Supplies</Link>
          <Link to={isLoggedIn ? "/dashboard/donate" : "/donate"} className={`block py-3 px-4 rounded-xl text-[10px] font-black tracking-widest ${isActive(isLoggedIn ? '/dashboard/donate' : '/donate') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Donate</Link>
          <Link to={isLoggedIn ? "/dashboard/contact" : "/contact"} className={`block py-3 px-4 rounded-xl text-[10px] font-black tracking-widest ${isActive(isLoggedIn ? '/dashboard/contact' : '/contact') ? 'bg-primary/5 text-primary' : 'text-on-surface/60'}`}>Contact</Link>
          
          <div className="pt-8 flex flex-col gap-3 border-t border-border/10 mt-4">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-3 py-4 px-4 bg-primary/5 text-primary rounded-xl text-[10px] font-black tracking-widest"><User className="w-4 h-4"/> Dashboard</Link>
                <Link to="/settings" className="flex items-center gap-3 py-4 px-4 text-on-surface/60 rounded-xl text-[10px] font-black tracking-widest"><Settings className="w-4 h-4"/> Settings</Link>
                <button onClick={handleLogout} className="flex items-center gap-3 py-4 px-4 text-destructive rounded-xl text-[10px] font-black tracking-widest text-left"><LogOut className="w-4 h-4"/> Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-center px-6 py-4 border border-primary text-primary rounded-xl text-[10px] font-black tracking-widest transition-all active:scale-95">Login</Link>
                <Link to="/register" className="text-center px-6 py-4 bg-primary text-white rounded-xl text-[10px] font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
