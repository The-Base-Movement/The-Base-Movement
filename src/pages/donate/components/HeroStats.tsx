interface HeroStatsProps {
  totalRaised: number
  totalMembers: number
}

export function HeroStats({ totalRaised, totalMembers }: HeroStatsProps) {
  return (
    <div className="bg-on-surface text-white relative overflow-hidden py-12">
      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--brand-green)_0%,_transparent_70%)]"></div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--brand-green-full)]"></span>
              <span className="text-micro font-bold text-white/90 tracking-tight">Financial mobilization unit</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-meta font-bold tracking-tight mb-4">
              Total mobilized: <span className="text-primary">₵ {totalRaised.toLocaleString()}</span>
            </h2>
            <div className="max-w-md">
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 mb-2">
                <div 
                  className="h-full bg-primary shadow-[0_0_15px_rgba(var(--brand-green-rgb),0.5)] transition-all duration-1000"
                  style={{ width: '68%' }} 
                />
              </div>
              <p className="text-micro font-bold text-white/40 tracking-tight">68% of quarterly tactical goal achieved</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 border border-white/10 backdrop-blur-md rounded-sm">
              <p className="text-micro font-bold text-white/40 tracking-tight mb-2">Active patriots</p>
              <h3 className="text-2xl font-bold text-white mb-0">{totalMembers.toLocaleString()}</h3>
            </div>
            <div className="bg-white/5 p-6 border border-white/10 backdrop-blur-md rounded-sm">
              <p className="text-micro font-bold text-white/40 tracking-tight mb-2">Regions covered</p>
              <h3 className="text-2xl font-bold text-white mb-0">16/16</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
