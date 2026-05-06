import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-muted/5 text-on-surface py-20 font-body-md border-t border-border/10">
      <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-16">
        <div className="md:col-span-1 space-y-6">
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <img alt="The Base Logo" className="h-12 w-12" src="/logo.png"  decoding="async" loading="lazy" />
            <div className="flex flex-col">
              <h2 className="text-on-surface font-black uppercase tracking-tighter leading-none mb-0">The Base</h2>
              <span className="text-[12px] font-black text-primary tracking-[0.2em] mt-2">Ghana First, Jobs for the Youth!</span>
            </div>
          </Link>
          <p className="text-on-surface/60 text-sm leading-relaxed font-medium">
            A global political movement connecting Ghanaians and friends of Ghana worldwide. Building community, driving progress.
          </p>
          <div className="flex items-center gap-5 pt-4">
            <a href="https://www.facebook.com/profile.php?id=61579415816496" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Facebook">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/thebasemovementgh" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="Instagram">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <defs>
                  <radialGradient id="instagram-gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(22.316 22.316 -23.155 23.155 1.5 22.5)">
                    <stop stopColor="#FED011"/>
                    <stop offset=".05" stopColor="#FED011"/>
                    <stop offset=".45" stopColor="#F70038"/>
                    <stop offset=".9" stopColor="#C90083"/>
                  </radialGradient>
                </defs>
                <path fill="url(#instagram-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.805.249 2.227.412.56.216.96.474 1.38.894.42.42.678.82.894 1.38.163.422.358 1.057.412 2.227.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.805-.412 2.227-.216.56-.474.96-.894 1.38-.42.42-.82.678-1.38.894-.422.163-1.057.358-2.227.412-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.805-.249-2.227-.412-.56-.216-.96-.474-1.38-.894-.42-.42-.678-.82-.894-1.38-.163-.422-.358-1.057-.412-2.227-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.054-1.17.249-1.805.412-2.227.216-.56.474-.96.894-1.38.42-.42.82-.678 1.38-.894.422-.163 1.057-.358 2.227-.412 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-1.277.057-2.148.258-2.911.553-.788.305-1.458.715-2.125 1.382-.667.667-1.077 1.337-1.382 2.125-.295.763-.496 1.634-.553 2.911-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.057 1.277.258 2.148.553 2.911.305.788.715 1.458 1.382 2.125.667.667 1.337 1.077 2.125 1.382.763.295 1.634.496 2.911.553 1.28.058 1.688.072 4.947.072s3.667-.014 4.947-.072c1.277-.057 2.148-.258 2.911-.553.788-.305 1.458-.715 2.125-1.382.667-.667 1.077-1.337 1.382-2.125.763-.295 1.634-.496 2.911-.553 1.28-.058 1.688-.072 4.947-.072s3.667.014 4.947.072c1.277.057 2.148-.258 2.911-.553.788-.305 1.458-.715 2.125-1.382.667-.667 1.337-1.077 2.125-1.382.763-.295 1.634-.496 2.911-.553 1.28-.058 1.688-.072 4.947-.072zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@thebasemovementgh" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="TikTok">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.53 18.66c-3.13 0-5.67-2.54-5.67-5.67s2.54-5.67 5.67-5.67v3.34c-1.28 0-2.33 1.04-2.33 2.33s1.04 2.33 2.33 2.33c1.28 0 2.33-1.04 2.33-2.33V2h3.33c0 2.21 1.79 4 4 4v3.33c-1.06 0-2.03-.41-2.76-1.08v6.75c0 3.13-2.54 5.66-5.67 5.66z" fill="#000"/>
                <path d="M12.53 18.66c-3.13 0-5.67-2.54-5.67-5.67s2.54-5.67 5.67-5.67v3.34c-1.28 0-2.33 1.04-2.33 2.33s1.04 2.33 2.33 2.33c1.28 0 2.33-1.04 2.33-2.33V2h3.33c0 2.21 1.79 4 4 4v3.33c-1.06 0-2.03-.41-2.76-1.08v6.75c0 3.13-2.54 5.66-5.67 5.66z" fill="#25F4EE" style={{ mixBlendMode: 'multiply', transform: 'translate(-1px, -1px)' }}/>
                <path d="M12.53 18.66c-3.13 0-5.67-2.54-5.67-5.67s2.54-5.67 5.67-5.67v3.34c-1.28 0-2.33 1.04-2.33 2.33s1.04 2.33 2.33 2.33c1.28 0 2.33-1.04 2.33-2.33V2h3.33c0 2.21 1.79 4 4 4v3.33c-1.06 0-2.03-.41-2.76-1.08v6.75c0 3.13-2.54 5.66-5.67 5.66z" fill="#FE2C55" style={{ mixBlendMode: 'multiply', transform: 'translate(1px, 1px)' }}/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@thebasemovementgh" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" title="YouTube">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-primary font-black tracking-[0.2em] text-[12px] uppercase">Foundation</h4>
          <div className="flex flex-col space-y-3 text-xs font-black tracking-widest text-on-surface/40">
            <Link className="hover:text-primary transition-colors" to="/our-agenda">The plan</Link>
            <Link className="hover:text-primary transition-colors" to="/impact">Our impact</Link>
            <Link className="hover:text-primary transition-colors" to="/chapters">Chapters</Link>
            <Link className="hover:text-primary transition-colors" to="/members">Members</Link>
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-primary font-black tracking-[0.2em] text-[12px] uppercase">Connect</h4>
          <div className="flex flex-col space-y-3 text-xs font-black tracking-widest text-on-surface/40">
            <Link className="hover:text-primary transition-colors" to="/contact">Contact us</Link>
            <Link className="hover:text-primary transition-colors" to="/press">Press</Link>
            <Link className="hover:text-primary transition-colors" to="/privacy">Privacy</Link>
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-primary font-black tracking-[0.2em] text-[12px] uppercase">Action</h4>
          <div className="flex flex-col space-y-3 text-xs font-black tracking-widest text-on-surface/40">
            <Link className="hover:text-primary transition-colors" to="/register">Join base</Link>
            <Link className="hover:text-primary transition-colors" to="/donate">Donate</Link>
            <Link className="hover:text-primary transition-colors" to="/store">Supplies</Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-[1440px] mx-auto px-8 mt-20 pt-10 border-t border-border/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[12px] text-on-surface/20 mb-0 font-black tracking-[0.2em]">© 2026 The Base Movement. Ghana First.</p>
        <div className="flex gap-1.5">
          <div className="w-10 h-1.5 bg-destructive"></div>
          <div className="w-10 h-1.5 bg-accent"></div>
          <div className="w-10 h-1.5 bg-primary"></div>
        </div>
      </div>
    </footer>
  )
}
