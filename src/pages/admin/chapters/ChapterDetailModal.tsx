import { createPortal } from 'react-dom'
import type { Country, Region } from '@/services/adminService'
import { getCountryFlag } from '@/lib/utils'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  outline: 'none',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 'var(--font-weight-semibold, 600)',
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

interface ChapterDetailModalProps {
  editingChapterId: string | null
  formData: {
    name: string
    city_or_region: string
    country: string
    description: string
    status: string
    leader_name: string
  }
  modalMembers: { id: string; name: string; region: string }[]
  leaderSearch: string
  showLeaderList: boolean
  countries: Country[]
  ghanaRegions: Region[]
  onFormChange: (field: string, value: string) => void
  onLeaderSearchChange: (val: string) => void
  onLeaderSelect: (name: string) => void
  onLeaderBlur: () => void
  onLeaderFocus: () => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function ChapterDetailModal({
  editingChapterId,
  formData,
  modalMembers,
  leaderSearch,
  showLeaderList,
  countries,
  ghanaRegions,
  onFormChange,
  onLeaderSearchChange,
  onLeaderSelect,
  onLeaderBlur,
  onLeaderFocus,
  onClose,
  onSubmit,
}: ChapterDetailModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="panel" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Dark header */}
        <div
          className="member-detail-header"
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            borderTop: '3px solid hsl(var(--primary))',
            borderRadius: '6px 6px 0 0',
            padding: '16px 18px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 14,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
            >
              location_on
            </span>
            {editingChapterId ? 'Configure regional hub' : 'Add new chapter'}
          </h3>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 11.5,
              color: 'rgba(255,255,255,.45)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              lineHeight: 1.5,
            }}
          >
            {editingChapterId
              ? 'Update infrastructure settings and mobilization status for this regional cell.'
              : 'Register a new mobilization hub. Visible publicly once activated.'}
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              className="chapters-modal-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
            >
              <div>
                <label htmlFor="input-9869cd" style={labelStyle}>
                  Chapter name <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <input
                  aria-label="e.g. Adabraka hub"
                  name="name-9869cd"
                  id="input-9869cd"
                  type="text"
                  required
                  placeholder="e.g. Adabraka hub"
                  style={fieldStyle}
                  value={formData.name}
                  onChange={(e) => onFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="select-city-region" style={labelStyle}>
                  City / region <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <select
                  aria-label="Select region"
                  name="city_or_region"
                  id="select-city-region"
                  required
                  style={{ ...fieldStyle, appearance: 'none' }}
                  value={formData.city_or_region}
                  onChange={(e) => onFormChange('city_or_region', e.target.value)}
                >
                  <option value="">Select region...</option>
                  {ghanaRegions.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                  {!ghanaRegions.some((r) => r.name === formData.city_or_region) &&
                    formData.city_or_region && (
                      <option value={formData.city_or_region}>{formData.city_or_region}</option>
                    )}
                </select>
              </div>
            </div>
            <div
              className="chapters-modal-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
            >
              <div>
                <label htmlFor="select-country" style={labelStyle}>
                  Country <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <select
                  aria-label="Select country"
                  name="country"
                  id="select-country"
                  required
                  style={{ ...fieldStyle, appearance: 'none' }}
                  value={formData.country}
                  onChange={(e) => onFormChange('country', e.target.value)}
                >
                  <option value="">Select country...</option>
                  {countries.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.flag_url ? `${getCountryFlag(c.flag_url, true)} ` : ''}
                      {c.name}
                    </option>
                  ))}
                  {!countries.some((c) => c.name === formData.country) && formData.country && (
                    <option value={formData.country}>{formData.country}</option>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="select-9716c5" style={labelStyle}>
                  Hub status
                </label>
                <select
                  name="name-9716c5"
                  id="select-9716c5"
                  style={{ ...fieldStyle, appearance: 'none' as const }}
                  value={formData.status}
                  onChange={(e) => onFormChange('status', e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                </select>
              </div>
            </div>

            {/* Leader picker */}
            <div style={{ position: 'relative' }}>
              <label htmlFor="input-014d9d" style={labelStyle}>
                Chapter leader
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  person_search
                </span>
                <input
                  aria-label="Search verified members…"
                  name="leaderSearch"
                  id="input-014d9d"
                  type="text"
                  placeholder="Search verified members…"
                  value={leaderSearch}
                  onChange={(e) => onLeaderSearchChange(e.target.value)}
                  onFocus={onLeaderFocus}
                  onBlur={onLeaderBlur}
                  style={{ ...fieldStyle, paddingLeft: 34 }}
                />
              </div>
              {showLeaderList && leaderSearch && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: '#fff',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    maxHeight: 200,
                    overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                >
                  {modalMembers
                    .filter(
                      (m) =>
                        m.name.toLowerCase().includes(leaderSearch.toLowerCase()) ||
                        m.region.toLowerCase().includes(leaderSearch.toLowerCase())
                    )
                    .slice(0, 8)
                    .map((m) => (
                      <div
                        key={m.id}
                        onMouseDown={() => onLeaderSelect(m.name)}
                        style={{
                          padding: '9px 12px',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-semibold, 600)',
                          fontFamily: "'Public Sans', sans-serif",
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid hsl(var(--border))',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'hsl(var(--container-low))')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                      >
                        <span style={{ color: 'hsl(var(--on-surface))' }}>{m.name}</span>
                        <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>
                          {m.region}
                        </span>
                      </div>
                    ))}
                  {modalMembers.filter((m) =>
                    m.name.toLowerCase().includes(leaderSearch.toLowerCase())
                  ).length === 0 && (
                    <p
                      style={{
                        padding: '10px 12px',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: 0,
                      }}
                    >
                      No members found
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="textarea-5f2aa3" style={labelStyle}>
                Mission description
              </label>
              <textarea
                aria-label="Describe the chapter"
                name="name-5f2aa3"
                id="textarea-5f2aa3"
                rows={3}
                placeholder="Describe the chapter's focus area..."
                style={{
                  ...fieldStyle,
                  height: 'auto',
                  padding: '10px 12px',
                  resize: 'none',
                  lineHeight: 1.55,
                }}
                value={formData.description}
                onChange={(e) => onFormChange('description', e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              padding: '14px 18px',
              borderTop: '1px solid hsl(var(--border))',
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              background: 'hsl(var(--container-low))',
              borderRadius: '0 0 6px 6px',
            }}
          >
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dest" style={{ minWidth: 160 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                {editingChapterId ? 'sync' : 'add_circle'}
              </span>
              {editingChapterId ? 'Save changes' : 'Add chapter'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
