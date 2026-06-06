import { useState, useMemo } from 'react'
import type { Asset } from './types'

interface Props {
  assets: Asset[]
  departmentId: string
  requestedBy: string
  onClose: () => void
  onSubmit: (payload: {
    asset_id: string
    department_id: string
    reason: string
    expected_return_date: string | null
    requested_by: string
  }) => Promise<boolean>
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  background: 'hsl(var(--background))',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  marginBottom: 6,
}

export function RequestAssetModal({ assets, departmentId, requestedBy, onClose, onSubmit }: Props) {
  const [search, setSearch] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [reason, setReason] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [saving, setSaving] = useState(false)

  const availableAssets = useMemo(() => assets.filter((a) => !a.assigned_to_id), [assets])

  const filtered = useMemo(
    () =>
      availableAssets
        .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 20),
    [availableAssets, search]
  )

  const selectedName = assets.find((a) => a.id === selectedAssetId)?.name ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAssetId || !reason.trim()) return
    setSaving(true)
    const ok = await onSubmit({
      asset_id: selectedAssetId,
      department_id: departmentId,
      reason: reason.trim(),
      expected_return_date: returnDate || null,
      requested_by: requestedBy,
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          padding: 28,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 16,
            color: 'hsl(var(--on-surface))',
          }}
        >
          Request Asset
        </p>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          Your request will be reviewed by the IT Manager.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <label htmlFor="asset-request-search" style={labelStyle}>
              Asset
            </label>
            <input
              id="asset-request-search"
              name="assetRequestSearch"
              value={selectedAssetId ? selectedName : search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedAssetId('')
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search available assets…"
              style={inputStyle}
              autoComplete="off"
            />
            {showDropdown && filtered.length > 0 && !selectedAssetId && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                  onClick={() => setShowDropdown(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    maxHeight: 200,
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {filtered.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        padding: '9px 14px',
                        textAlign: 'left',
                        fontSize: 13,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Public Sans', sans-serif",
                        color: 'hsl(var(--on-surface))',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'hsl(var(--container-low))')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      onClick={() => {
                        setSelectedAssetId(a.id)
                        setSearch('')
                        setShowDropdown(false)
                      }}
                    >
                      <span>{a.name}</span>
                      <span style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                        {a.category_name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <label htmlFor="asset-request-reason" style={labelStyle}>
              Reason
            </label>
            <textarea
              id="asset-request-reason"
              name="assetRequestReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need this asset?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div>
            <label htmlFor="asset-request-return-date" style={labelStyle}>
              Expected Return Date{' '}
              <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              id="asset-request-return-date"
              name="assetRequestReturnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving || !selectedAssetId || !reason.trim()}
            >
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
