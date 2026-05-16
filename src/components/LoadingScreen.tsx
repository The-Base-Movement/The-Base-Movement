import { Spinner } from '@/components/buttons/ui/spinner'

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
      <div className="relative">
        {/* Animated Brand Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)] blur-2xl opacity-10 animate-pulse"></div>
        
        <div className="relative flex flex-col items-center">
          <Spinner className="w-10 h-10 text-[var(--brand-green)] mb-6" />
          
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight font-meta animate-pulse">
              THE BASE
            </h2>
            <p className="text-micro font-bold text-stone-400 tracking-tight">
              Initializing movement assets
            </p>
          </div>
        </div>
      </div>
      
      {/* Bottom Progress Indicator */}
      <div className="fixed bottom-12 w-48 h-0.5 bg-stone-200 overflow-hidden">
        <div className="w-full h-full bg-[var(--brand-green)] origin-left animate-loading-bar"></div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-30%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}} />
    </div>
  )
}
