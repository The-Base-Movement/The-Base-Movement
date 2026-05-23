import type { Entry } from './types'

interface SpendingLedgerTableProps {
  filtered: Entry[]
  loading: boolean
  searchQuery: string
  setSearchQuery: (q: string) => void
  openAdd: () => void
  openEdit: (entry: Entry) => void
  openDelete: (entry: Entry) => void
}

export function SpendingLedgerTable({
  filtered,
  loading,
  searchQuery,
  setSearchQuery,
  openAdd,
  openEdit,
  openDelete,
}: SpendingLedgerTableProps) {
  return (
    <div className="panel">
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            aria-label="Search spending entries"
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: 38,
              paddingLeft: 34,
              paddingRight: 12,
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button onClick={openAdd} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            add
          </span>
          Add entry
        </button>
      </div>

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
              }}
            >
              {['Description', 'Category', 'Chapter', 'Amount', 'Date', ''].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: '10px 16px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    textAlign: i === 3 || i === 5 ? 'right' : 'left',
                    whiteSpace: 'nowrap',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: '48px 16px',
                    textAlign: 'center',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 13,
                    fontStyle: 'italic',
                  }}
                >
                  Loading entries…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '56px 16px', textAlign: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 36,
                      color: 'hsl(var(--border))',
                      display: 'block',
                      marginBottom: 12,
                    }}
                  >
                    receipt_long
                  </span>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      fontWeight: 500,
                      margin: 0,
                    }}
                  >
                    {searchQuery
                      ? 'No entries match your search.'
                      : 'No expenses yet. Add the first one.'}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.description}
                    </p>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        padding: '3px 8px',
                        borderRadius: 3,
                        background: 'hsl(var(--container-low))',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {entry.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        margin: 0,
                      }}
                    >
                      {entry.chapter}
                    </p>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        color: 'hsl(var(--on-surface))',
                        margin: 0,
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      ₵ {Number(entry.amount).toLocaleString()}
                    </p>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: 0,
                      }}
                    >
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(entry)} className="btn btn-outline btn-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          edit
                        </span>
                      </button>
                      <button onClick={() => openDelete(entry)} className="btn btn-dest btn-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          delete
                        </span>
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
