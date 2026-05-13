import { useState, useEffect } from 'react'
import { 
  Target, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Image as ImageIcon,
  Clock,
  TrendingUp,
  X,
  Loader2
} from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { adminService } from '@/services/adminService'
import type { DonationCampaign } from '@/types/admin'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
      <div className="h-full w-full flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-micro font-bold tracking-tight text-muted-foreground/40">Synchronizing tactical priorities...</p>
      </div>
    )
  }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Target className="w-8 h-8 text-on-surface" />
            Strategic priorities
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Manage movement-wide mobilization goals, financial targets, and operational milestones.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            size="lg"
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
            className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Priority
          </Button>
        </div>
      </div>

      {/* Mobilization Stats - Balanced Grid */}
      <div className="grid-stats mb-10" style={{ '--grid-min-width': '240px' } as React.CSSProperties}>
        {[
          { label: 'Active priorities', value: campaigns.filter(c => c.status === 'Active').length, icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Total Mobilized', value: `$${campaigns.reduce((acc, c) => acc + c.raisedAmount, 0).toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Average progress', value: `${campaigns.length > 0 ? (campaigns.reduce((acc, c) => acc + (c.raisedAmount / c.targetAmount), 0) / campaigns.length * 100).toFixed(0) : 0}%`, icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Upcoming deadlines', value: campaigns.filter(c => new Date(c.endDate) > new Date()).length, icon: Clock, color: 'text-on-surface/60', bg: 'bg-muted/10' },
        ].map((stat, i) => (
          <Card key={i} className="rounded-sm border-border/40 shadow-sm bg-white overflow-hidden group hover:border-border/60 transition-all backdrop-blur-sm">
            <CardContent className="p-6 h-full flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="flex-1 flow" style={{ '--flow-space': '0.1rem' } as React.CSSProperties}>
                <p className="text-micro font-bold text-muted-foreground/80 m-0 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-bold text-on-surface leading-tight m-0">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start relative">
        {/* Sticky Filter Sidebar */}
        <aside className="w-full lg:w-80 sticky lg:top-32 space-y-6 shrink-0 z-30">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-white">
            <div className="p-4 border-b border-border/10 bg-muted/5">
              <h3 className="font-bold text-on-surface text-xs normal-case">Tactical filters</h3>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-micro font-bold text-stone-500 uppercase tracking-widest">Search priorities</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <input 
                    placeholder="Keywords..." 
                    className="w-full pl-11 pr-4 h-11 bg-white border border-border/60 focus:ring-1 focus:ring-primary focus:border-transparent rounded-sm text-tiny font-bold outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-border/10 space-y-4">
                <div className="flex items-center justify-between text-micro font-bold text-muted-foreground/60 uppercase tracking-widest">
                  <span>Intelligence Summary</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted/5 rounded-sm border border-border/10">
                    <span className="text-micro font-bold text-on-surface/60">Total Active</span>
                    <span className="text-xs font-bold text-primary">{campaigns.filter(c => c.status === 'Active').length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/5 rounded-sm border border-border/10">
                    <span className="text-micro font-bold text-on-surface/60">Success Rate</span>
                    <span className="text-xs font-bold text-accent">
                      {campaigns.length > 0 ? (campaigns.filter(c => (c.raisedAmount / c.targetAmount) >= 1).length / campaigns.length * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden bg-on-surface text-white p-6 group">
            <h4 className="text-micro font-bold tracking-tight text-white/40 uppercase mb-4">Tactical Awareness</h4>
            <p className="text-tiny font-medium text-white/60 leading-relaxed">
              Setting strategic priorities allows the movement to synchronize resource allocation across multiple regional cells.
            </p>
            <Button variant="ghost" className="w-full justify-between h-9 mt-4 px-0 text-micro font-bold tracking-tight text-white hover:bg-transparent group-hover:text-primary transition-colors">
              Operational Handbook <TrendingUp className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Card>
        </aside>

        {/* Main Priorities Grid */}
        <div className="flex-1 min-h-[500px]">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredCampaigns.length === 0 ? (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-border/20 rounded-sm bg-white">
                <Target className="w-12 h-12 text-muted mx-auto mb-4 opacity-10" />
                <h3 className="text-lg font-bold text-on-surface">No priorities found</h3>
                <p className="text-sm text-muted-foreground/40 mt-1 max-w-xs mx-auto">Try refining your search or add a new strategic priority.</p>
                <Button 
                  variant="default" 
                  onClick={() => setSearchQuery('')}
                  className="mt-6 rounded-sm border-border/40 font-bold text-micro tracking-tight px-10 h-12 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                >
                  Reset Filter
                </Button>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="rounded-sm border-border/60 shadow-sm overflow-hidden group hover:border-on-surface/40 transition-all bg-white flex flex-col">
                  <div className="relative h-48 bg-stone-100 overflow-hidden shrink-0 border-b border-border/10">
                    {campaign.imageUrl ? (
                      <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" decoding="async" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className={cn(
                        "px-3 py-1 text-micro font-bold tracking-tight rounded-full border shadow-sm backdrop-blur-md",
                        campaign.status === 'Active' ? "bg-primary text-white border-primary/20" : "bg-white text-on-surface border-border/60"
                      )}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-on-surface leading-tight tracking-tight m-0">{campaign.title}</h3>
                      <p className="text-xs text-muted-foreground/80 leading-relaxed m-0 line-clamp-3 font-medium">{campaign.description}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-micro font-bold text-muted-foreground/40 normal-case">Progress</span>
                          <span className="text-sm font-bold text-on-surface">{((campaign.raisedAmount / campaign.targetAmount) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000 ease-out" 
                            style={{ width: `${Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-micro font-bold tracking-tight">
                          <span className="text-primary">${campaign.raisedAmount.toLocaleString()}</span>
                          <span className="text-muted-foreground/40 normal-case">of ${campaign.targetAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/10">
                        <div className="flex items-center gap-2 text-micro font-bold text-muted-foreground/60 uppercase">
                          <Calendar className="w-3 h-3" />
                          <span>Ends: {new Date(campaign.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground/40 hover:text-on-surface hover:bg-stone-50 rounded-sm transition-all"
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
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 rounded-sm transition-all"
                            onClick={() => handleDelete(campaign.id, campaign.title)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 📝 Create/Edit Modal */}
      {(isCreating || editingCampaign) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-xl rounded-sm border-border/60 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight font-meta">
                    {isCreating ? 'Deploy New Priority' : 'Adjust Strategic Protocol'}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/80 text-micro font-bold tracking-tight mt-1">
                    Defining critical resource allocation for the movement.
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => { setIsCreating(false); setEditingCampaign(null); }} className="h-8 w-8 p-0 rounded-sm hover:bg-muted/10">
                  <X className="w-5 h-5 text-muted-foreground/40" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={isCreating ? handleCreate : handleUpdate}>
              <CardContent className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-micro font-bold tracking-tight text-muted-foreground/40">Priority Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Ashanti Region Media Blitz" 
                      className="w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold px-4 focus:border-on-surface outline-none transition-all"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-micro font-bold tracking-tight text-muted-foreground/40">Mission Description</label>
                    <textarea 
                      rows={3} 
                      required
                      placeholder="Define the scope and impact of this priority..." 
                      className="w-full bg-muted/5 border-b border-border/60 text-sm font-bold p-4 focus:border-on-surface outline-none resize-none transition-all"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/40">Target Capital (₵)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold font-meta px-4 focus:border-on-surface outline-none transition-all"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/40">Mission Deadline</label>
                      <input 
                        type="date" 
                        required
                        className="w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold px-4 focus:border-on-surface outline-none transition-all"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/40">Status</label>
                      <select 
                        className="w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold px-4 focus:border-on-surface outline-none appearance-none transition-all"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Closed' })}
                      >
                        <option value="Active">Active Mobilization</option>
                        <option value="Closed">Mission Completed</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/40">Visual URL (Optional)</label>
                      <input 
                        type="url" 
                        placeholder="https://..." 
                        className="w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold px-4 focus:border-on-surface outline-none transition-all"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-8 border-t border-border/10 bg-muted/5 flex gap-4">
                <Button 
                  type="button"
                  variant="default" 
                  onClick={() => { setIsCreating(false); setEditingCampaign(null); }} 
                  className="flex-1 h-12 rounded-sm border-border/40 font-bold text-micro tracking-tight hover:bg-stone-50 transition-all active:scale-95"
                  disabled={isSubmitting}
                >
                  Abort Mission
                </Button>
                <Button 
                  type="submit"
                  variant="primary"
                  className="flex-1 h-12 rounded-sm font-bold text-micro tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                  {isCreating ? 'Deploy Protocol' : 'Sync Adjustments'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
