import { useState, useEffect } from 'react'
import { BrandLine } from '@/components/admin/BrandLine'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { adminService } from '@/services/adminService'
import type { DonationCampaign } from '@/types/admin'
import { toast } from 'sonner'

export default function StrategicPriorities() {
  const [campaigns, setCampaigns] = useState<DonationCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [formData, setFormData] = useState<Omit<DonationCampaign, 'id' | 'raisedAmount'>>({
    title: '',
    description: '',
    targetAmount: 0,
    endDate: '',
    status: 'Active',
    imageUrl: ''
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  async function fetchCampaigns() {
    setLoading(true)
    try {
      const data = await adminService.getDonationCampaigns()
      setCampaigns(data)
    } catch (err) {
      console.error('[STRATEGIC PRIORITIES] Synchronization failed:', err)
      toast.error('Failed to synchronize strategic priorities.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const success = await adminService.createDonationCampaign(formData)
      if (success) {
        toast.success('Strategic priority deployed successfully.')
        setIsCreating(false)
        setFormData({
          title: '',
          description: '',
          targetAmount: 0,
          endDate: '',
          status: 'Active',
          imageUrl: ''
        })
        fetchCampaigns()
      } else {
        toast.error('Failed to deploy strategic protocol.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaign) return
    setIsSubmitting(true)
    try {
      const success = await adminService.updateDonationCampaign(editingCampaign.id, formData)
      if (success) {
        toast.success('Strategic priority updated.')
        setEditingCampaign(null)
        fetchCampaigns()
      } else {
        toast.error('Failed to update protocol.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to decommission the "${title}" priority? This action is immutable.`)) return
    
    try {
      const success = await adminService.deleteDonationCampaign(id, title)
      if (success) {
        toast.success('Priority decommissioned.')
        fetchCampaigns()
      } else {
        toast.error('Decommissioning failed.')
      }
    } catch (err) {
      console.error('[STRATEGIC PRIORITIES] Decommissioning failed:', err)
      toast.error('Operational error during decommissioning.')
    }
  }

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'hsl(var(--primary))' }}>sync</span>
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 16 }}>Synchronizing tactical priorities...</p>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      <div className="top">
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>target</span>
            Strategic priorities
          </h2>
          <div style={{ marginTop: 12 }}><BrandLine /></div>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>
            Manage movement-wide mobilization goals, financial targets, and operational milestones.
          </p>
        </div>
        <div className="actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setFormData({
                title: '',
                description: '',
                targetAmount: 0,
                endDate: '',
                status: 'Active',
                imageUrl: ''
              })
              setIsCreating(true)
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add Priority
          </button>
        </div>
      </div>

      <div className="kpis">
        <TacticalKPI 
          label="Active priorities"
          value={campaigns.filter(c => c.status === 'Active').length}
          description="Operational goals"
          variant="black"
        />
        <TacticalKPI 
          label="Total Mobilized"
          value={`$${campaigns.reduce((acc, c) => acc + c.raisedAmount, 0).toLocaleString()}`}
          description="Gross resource intake"
          variant="green"
        />
        <TacticalKPI 
          label="Average progress"
          value={`${campaigns.length > 0 ? (campaigns.reduce((acc, c) => acc + (c.raisedAmount / c.targetAmount), 0) / campaigns.length * 100).toFixed(0) : 0}%`}
          description="Mission completion"
          variant="gold"
        />
        <TacticalKPI 
          label="Upcoming deadlines"
          value={campaigns.filter(c => new Date(c.endDate) > new Date()).length}
          description="Time-sensitive goals"
          variant="red"
        />
      </div>

      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80, width: 280, flexShrink: 0 }}>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ph" style={{ padding: '12px 18px' }}>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'hsl(var(--on-surface-muted))' }}>Tactical filters</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface-muted))' }}>Search priorities</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'hsl(var(--on-surface-muted))', pointerEvents: 'none' }}>search</span>
                  <input 
                    placeholder="Keywords..." 
                    style={{ width: '100%', height: 38, paddingLeft: 34, paddingRight: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', borderRadius: 4, outline: 'none', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, boxSizing: 'border-box', color: 'hsl(var(--on-surface))' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface-muted))' }}>Intelligence Summary</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>Total Active</span>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--primary))' }}>{campaigns.filter(c => c.status === 'Active').length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'hsl(var(--container-low))', borderRadius: 4, border: '1px solid hsl(var(--border))' }}>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>Success Rate</span>
                    <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--accent))' }}>
                      {campaigns.length > 0 ? (campaigns.filter(c => (c.raisedAmount / c.targetAmount) >= 1).length / campaigns.length * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel" style={{ background: 'hsl(var(--on-surface))', color: '#fff' }}>
            <h4 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px' }}>Tactical Awareness</h4>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
              Setting strategic priorities allows the movement to synchronize resource allocation across multiple regional cells.
            </p>
          </div>
        </aside>

        {/* Main Priorities Grid */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {filteredCampaigns.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '100px 0', textAlign: 'center', border: '2px dashed hsl(var(--border))', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.2 }}>target</span>
                <div>
                  <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 20, color: 'hsl(var(--on-surface))', margin: 0 }}>No priorities found</h3>
                  <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>Try refining your search or add a new strategic priority.</p>
                </div>
                <button 
                  className="btn btn-outline"
                  onClick={() => setSearchQuery('')}
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <div key={campaign.id} className="panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 180, position: 'relative', overflow: 'hidden', background: 'hsl(var(--container-low))', borderBottom: '1px solid hsl(var(--border))' }}>
                    {campaign.imageUrl ? (
                      <img src={campaign.imageUrl} alt={campaign.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', opacity: 0.1 }}>image</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                      <span className="pill" style={{ 
                        background: campaign.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))', 
                        color: '#fff', 
                        fontSize: 9, 
                        fontWeight: 900, 
                        textTransform: 'uppercase' 
                      }}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 16, color: 'hsl(var(--on-surface))', margin: 0, lineHeight: 1.3 }}>{campaign.title}</h3>
                      <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{campaign.description}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--on-surface-muted))' }}>Progress</span>
                          <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 14, color: 'hsl(var(--on-surface))' }}>{((campaign.raisedAmount / campaign.targetAmount) * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 6, background: 'hsl(var(--container-low))', borderRadius: 3, overflow: 'hidden' }}>
                          <div 
                            style={{ height: '100%', background: 'hsl(var(--primary))', width: `${Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100)}%`, transition: 'width 1s' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10 }}>
                          <span style={{ color: 'hsl(var(--primary))' }}>${campaign.raisedAmount.toLocaleString()}</span>
                          <span style={{ color: 'hsl(var(--on-surface-muted))' }}>of ${campaign.targetAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
                          <span>Ends: {new Date(campaign.endDate).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="btn btn-outline btn-sm" 
                            style={{ width: 34, padding: 0, justifyContent: 'center' }}
                            onClick={() => {
                              setEditingCampaign(campaign)
                              setFormData({
                                title: campaign.title,
                                description: campaign.description,
                                targetAmount: campaign.targetAmount,
                                endDate: campaign.endDate.split('T')[0],
                                status: campaign.status,
                                imageUrl: campaign.imageUrl || ''
                              })
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          </button>
                          <button 
                            className="btn btn-dest btn-sm" 
                            style={{ width: 34, padding: 0, justifyContent: 'center' }}
                            onClick={() => handleDelete(campaign.id, campaign.title)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* 📝 Create/Edit Modal */}
      {(isCreating || editingCampaign) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div 
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} 
            onClick={() => { setIsCreating(false); setEditingCampaign(null); }}
          />
          <div className="panel" style={{ position: 'relative', width: '100%', maxWidth: 560, padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 18, color: 'hsl(var(--on-surface))' }}>
                  {isCreating ? 'Deploy New Priority' : 'Adjust Strategic Protocol'}
                </h3>
                <p style={{ margin: '4px 0 0', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Defining critical resource allocation for the movement.
                </p>
              </div>
              <button onClick={() => { setIsCreating(false); setEditingCampaign(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'hsl(var(--on-surface-muted))' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
              </button>
            </div>
            
            <form onSubmit={isCreating ? handleCreate : handleUpdate}>
              <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24, maxHeight: '60vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface-muted))' }}>Priority Title</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ashanti Region Media Blitz" 
                    style={{ width: '100%', height: 48, background: 'hsl(var(--container-low))', border: 'none', borderBottom: '2px solid hsl(var(--border))', padding: '0 16px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, outline: 'none', color: 'hsl(var(--on-surface))' }}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface-muted))' }}>Mission Description</label>
                  <textarea 
                    rows={3} 
                    required
                    placeholder="Define the scope and impact of this priority..." 
                    style={{ width: '100%', background: 'hsl(var(--container-low))', border: 'none', borderBottom: '2px solid hsl(var(--border))', padding: 16, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 14, outline: 'none', color: 'hsl(var(--on-surface))', resize: 'none' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface-muted))' }}>Target Capital (₵)</label>
                    <input 
                      type="number" 
                      required
                      style={{ width: '100%', height: 48, background: 'hsl(var(--container-low))', border: 'none', borderBottom: '2px solid hsl(var(--border))', padding: '0 16px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, outline: 'none', color: 'hsl(var(--on-surface))' }}
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface-muted))' }}>Mission Deadline</label>
                    <input 
                      type="date" 
                      required
                      style={{ width: '100%', height: 48, background: 'hsl(var(--container-low))', border: 'none', borderBottom: '2px solid hsl(var(--border))', padding: '0 16px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, outline: 'none', color: 'hsl(var(--on-surface))' }}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface-muted))' }}>Status</label>
                    <select 
                      style={{ width: '100%', height: 48, background: 'hsl(var(--container-low))', border: 'none', borderBottom: '2px solid hsl(var(--border))', padding: '0 16px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, outline: 'none', color: 'hsl(var(--on-surface))' }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Closed' })}
                    >
                      <option value="Active">Active Mobilization</option>
                      <option value="Closed">Mission Completed</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsl(var(--on-surface-muted))' }}>Visual URL (Optional)</label>
                    <input 
                      type="url" 
                      placeholder="https://..." 
                      style={{ width: '100%', height: 48, background: 'hsl(var(--container-low))', border: 'none', borderBottom: '2px solid hsl(var(--border))', padding: '0 16px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 14, outline: 'none', color: 'hsl(var(--on-surface))' }}
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: 32, borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', gap: 12 }}>
                <button 
                  type="button"
                  className="btn btn-outline" 
                  style={{ flex: 1, height: 48 }}
                  onClick={() => { setIsCreating(false); setEditingCampaign(null); }} 
                  disabled={isSubmitting}
                >
                  Abort Mission
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, height: 48 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>sync</span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>history</span>
                  )}
                  {isCreating ? 'Deploy Protocol' : 'Sync Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
