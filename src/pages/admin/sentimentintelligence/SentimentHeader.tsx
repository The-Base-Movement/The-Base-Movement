import { toast } from 'sonner'
import { BrandLine } from '@/components/ui/BrandLine'

interface SentimentHeaderProps {
  nationalScore: number
}

export function SentimentHeader({ nationalScore }: SentimentHeaderProps) {
  return (
    <div className="top">
      <div>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            psychology
          </span>
          Sentiment intelligence
        </h2>
        <div style={{ marginTop: 12 }}>
          <BrandLine />
        </div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            marginTop: 8,
          }}
        >
          AI-powered member sentiment tracking and mobilization impact forecasting.
        </p>
      </div>
      <div className="actions">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px',
            background: 'hsl(var(--container-low))',
            borderRadius: 4,
            border: '1px solid hsl(var(--border))',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                display: 'block',
              }}
            >
              National average
            </span>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 18,
                color: nationalScore >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
              }}
            >
              {(nationalScore * 100).toFixed(1)}
            </span>
          </div>
          <span
            className="material-symbols-outlined"
            style={{
              color: nationalScore >= 0 ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
            }}
          >
            monitoring
          </span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => toast.success('Analysis started: Aggregating regional sentiment data...')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            query_stats
          </span>
          Run AI Analysis
        </button>
        <button
          className="btn btn-outline"
          onClick={() => toast.success('Report exported: Your intelligence briefing is ready.')}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            file_download
          </span>
          Export Briefing
        </button>
      </div>
    </div>
  )
}
