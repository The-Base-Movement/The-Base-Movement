import type { Constituency } from '@/types/admin'

interface Props {
  constituency: Constituency
  slug: string
}

export function Header({ constituency, slug }: Props) {
  return (
    <div
      className="panel"
      style={{ padding: '20px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: 'hsl(var(--primary))',
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {constituency.name}
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '4px 0 0' }}>
            {constituency.regionName} Region · Constituency Hub
          </p>
        </div>
        <a
          href={`/dashboard/constituencies/${slug}`}
          className="btn btn-outline btn-sm"
          style={{ textDecoration: 'none' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            open_in_new
          </span>
          Public View
        </a>
      </div>
    </div>
  )
}

export default Header
