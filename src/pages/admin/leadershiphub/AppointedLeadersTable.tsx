import { useState } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { SortToggle } from '@/components/ui/SortToggle'

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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const q = leadersSearch.toLowerCase()
  const filtered = allLeaders.filter(
    (l) =>
      !q ||
      l.leader_name.toLowerCase().includes(q) ||
      l.chapter_name.toLowerCase().includes(q) ||
      (l.registration_number || '').toLowerCase().includes(q) ||
      (l.phone_number || '').toLowerCase().includes(q)
  )

  const sorted = [...filtered].sort((a, b) => {
    const nameA = a.leader_name || ''
    const nameB = b.leader_name || ''
    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
  })

  const Avatar = ({ l }: { l: AppointedLeader }) => (
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
        fontWeight: 'var(--font-weight-medium, 500)',
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
  )

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden', marginTop: 24 }}>
      {/* Header */}
      <div className="leaders-panel-header">
        <div>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13,
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
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            All leaders registered across chapters
          </p>
        </div>
        <div
          className="leaders-search-wrap"
          style={{ display: 'flex', gap: 6, alignItems: 'center' }}
        >
          <SearchBar
            value={leadersSearch}
            onChange={setLeadersSearch}
            placeholder="Search leaders…"
            variant="dashboard"
          />
          <SortToggle value={sortOrder} onChange={setSortOrder} />
        </div>
      </div>

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              background: 'hsl(var(--container-low))',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <tr>
              {['Officer', 'Diaspora', 'Phone', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 24px',
                    textAlign: 'left',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
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
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {allLeaders.length === 0
                    ? 'No leaders have been appointed yet.'
                    : 'No officers match your search.'}
                </td>
              </tr>
            ) : (
              sorted.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar l={l} />
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
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

      {/* Mobile card list */}
      <div className="mobile-only">
        {sorted.length === 0 ? (
          <p
            style={{
              padding: '40px 16px',
              textAlign: 'center',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            {allLeaders.length === 0
              ? 'No leaders have been appointed yet.'
              : 'No officers match your search.'}
          </p>
        ) : (
          sorted.map((l) => (
            <div
              key={l.id}
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Avatar l={l} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {l.leader_name}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-normal, 400)',
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {l.chapter_name}
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => onViewLeader(l)}
              >
                View
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
