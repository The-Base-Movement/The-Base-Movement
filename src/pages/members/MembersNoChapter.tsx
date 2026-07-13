import { Link } from 'react-router-dom'

export function MembersNoChapter() {
  return (
    <div className="panel" style={{ padding: '56px 24px', textAlign: 'center' }}>
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 52,
          color: 'hsl(var(--on-surface-muted))',
          opacity: 0.2,
          display: 'block',
          marginBottom: 16,
        }}
      >
        group_add
      </span>
      <div
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-medium, 500)',
          fontSize: 16,
          color: 'hsl(var(--on-surface))',
          marginBottom: 8,
        }}
      >
        You haven't joined a diaspora community yet
      </div>
      <div
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontWeight: 'var(--font-weight-normal, 400)',
          fontSize: 12,
          color: 'hsl(var(--on-surface-muted))',
          marginBottom: 24,
          maxWidth: 380,
          margin: '0 auto 24px',
        }}
      >
        Join a Base Diaspora community to connect with compatriots in your area and see your local
        directory.
      </div>
      <Link to="/dashboard/chapters" className="btn btn-primary" style={{ display: 'inline-flex' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          explore
        </span>
        Browse Base Diaspora
      </Link>
    </div>
  )
}
