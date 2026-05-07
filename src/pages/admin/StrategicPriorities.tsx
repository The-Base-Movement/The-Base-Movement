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
        <p className="text-[10px] font-bold tracking-tight text-muted-foreground/40">Synchronizing tactical priorities...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🎯 Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Target className="w-8 h-8 text-on-surface" />
            Strategic Priorities
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Managing high-impact mobilization campaigns and resource allocation.</p>
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
            className="rounded-sm text-[10px] font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> New Priority
          </Button>
        </div>
      </div>

      {/* 🔍 Search & Filters */}
      <div className="bg-white border border-border/60 p-2 rounded-sm flex items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input 
            type="text" 
            placeholder="Search priorities by title or mission..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-transparent border-none text-[10px] font-bold normal-case placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <span className="text-[10px] font-bold text-muted-foreground/40 tracking-tight">{filteredCampaigns.length} Active Missions</span>
        </div>
      </div>

      {/* 📋 Priority Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="rounded-sm border-border/60 shadow-sm flex flex-col group overflow-hidden bg-white">
            <div className="aspect-video bg-muted/50 overflow-hidden relative">
              {campaign.imageUrl ? (
                <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/20">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-10" />
                  <span className="text-[10px] font-bold tracking-tight">No Tactical Visual</span>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className={cn(
                  "px-3 py-1 text-[9px] font-bold tracking-tight shadow-xl",
                  campaign.status === 'Active' ? "bg-primary text-white" : "bg-on-surface text-white"
                )}>
                  {campaign.status}
                </span>
              </div>
            </div>
            <CardContent className="p-8 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-on-surface font-meta text-lg tracking-tight leading-tight">{campaign.title}</h3>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setEditingCampaign(campaign)
                      setFormData({
                        title: campaign.title,
                        description: campaign.description,
                        targetAmount: campaign.targetAmount,
                        endDate: campaign.endDate.split('T')[0],
                        status: campaign.status,
                        imageUrl: campaign.imageUrl
                      })
                    }}
                    className="h-8 w-8 text-muted-foreground/40 hover:text-on-surface hover:bg-muted/10 rounded-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(campaign.id, campaign.title)}
                    className="h-8 w-8 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 rounded-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-[11px] font-bold text-muted-foreground/60 mb-8 line-clamp-3 leading-relaxed">
                {campaign.description}
              </p>
              
              <div className="mt-auto space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/40 tracking-tight">
                      <TrendingUp className="w-3.5 h-3.5" /> 
                      Mobilization: {Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)}%
                    </div>
                    <span className="text-xs font-bold font-meta text-on-surface tracking-tighter">GH₵ {campaign.raisedAmount.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/10 overflow-hidden rounded-full border border-border/5">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" 
                      style={{ width: `${Math.min(100, (campaign.raisedAmount / campaign.targetAmount) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/10">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground/40 tracking-tight leading-none mb-1">Target</p>
                      <p className="text-[11px] font-bold text-on-surface tracking-tight leading-none">GH₵ {campaign.targetAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-on-surface/40" />
                    <div>
                      <p className="text-[8px] font-bold text-muted-foreground/40 tracking-tight leading-none mb-1">Deadline</p>
                      <p className="text-[11px] font-bold text-on-surface tracking-tight leading-none">{new Date(campaign.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredCampaigns.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-border/40 p-20 text-center rounded-sm">
            <Target className="w-16 h-16 text-muted-foreground/10 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-muted-foreground/40 normal-case mb-2">No strategic priorities found</h3>
            <p className="text-[10px] font-bold text-muted-foreground/20 tracking-tight">Awaiting tactical directives from HQ.</p>
          </div>
        )}
      </div>

      {/* 📝 Create/Edit Modal */}
      {(isCreating || editingCampaign) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-xl rounded-sm border-border/60 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight font-meta">
                    {isCreating ? 'Deploy New Priority' : 'Adjust Strategic Protocol'}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground/80 text-[10px] font-bold tracking-tight mt-1">
                    Defining critical resource allocation for the movement.
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => { setIsCreating(false); setEditingCampaign(null); }} className="h-8 w-8 p-0 rounded-lg hover:bg-muted/10">
                  <X className="w-5 h-5 text-muted-foreground/40" />
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={isCreating ? handleCreate : handleUpdate}>
              <CardContent className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold tracking-tight text-muted-foreground/40">Priority Title</label>
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
                    <label className="text-[9px] font-bold tracking-tight text-muted-foreground/40">Mission Description</label>
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
                      <label className="text-[9px] font-bold tracking-tight text-muted-foreground/40">Target Capital (GHS)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full h-12 bg-muted/5 border-b border-border/60 text-sm font-bold font-meta px-4 focus:border-on-surface outline-none transition-all"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold tracking-tight text-muted-foreground/40">Mission Deadline</label>
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
                      <label className="text-[9px] font-bold tracking-tight text-muted-foreground/40">Status</label>
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
                      <label className="text-[9px] font-bold tracking-tight text-muted-foreground/40">Visual URL (Optional)</label>
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
                  variant="outline" 
                  onClick={() => { setIsCreating(false); setEditingCampaign(null); }} 
                  className="flex-1 h-12 rounded-sm border-border/40 font-bold text-[10px] tracking-tight hover:bg-stone-50 transition-all active:scale-95"
                  disabled={isSubmitting}
                >
                  Abort Mission
                </Button>
                <Button 
                  type="submit"
                  variant="primary"
                  className="flex-1 h-12 rounded-sm font-bold text-[10px] tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
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
