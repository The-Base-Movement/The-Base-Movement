import { Link } from 'react-router-dom'
import type { CanvassingCampaign } from '@/types/admin'

const fieldStyle = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  outline: 'none',
  background: 'hsl(var(--surface))',
  color: 'hsl(var(--on-surface))',
}

const labelStyle = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase' as const,
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

interface DeployMissionFormProps {
  handleSubmit: (e: React.FormEvent) => void
  newCampaign: Partial<CanvassingCampaign>
  setNewCampaign: React.Dispatch<React.SetStateAction<Partial<CanvassingCampaign>>>
  regions: { id: string; name: string }[]
  selectedRegion: string
  setSelectedRegion: (val: string) => void
  selectedConstituency: string
  setSelectedConstituency: (val: string) => void
  filteredConstituencies: { id: string; name: string }[]
  loading: boolean
}

export function DeployMissionForm({
  handleSubmit,
  newCampaign,
  setNewCampaign,
  regions,
  selectedRegion,
  setSelectedRegion,
  selectedConstituency,
  setSelectedConstituency,
  filteredConstituencies,
  loading,
}: DeployMissionFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="panel">
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid hsl(var(--border))',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
                letterSpacing: '-0.01em',
              }}
            >
              Tactical deployment parameters
            </h3>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Define the operational scope and objectives
            </p>
            <span className="pill pill-warn">New mission</span>
          </div>
          <img
            src="/brand/icons/flag-bearer.png"
            alt=""
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              height: '100%',
              opacity: 0.12,
              pointerEvents: 'none',
              zIndex: 0,
              objectFit: 'contain',
            }}
          />
        </div>

        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Mission title */}
          <div>
            <label htmlFor="input-81c63d" style={labelStyle}>
              Mission title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input
              aria-label="e.g. Operation Doorstep Blitz — Lapaz Central"
              name="name-81c63d"
              id="input-81c63d"
              type="text"
              placeholder="e.g. Operation Doorstep Blitz — Lapaz Central"
              style={{ ...fieldStyle, height: 44 }}
              value={newCampaign.title || ''}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          {/* Region + Constituency */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ flex: '1 1 180px' }}>
              <label htmlFor="select-cc2672" style={labelStyle}>
                Target region <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <select
                name="selectedRegion"
                id="select-cc2672"
                style={{ ...fieldStyle, paddingRight: 32, appearance: 'none' as const }}
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                required
              >
                <option value="">Select region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label htmlFor="select-fb8880" style={labelStyle}>
                Target constituency <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <select
                name="selectedConstituency"
                id="select-fb8880"
                style={{
                  ...fieldStyle,
                  paddingRight: 32,
                  appearance: 'none' as const,
                  opacity: !selectedRegion ? 0.45 : 1,
                }}
                value={selectedConstituency}
                onChange={(e) => setSelectedConstituency(e.target.value)}
                disabled={!selectedRegion}
                required
              >
                <option value="">Select constituency</option>
                {filteredConstituencies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start + End dates */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ flex: '1 1 160px' }}>
              <label htmlFor="input-f385be" style={labelStyle}>
                Start date <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <input
                name="name-f385be"
                id="input-f385be"
                type="date"
                style={fieldStyle}
                value={newCampaign.start_date || ''}
                onChange={(e) =>
                  setNewCampaign((prev) => ({ ...prev, start_date: e.target.value }))
                }
                required
              />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label htmlFor="input-2b3dd1" style={labelStyle}>
                End date <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <input
                name="name-2b3dd1"
                id="input-2b3dd1"
                type="date"
                style={fieldStyle}
                value={newCampaign.end_date || ''}
                onChange={(e) => setNewCampaign((prev) => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Contact goal */}
          <div>
            <label htmlFor="input-d312d6" style={labelStyle}>
              Contact goal <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input
              name="name-d312d6"
              id="input-d312d6"
              type="number"
              style={fieldStyle}
              value={newCampaign.goal_contacts || 100}
              onChange={(e) =>
                setNewCampaign((prev) => ({ ...prev, goal_contacts: Number(e.target.value) }))
              }
              min="1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="textarea-ab3220" style={labelStyle}>
              Mission objective &amp; field instructions
            </label>
            <textarea
              aria-label="Provide clear tactical objectives for field agents"
              name="name-ab3220"
              id="textarea-ab3220"
              rows={4}
              placeholder="Provide clear tactical objectives for field agents..."
              style={{
                ...fieldStyle,
                height: 'auto',
                padding: '10px 12px',
                resize: 'none',
                lineHeight: 1.55,
              }}
              value={newCampaign.description || ''}
              onChange={(e) => setNewCampaign((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            background: 'hsl(var(--container-low))',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          }}
        >
          <Link to="/admin/ground-game">
            <button type="button" className="btn btn-outline btn-sm">
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            className="btn btn-dest"
            disabled={loading}
            style={{ minWidth: 180 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {loading ? 'hourglass_empty' : 'sports_kabaddi'}
            </span>
            {loading ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </div>
    </form>
  )
}
export default DeployMissionForm
