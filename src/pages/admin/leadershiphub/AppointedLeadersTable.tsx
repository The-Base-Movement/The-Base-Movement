import { SearchBar } from '@/components/SearchBar'

interface AppointedLeader {
  id: string
  chapter_name: string
  leader_name: string
  leader_id: string | null
  avatar_url: string | null
  registration_number: string | null
  phone_number: string | null
  status: string | null
  platform: string | null
  region: string | null
  constituency: string | null
  country: string | null
  profession: string | null
}

interface AppointedLeadersTableProps {
  allLeaders: AppointedLeader[]
  leadersSearch: string
  setLeadersSearch: (val: string) => void
  onViewLeader: (leader: AppointedLeader) => void
  onRemoveLeader: (leader: AppointedLeader) => Promise<void>
}

export function AppointedLeadersTable({
  allLeaders,
  leadersSearch,
  setLeadersSearch,
  onViewLeader,
  onRemoveLeader,
}: AppointedLeadersTableProps) {
  const q = leadersSearch.toLowerCase()
  const filtered = allLeaders.filter(
    (l) =>
      !q ||
      l.leader_name.toLowerCase().includes(q) ||
      l.chapter_name.toLowerCase().includes(q) ||
      (l.registration_number || '').toLowerCase().includes(q) ||
      (l.phone_number || '').toLowerCase().includes(q)
  )

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 10,
              textTransform: 'uppercase',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Appointed chapter officers
          </span>
          <p
            style={{
              margin: '4px 0 0',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 9,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
            }}
          >
            All leaders registered across chapters
          </p>
        </div>
        <div style={{ width: 220 }}>
          <SearchBar
            value={leadersSearch}
            onChange={setLeadersSearch}
            placeholder="Search leaders…"
            variant="dashboard"
          />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              background: 'hsl(var(--container-low))',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <tr>
              {['Officer', 'Chapter', 'Phone', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 24px',
                    textAlign: 'left',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {allLeaders.length === 0
                    ? 'No leaders have been appointed yet.'
                    : 'No officers match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 4,
                          background: 'hsl(var(--container-low))',
                          border: '1px solid hsl(var(--border))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          fontSize: 12,
                          flexShrink: 0,
                          overflow: 'hidden',
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {l.avatar_url ? (
                          <img
                            src={l.avatar_url}
                            alt={l.leader_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          l.leader_name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-semibold, 600)',
                            color: 'hsl(var(--on-surface))',
                            fontFamily: "'Public Sans', sans-serif",
                          }}
                        >
                          {l.leader_name}
                        </p>
                        {l.registration_number && (
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: 10,
                              fontWeight: 'var(--font-weight-normal, 400)',
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: "'Public Sans', sans-serif",
                            }}
                          >
                            {l.registration_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '14px 24px',
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {l.chapter_name}
                  </td>
                  <td
                    style={{
                      padding: '14px 24px',
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-normal, 400)',
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {l.phone_number || '—'}
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => onViewLeader(l)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                          person
                        </span>
                        View
                      </button>
                      <button className="btn btn-dest btn-sm" onClick={() => onRemoveLeader(l)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
