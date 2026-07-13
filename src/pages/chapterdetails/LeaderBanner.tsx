import { Link } from 'react-router-dom'

interface LeaderBannerProps {
  chapterSlug: string
}

export function LeaderBanner({ chapterSlug }: LeaderBannerProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f1310, #1a2618)',
        borderRadius: 6,
        padding: '14px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        border: '1px solid rgba(0,107,63,0.3)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'hsl(var(--accent))', flexShrink: 0 }}
        >
          manage_accounts
        </span>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13,
              color: '#fff',
            }}
          >
            You are the Diaspora Coordinator
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 2,
            }}
          >
            Manage members, donations and community info.
          </div>
        </div>
      </div>
      <Link
        to={`/dashboard/chapter-hub/${chapterSlug}`}
        className="btn btn-primary btn-sm"
        style={{ flexShrink: 0, textDecoration: 'none' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          open_in_new
        </span>
        Manage community
      </Link>
    </div>
  )
}
