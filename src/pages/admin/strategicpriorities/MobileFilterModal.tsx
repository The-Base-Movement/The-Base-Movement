import { createPortal } from 'react-dom'
import type { DonationCampaign } from '@/types/admin'
import { SortToggle } from '@/components/ui/SortToggle'

interface MobileFilterModalProps {
  isOpen: boolean
  onClose: () => void
  campaigns: DonationCampaign[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (val: 'asc' | 'desc') => void
}

export function MobileFilterModal({
  isOpen,
  onClose,
  campaigns,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
}: MobileFilterModalProps) {
  if (!isOpen) return null

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 60,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 70,
          background: '#fff',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }}
      >
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Tactical filters
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              close
            </span>
          </button>
        </div>
        <div
          style={{
            padding: '18px 18px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          {/* Priority dropdown & Sort */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <label
                htmlFor="select-mob-filter"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 9,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Filter by priority
              </label>
              <select
                id="select-mob-filter"
                name="mobileFilterSelect"
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 12px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 4,
                  outline: 'none',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 13,
                  boxSizing: 'border-box',
                  color: 'hsl(var(--on-surface))',
                  appearance: 'none',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              >
                <option value="">All priorities</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                flexShrink: 0,
                justifyContent: 'flex-end',
                height: '100%',
                alignSelf: 'flex-end',
              }}
            >
              <SortToggle value={sortOrder} onChange={setSortOrder} />
            </div>
          </div>

          {/* Intelligence summary — 2-column tiles */}
          <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 18 }}>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 9,
                color: 'hsl(var(--on-surface-muted))',
                display: 'block',
                marginBottom: 12,
              }}
            >
              Intelligence summary
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div
                style={{
                  padding: '14px 16px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 6,
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Total active
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 26,
                    color: 'hsl(var(--primary))',
                    lineHeight: 1,
                  }}
                >
                  {campaigns.filter((c) => c.status === 'Active').length}
                </span>
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  background: 'hsl(var(--container-low))',
                  borderRadius: 6,
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Success rate
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 26,
                    color: 'hsl(var(--accent))',
                    lineHeight: 1,
                  }}
                >
                  {campaigns.length > 0
                    ? (
                        (campaigns.filter((c) => c.raisedAmount / c.targetAmount >= 1).length /
                          campaigns.length) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', height: 44 }}
            onClick={onClose}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              check
            </span>
            Apply filters
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
