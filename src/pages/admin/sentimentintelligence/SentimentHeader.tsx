import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface SentimentHeaderProps {
  nationalScore: number
}

export function SentimentHeader({ nationalScore }: SentimentHeaderProps) {
  return (
    <AdminPageHeader
      title="Movement pulse"
      icon="psychology"
      description="Real-time member feedback and regional mood analysis."
      actions={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 16px',
              background: 'hsl(var(--container-low))',
              borderRadius: 4,
              border: '1px solid hsl(var(--border))',
            }}
          >
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              National average
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 20,
                  color: nationalScore >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
                }}
              >
                {(nationalScore * 100).toFixed(1)}
              </span>
              <span
                className="material-symbols-outlined"
                style={{
                  color: nationalScore >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
                }}
              >
                monitoring
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
              onClick={() =>
                toast.success('Analysis started: Aggregating regional sentiment data...')
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                query_stats
              </span>
              Run Analysis
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ flex: 1 }}
              onClick={() => toast.success('Report exported: Your intelligence briefing is ready.')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                file_download
              </span>
              Export Briefing
            </button>
          </div>
        </div>
      }
    />
  )
}
