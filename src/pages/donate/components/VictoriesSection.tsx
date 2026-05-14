import type { DonationCampaign } from '@/types/admin'

interface VictoriesSectionProps {
  pastCampaigns: DonationCampaign[]
}

export function VictoriesSection({ pastCampaigns }: VictoriesSectionProps) {
  if (pastCampaigns.length === 0) return null

  return (
    <section style={{ marginTop: 128 }}>
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ 
          fontSize: 'clamp(26px, 5vw, 44px)', 
          fontWeight: 900, 
          color: 'hsl(var(--on-surface))', 
          fontFamily: "'Public Sans', sans-serif",
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 16
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 'clamp(32px, 5vw, 48px)', color: 'hsl(var(--primary))' }}>verified</span>
          Strategic victories
        </h2>
        <p style={{ 
          fontSize: 10.5, 
          fontWeight: 800, 
          color: 'hsl(var(--on-surface-muted))', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em', 
          marginTop: 8,
          fontFamily: "'Public Sans', sans-serif"
        }}>Historical proof of patriot mobilization success.</p>
      </div>
      
      <div className="stat-grid">
        {pastCampaigns.map(c => (
          <div key={c.id} style={{ 
            background: '#fff', 
            border: '1px solid hsl(var(--border))', 
            padding: 24, 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative', 
            filter: 'grayscale(0.5)',
            opacity: 0.8,
            transition: 'all 0.5s ease'
          }} className="hover:grayscale-0 hover:opacity-100">
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
              <span style={{ 
                background: 'hsl(var(--on-surface))', 
                color: '#fff', 
                fontSize: 9, 
                fontWeight: 900, 
                padding: '4px 10px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                textTransform: 'uppercase',
                fontFamily: "'Public Sans', sans-serif"
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'hsl(var(--primary))' }}>check_circle</span> 100% secured
              </span>
            </div>
            <div style={{ aspectRatio: '1/1', background: 'hsl(var(--container-low))', marginBottom: 24, overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
              {c.imageUrl && <img src={c.imageUrl} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}  decoding="async" loading="lazy" />}
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 900, color: 'hsl(var(--on-surface))', marginBottom: 8, letterSpacing: '-0.01em', fontFamily: "'Public Sans', sans-serif" }}>{c.title}</h4>
            <p style={{ 
              fontSize: 12, 
              color: 'hsl(var(--on-surface-muted))', 
              marginBottom: 32, 
              fontWeight: 700, 
              lineHeight: 1.5,
              fontFamily: "'Public Sans', sans-serif",
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>{c.description}</p>
            <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>Total impact</p>
                <p style={{ fontSize: 14, fontWeight: 900, color: 'hsl(var(--primary))', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>₵ {c.raisedAmount.toLocaleString()}</p>
              </div>
              <span style={{ fontSize: 9, fontWeight: 900, color: 'hsl(var(--border))', fontStyle: 'italic', textTransform: 'lowercase' }}>decommissioned</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
