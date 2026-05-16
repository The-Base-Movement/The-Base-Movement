import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign } from '@/types/admin'
import { toast } from 'sonner'

export default function DeployMission() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [constituencies, setConstituencies] = useState<{ id: string; region_id: string; name: string }[]>([])
  const [filteredConstituencies, setFilteredConstituencies] = useState<{ id: string; region_id: string; name: string }[]>([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedConstituency, setSelectedConstituency] = useState('')
  const [newCampaign, setNewCampaign] = useState<Partial<CanvassingCampaign>>({
    title: '',
    description: '',
    goal_contacts: 100,
    status: 'ACTIVE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  useEffect(() => {
    async function fetchData() {
      const [regionsData, constituenciesData] = await Promise.all([
        adminService.getGhanaRegions(),
        adminService.getGhanaConstituencies(),
      ])
      setRegions(regionsData)
      setConstituencies(constituenciesData)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedRegion) {
      const regionId = regions.find(r => r.name === selectedRegion)?.id
      setFilteredConstituencies(regionId ? constituencies.filter(c => c.region_id === regionId) : [])
    } else {
      setFilteredConstituencies([])
    }
    setSelectedConstituency('')
  }, [selectedRegion, regions, constituencies])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCampaign.title || !selectedRegion || !selectedConstituency) {
      toast.error('Please complete all mandatory fields.')
      return
    }
    setLoading(true)
    try {
      const success = await adminService.createCanvassingCampaign({
        ...newCampaign,
        target_constituency: selectedConstituency,
        target_wards: [selectedRegion],
      })
      if (success) {
        toast.success('Canvassing mission deployed to the field.')
        navigate('/admin/ground-game')
      } else {
        toast.error('Failed to deploy mission.')
      }
    } catch {
      toast.error('Operational error during deployment.')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyle = {
    width: '100%',
    height: 42,
    border: '1px solid hsl(var(--border))',
    borderRadius: 4,
    padding: '0 12px',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    outline: 'none',
    background: '#fff',
    color: 'hsl(var(--on-surface))',
  }
  const labelStyle = {
    display: 'block',
    fontSize: 9.5,
    fontWeight: 800,
    color: 'hsl(var(--on-surface-muted))',
    letterSpacing: '.06em',
    textTransform: 'uppercase' as const,
    fontFamily: "'Public Sans', sans-serif",
    marginBottom: 6,
  }

  return (
    <div className="main animate-in fade-in duration-500">

      {/* Top bar */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>Admin</Link>
            {' · '}
            <Link to="/admin/ground-game" style={{ color: 'hsl(var(--primary))' }}>Ground game</Link>
            {' · '}
            Deploy mission
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--destructive))' }}>sports_kabaddi</span>
            Deploy canvassing mission
          </h2>
          <div className="bl"><div /><div /><div /></div>
        </div>
        <div className="actions">
          <Link to="/admin/ground-game">
            <button className="btn btn-outline btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>Abort
            </button>
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'start' }}>

        {/* Form panel */}
        <form onSubmit={handleSubmit}>
          <div className="panel">
            <div className="ph">
              <div>
                <h3>Tactical deployment parameters</h3>
                <div className="meta">Define the operational scope and objectives</div>
              </div>
              <span className="pill pill-warn">New mission</span>
            </div>

            <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Mission title */}
              <div>
                <label style={labelStyle}>
                  Mission title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <input name="name-81c63d" id="input-81c63d"
                  type="text"
                  placeholder="e.g. Operation Doorstep Blitz — Lapaz Central"
                  style={{ ...fieldStyle, height: 44 }}
                  value={newCampaign.title}
                  onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  required
                />
              </div>

              {/* Region + Constituency */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>
                    Target region <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <select name="selectedRegion" id="select-cc2672"
                    style={{ ...fieldStyle, paddingRight: 32, appearance: 'none' as const }}
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    required
                  >
                    <option value="">Select region</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>
                    Target constituency <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                  </label>
                  <select name="selectedConstituency" id="select-fb8880"
                    style={{ ...fieldStyle, paddingRight: 32, appearance: 'none' as const, opacity: !selectedRegion ? 0.45 : 1 }}
                    value={selectedConstituency}
                    onChange={e => setSelectedConstituency(e.target.value)}
                    disabled={!selectedRegion}
                    required
                  >
                    <option value="">Select constituency</option>
                    {filteredConstituencies.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Start + End dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Start date <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                  <input name="name-f385be" id="input-f385be"
                    type="date"
                    style={fieldStyle}
                    value={newCampaign.start_date}
                    onChange={e => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>End date <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                  <input name="name-2b3dd1" id="input-2b3dd1"
                    type="date"
                    style={fieldStyle}
                    value={newCampaign.end_date}
                    onChange={e => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Contact goal */}
              <div>
                <label style={labelStyle}>Contact goal <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                <input name="name-d312d6" id="input-d312d6"
                  type="number"
                  style={fieldStyle}
                  value={newCampaign.goal_contacts}
                  onChange={e => setNewCampaign({ ...newCampaign, goal_contacts: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Mission objective &amp; field instructions</label>
                <textarea name="name-ab3220" id="textarea-ab3220"
                  rows={4}
                  placeholder="Provide clear tactical objectives for canvassers in the field..."
                  style={{ ...fieldStyle, height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.55 }}
                  value={newCampaign.description}
                  onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'hsl(var(--container-low))', borderRadius: '0 0 6px 6px' }}>
              <Link to="/admin/ground-game">
                <button type="button" className="btn btn-outline btn-sm">Cancel</button>
              </Link>
              <button type="submit" className="btn btn-dest" disabled={loading} style={{ minWidth: 180 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {loading ? 'hourglass_empty' : 'sports_kabaddi'}
                </span>
                {loading ? 'Deploying...' : 'Initiate deployment →'}
              </button>
            </div>
          </div>
        </form>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Tactical guidelines */}
          <div className="panel" style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', color: '#fff', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, background: 'radial-gradient(circle,rgba(218,165,32,.15),transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'relative' }}>
              <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>shield</span>
                Tactical guidelines
              </h3>
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
              {[
                { icon: 'my_location',  title: 'Precise targeting',   body: 'Ensure the target constituency aligns with the movement\'s current strategic priority areas.' },
                { icon: 'flag',         title: 'Clear objectives',    body: 'Field agents perform best with clear, concise mission objectives and measurable contact goals.' },
                { icon: 'storage',      title: 'Data integrity',      body: 'All field interactions must be logged in real-time through the canvasser clipboard protocol.' },
              ].map(({ icon, title, body }) => (
                <div key={title} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>{icon}</span>
                  </div>
                  <div>
                    <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, display: 'block', marginBottom: 3 }}>{title}</b>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.55)', lineHeight: 1.55, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System alert */}
          <div className="panel" style={{ borderLeft: '3px solid hsl(var(--destructive))' }}>
            <div style={{ padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--destructive))', flexShrink: 0, marginTop: 1 }}>warning</span>
              <div>
                <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, display: 'block', marginBottom: 4 }}>Irreversible once deployed</b>
                <p style={{ margin: 0, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.55, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
                  Verify all tactical parameters with regional chapter leadership before initiating. Deployed missions cannot be rolled back.
                </p>
              </div>
            </div>
          </div>

          {/* Quick reference KPIs */}
          <div className="panel">
            <div className="ph">
              <h3>Deployment checklist</h3>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Mission title set',     done: !!newCampaign.title },
                { label: 'Region selected',        done: !!selectedRegion },
                { label: 'Constituency selected',  done: !!selectedConstituency },
                { label: 'Date range defined',     done: !!(newCampaign.start_date && newCampaign.end_date) },
                { label: 'Contact goal entered',   done: (newCampaign.goal_contacts ?? 0) > 0 },
              ].map(({ label, done }, i, arr) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none', fontSize: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? 'rgba(0,107,63,.12)' : 'rgba(206,17,38,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: done ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
                      {done ? 'check' : 'radio_button_unchecked'}
                    </span>
                  </div>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: done ? 800 : 700, color: done ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
