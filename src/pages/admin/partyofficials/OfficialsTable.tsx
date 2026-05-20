import type { PartyOfficial, PartyTier } from './utils'

interface OfficialsTableProps {
  loading: boolean
  officials: PartyOfficial[]
  tiers: PartyTier[]
  handleOpenModal: (official: PartyOfficial) => void
  handleDelete: (id: string) => void
}

export function OfficialsTable({
  loading,
  officials,
  tiers,
  handleOpenModal,
  handleDelete,
}: OfficialsTableProps) {
  return (
    <div className="panel" style={{ overflow: 'visible' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  padding: '11px 20px',
                  textAlign: 'left',
                  fontWeight: 800,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                Name
              </th>
              <th
                style={{
                  padding: '11px 20px',
                  textAlign: 'left',
                  fontWeight: 800,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                Role
              </th>
              <th
                style={{
                  padding: '11px 20px',
                  textAlign: 'left',
                  fontWeight: 800,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                Tier
              </th>
              <th
                style={{
                  padding: '11px 20px',
                  textAlign: 'right',
                  fontWeight: 800,
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  borderBottom: '1px solid hsl(var(--border))',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: 'center' }}>
                  Loading...
                </td>
              </tr>
            ) : officials.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: 'center' }}>
                  No officials found.
                </td>
              </tr>
            ) : (
              officials.map((official) => (
                <tr key={official.id}>
                  <td
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid hsl(var(--border))',
                      fontWeight: 700,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'hsl(var(--container-low))',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={official.avatar_url || '/officer-placeholder.png'}
                          alt={official.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      {official.name}
                    </div>
                  </td>
                  <td
                    style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))' }}
                  >
                    {official.role} <br />
                    <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                      {official.region}
                    </span>
                  </td>
                  <td
                    style={{ padding: '14px 20px', borderBottom: '1px solid hsl(var(--border))' }}
                  >
                    <span
                      style={{
                        textTransform: 'uppercase',
                        fontSize: 11,
                        fontWeight: 800,
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      {tiers.find((t) => t.name === official.tier)?.title || official.tier}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid hsl(var(--border))',
                      textAlign: 'right',
                    }}
                  >
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
    </div>
  )
}
