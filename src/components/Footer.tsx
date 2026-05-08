import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  FacebookIcon, 
  InstagramIcon, 
  TikTokIcon, 
  YouTubeIcon 
} from './icons/SocialIcons'
import { Button } from './ui/neon-button'
import { Send } from 'lucide-react'
import { adminService } from '../services/adminService'
import { useBranding } from '@/hooks/useBranding'

export default function Footer() {
  const { settings } = useBranding()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      const success = await adminService.subscribeToNewsletter(email)
      if (success) {
        setSubscribed(true)
        setEmail('')
      }
    }
  }

  return (
    <footer className="bg-surface-warm/30 text-on-surface py-24 font-body-md border-t border-border/10">
      <div className="max-w-[1440px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-8">
            <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <img alt="The Base Logo" className="h-14 w-14 object-contain" src={settings.logo_url} decoding="async" loading="lazy" />
              <div className="flex flex-col">
                <h2 className="text-on-surface font-bold text-2xl tracking-tight leading-none mb-0">The Base</h2>
                <span className="text-tiny font-bold text-primary tracking-tight mt-2">Ghana First, Jobs for the Youth!</span>
              </div>
            </Link>
            <p className="text-on-surface/60 text-sm leading-relaxed font-medium max-w-sm">
              We are a grassroots movement committed to youth jobs, accountable leadership, and national development. Join citizens across Ghana and the diaspora working for a more productive future.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <a href="https://www.facebook.com/profile.php?id=61579415816496" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Facebook">
                <FacebookIcon size={24} />
              </a>
              <a href="https://www.instagram.com/thebasemovementgh" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Instagram">
                <InstagramIcon size={24} />
              </a>
              <a href="https://www.tiktok.com/@thebasemovementgh" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="TikTok">
                <TikTokIcon size={24} />
              </a>
              <a href="https://www.youtube.com/@thebasemovementgh" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="YouTube">
                <YouTubeIcon size={24} />
              </a>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-6">
              <h4 className="text-primary font-bold tracking-tight text-tiny">Foundation</h4>
              <div className="flex flex-col space-y-4 text-micro font-bold tracking-tight text-on-surface/40">
                <Link className="hover:text-primary transition-colors" to="/our-agenda">The plan</Link>
                <Link className="hover:text-primary transition-colors" to="/impact">Impact</Link>
                <Link className="hover:text-primary transition-colors" to="/chapters">Chapters</Link>
                <Link className="hover:text-primary transition-colors" to="/polls">Polls</Link>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-primary font-bold tracking-tight text-tiny">Connect</h4>
              <div className="flex flex-col space-y-4 text-micro font-bold tracking-tight text-on-surface/40">
                <Link className="hover:text-primary transition-colors" to="/contact">Contact</Link>
                <Link className="hover:text-primary transition-colors" to="/press">Press</Link>
                <Link className="hover:text-primary transition-colors" to="/privacy">Privacy</Link>
                <Link className="hover:text-primary transition-colors" to="/terms">Terms of service</Link>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-primary font-bold tracking-tight text-tiny">Action</h4>
              <div className="flex flex-col space-y-4 text-micro font-bold tracking-tight text-on-surface/40">
                <Link className="hover:text-primary transition-colors" to="/register">Join</Link>
                <Link className="hover:text-primary transition-colors" to="/donate">Donate</Link>
                <Link className="hover:text-primary transition-colors" to="/store">Supplies</Link>
              </div>
            </div>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4 lg:pl-12">
            <div className="bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white">
              <h4 className="font-meta font-bold text-lg tracking-tight mb-4">Stay Informed.</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Subscribe to receive regular updates on our progress, community initiatives, and news from across the movement.
              </p>
              
              {subscribed ? (
                <div className="bg-brand-green/10 border border-brand-green/20 p-4 text-center">
                  <p className="text-brand-green text-tiny font-bold tracking-tight">Successfully Enlisted</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <div className="relative group">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      className="w-full bg-white/5 border border-white/10 p-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-green transition-all rounded-sm"
                    />
                  </div>
                  <Button type="submit" variant="primary" className="w-full h-12 flex items-center justify-center gap-2 group">
                    Subscribe
                    <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-24 pt-10 border-t border-border/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <p className="text-tiny text-on-surface/30 mb-0 font-bold tracking-tight">© 2026 The Base Movement. Ghana First.</p>
          </div>
          {/* Continuous Movement Gradient Bar */}
          <div className="w-48 h-2 bg-gradient-to-r from-destructive via-accent to-primary rounded-full shadow-[0_0_10px_rgba(206,17,38,0.1)] overflow-hidden">
            <div className="w-full h-full"></div>
          </div>
        </div>
      </div>
    </footer>
  )
}
