import type { PartyOfficial, PartyTier } from './utils'

interface OfficialsTableProps {
  loading: boolean
  officials: PartyOfficial[]
  tiers: PartyTier[]
  handleOpenModal: (official: PartyOfficial) => void
  handleDelete: (id: string) => void
}

const thSt: React.CSSProperties = {
  padding: '11px 20px',
  textAlign: 'left',
  fontWeight: 800,
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  borderBottom: '1px solid hsl(var(--border))',
}

const tdSt: React.CSSProperties = {
  padding: '14px 20px',
  borderBottom: '1px solid hsl(var(--border))',
}

function Avatar({ url, name }: { url?: string; name: string }) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'hsl(var(--container-low))',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid hsl(var(--border))',
      }}
    >
      <img
        src={url || '/officer-placeholder.png'}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}

function TierBadge({ official, tiers }: { official: PartyOfficial; tiers: PartyTier[] }) {
  return (
    <span
      style={{
        textTransform: 'uppercase',
        fontSize: 10,
        fontWeight: 800,
        color: 'hsl(var(--primary))',
        background: 'hsla(var(--primary), 0.08)',
        border: '1px solid hsla(var(--primary), 0.2)',
        borderRadius: 3,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {tiers.find((t) => t.name === official.tier)?.title || official.tier}
    </span>
  )
}

export function OfficialsTable({
  loading,
  officials,
  tiers,
  handleOpenModal,
  handleDelete,
}: OfficialsTableProps) {
  const empty = !loading && officials.length === 0

  return (
    <div className="panel" style={{ overflow: 'visible' }}>
      {/* ── Desktop table ── */}
      <div className="po-table-wrap" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thSt}>Name</th>
              <th style={thSt}>Role</th>
              <th style={thSt}>Tier</th>
              <th style={{ ...thSt, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: 'center' }}>
                  Loading...
                </td>
              </tr>
            ) : empty ? (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: 'center' }}>
                  No officials found.
                </td>
              </tr>
            ) : (
              officials.map((official) => (
                <tr key={official.id}>
                  <td style={{ ...tdSt, fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar url={official.avatar_url} name={official.name} />
                      {official.name}
                    </div>
                  </td>
                  <td style={tdSt}>
                    {official.role}
                    {official.region && (
                      <>
                        <br />
                        <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                          {official.region}
                        </span>
                      </>
                    )}
                  </td>
                  <td style={tdSt}>
                    <TierBadge official={official} tiers={tiers} />
                  </td>
                  <td style={{ ...tdSt, textAlign: 'right' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleOpenModal(official)}
                      style={{ marginRight: 8 }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      style={{
                        color: 'hsl(var(--destructive))',
                        borderColor: 'hsl(var(--destructive))',
                      }}
                      onClick={() => handleDelete(official.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="po-cards-wrap">
        {loading ? (
          <p style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>Loading...</p>
        ) : empty ? (
          <p style={{ padding: 20, textAlign: 'center', fontSize: 13 }}>No officials found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
            {officials.map((official) => (
              <div
                key={official.id}
                style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  padding: '14px 16px',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Top row: avatar + name/role/tier */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar url={official.avatar_url} name={official.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        }}
                      >
                        {official.name}
                      </span>
                      <TierBadge official={official} tiers={tiers} />
                    </div>
                    <div
                      style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}
                    >
                      {official.role}
                      {official.region ? ` · ${official.region}` : ''}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: '1px solid hsl(var(--border))',
                    paddingTop: 10,
                  }}
                >
                  <button
                    className="btn btn-sm btn-outline"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => handleOpenModal(official)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      color: 'hsl(var(--destructive))',
                      borderColor: 'hsl(var(--destructive))',
                    }}
                    onClick={() => handleDelete(official.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .po-cards-wrap { display: none; }
        @media (max-width: 768px) {
          .po-table-wrap { display: none; }
          .po-cards-wrap { display: block; }
        }
      `}</style>
    </div>
  )
}
