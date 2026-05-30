import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { constituencyService, constituencySlug } from '@/services/constituencyService'
import { useAuth } from '@/context/AuthContext'
import type { Constituency } from '@/types/admin'

const GHANA_REGIONS = [
  'All Regions',
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

export default function Constituencies() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')

  const userConstituency = user?.user_metadata?.constituency as string | undefined

  useEffect(() => {
    constituencyService.getConstituencies().then((data) => {
      setConstituencies(data)
      setLoading(false)
    })
  }, [])

  const filtered = constituencies.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRegion = selectedRegion === 'All Regions' || c.regionName === selectedRegion
    return matchSearch && matchRegion
  })

  const total = constituencies.length
  const activeCount = constituencies.filter((c) => c.status === 'Active').length
  const totalMembers = constituencies.reduce((sum, c) => sum + c.memberCount, 0)

  return (
    <div className="main">
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Constituencies
        </h1>
        <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '4px 0 0' }}>
          Connect with your local constituency hub
        </p>
      </div>

      <div className="kpis" style={{ marginBottom: 24 }}>
        <div
          className="panel"
          style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: 'hsl(var(--primary))',
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            Constituencies
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {total}
          </p>
        </div>
        <div
          className="panel"
          style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: 'hsl(var(--accent))',
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            Active
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {activeCount}
          </p>
        </div>
        <div
          className="panel"
          style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: 'hsl(var(--on-surface))',
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            Total Members
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {totalMembers}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search constituencies..."
            style={{
              width: '100%',
              height: 40,
              paddingLeft: 36,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              boxSizing: 'border-box',
              background: 'hsl(var(--background))',
            }}
          />
        </div>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          style={{
            height: 40,
            padding: '0 12px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            background: 'hsl(var(--background))',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {GHANA_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
          Loading constituencies...
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 14 }}>
          No constituencies found.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((c) => {
            const isOwn = userConstituency === c.name
            return (
              <div
                key={c.id}
                className="panel"
                onClick={() => navigate(`/dashboard/constituencies/${constituencySlug(c.name)}`)}
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  border: isOwn ? `2px solid hsl(var(--primary))` : undefined,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
              >
                {isOwn && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: 'hsl(var(--primary))',
                    }}
                  />
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                      }}
                    >
                      {c.name}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: '2px 0 0',
                      }}
                    >
                      {c.regionName}
                    </p>
                  </div>
                  <span className={`pill ${c.status === 'Active' ? 'pill-ok' : 'pill-mute'}`}>
                    {c.status}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      group
                    </span>
                    {c.memberCount} members
                  </span>
                  {c.leaderName && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        person
                      </span>
                      {c.leaderName}
                    </span>
                  )}
                </div>
                {isOwn && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 11,
                      color: 'hsl(var(--primary))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    Your constituency
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
