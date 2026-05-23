import type { Entry } from './types'

interface SpendingLedgerMobileListProps {
  filtered: Entry[]
  loading: boolean
  searchQuery: string
  openEdit: (entry: Entry) => void
  openDelete: (entry: Entry) => void
}

export function SpendingLedgerMobileList({
  filtered,
  loading,
  searchQuery,
  openEdit,
  openDelete,
}: SpendingLedgerMobileListProps) {
  return (
    <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column' }}>
      {loading ? (
        <div
          style={{
            padding: '40px 16px',
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
            fontStyle: 'italic',
          }}
        >
          Loading entries…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '48px 16px', textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 32,
              color: 'hsl(var(--border))',
              display: 'block',
              marginBottom: 10,
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
            {searchQuery ? 'No entries match your search.' : 'No expenses yet. Add the first one.'}
          </p>
        </div>
      ) : (
        filtered.map((entry) => (
          <div
            key={entry.id}
            style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.description}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '0 0 6px',
                  }}
                >
                  {entry.chapter}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      padding: '2px 7px',
                      borderRadius: 3,
                      background: 'hsl(var(--container-low))',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {entry.category}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: 'hsl(var(--on-surface))',
                    margin: '0 0 8px',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  ₵ {Number(entry.amount).toLocaleString()}
                </p>
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
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
