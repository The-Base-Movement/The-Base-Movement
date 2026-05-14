interface HeroStatsProps {
  totalRaised: number
  totalMembers: number
}

export function HeroStats({ totalRaised, totalMembers }: HeroStatsProps) {
  return (
    <div style={{ background: 'hsl(var(--on-surface))', color: '#fff', position: 'relative', overflow: 'hidden', padding: '48px 0' }}>
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 0, 
        opacity: 0.1, 
        background: 'radial-gradient(circle at center, hsl(var(--primary)) 0%, transparent 70%)' 
      }}></div>
      
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)', position: 'relative', zIndex: 10 }}>
        <div className="hero-stats-grid" style={{ alignItems: 'center', gap: 32 }}>
          <div>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '4px 12px', 
              borderRadius: 99, 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              marginBottom: 24,
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                background: 'hsl(var(--primary))', 
                boxShadow: '0 0 8px hsl(var(--primary))' 
              }}></span>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif" }}>Financial mobilization unit</span>
            </div>
            
            <h2 style={{ 
              fontSize: 'clamp(24px, 4vw, 36px)', 
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 900, 
              letterSpacing: '-0.02em', 
              marginBottom: 16,
              lineHeight: 1.2
            }}>
              Total mobilized: <span style={{ color: 'hsl(var(--primary))' }}>₵ {totalRaised.toLocaleString()}</span>
            </h2>
            
            <div style={{ maxWidth: 448 }}>
              <div style={{ height: 8, width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8 }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: 'hsl(var(--primary))', 
                    boxShadow: '0 0 15px rgba(0,107,63,0.5)', 
                    transition: 'all 1s ease-out',
                    width: '68%' 
                  }} 
                />
              </div>
              <p style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: "'Public Sans', sans-serif" }}>68% of quarterly tactical goal achieved</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 4 }}>
              <p style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Public Sans', sans-serif" }}>Active patriots</p>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>{totalMembers.toLocaleString()}</h3>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 24, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', borderRadius: 4 }}>
              <p style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, fontFamily: "'Public Sans', sans-serif" }}>Regions covered</p>
              <h3 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>16/16</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
