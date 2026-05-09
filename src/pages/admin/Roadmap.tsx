import { useState, useEffect, useCallback } from 'react'
import { 
  Flag, 
  Plus, 
  Search, 
  Clock, 
  Target,
  Calendar,
  X,
  Trash2,
  Edit2
} from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { adminService, type Milestone } from '@/services/adminService'
import { toast } from 'sonner'
import { BrandLine } from '@/components/ui/BrandLine'

export default function RoadmapManagement() {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: new Date().toISOString().split('T')[0],
    status: 'Upcoming' as Milestone['status'],
    category: 'Mobilization',
    importance_level: 'Normal' as Milestone['importance_level'],
    target_members: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getMilestones()
      setMilestones(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenModal = (milestone: Milestone | null = null) => {
    if (milestone) {
      setEditingMilestone(milestone)
      setFormData({
        title: milestone.title,
        description: milestone.description,
        target_date: milestone.target_date ? new Date(milestone.target_date).toISOString().split('T')[0] : '',
        status: milestone.status,
        category: milestone.category,
        importance_level: milestone.importance_level,
        target_members: milestone.target_members || 0
      })
    } else {
      setEditingMilestone(null)
      setFormData({
        title: '',
        description: '',
        target_date: new Date().toISOString().split('T')[0],
        status: 'Upcoming',
        category: 'Mobilization',
        importance_level: 'Normal',
        target_members: 0
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingMilestone) {
        const success = await adminService.updateMilestone(editingMilestone.id, formData)
        if (success) {
          toast.success('Strategic milestone updated.')
          setShowModal(false)
          fetchData()
        } else {
          toast.error('Failed to update milestone.')
        }
      } else {
        const success = await adminService.createMilestone(formData)
        if (success) {
          toast.success('Strategic milestone added.')
          setShowModal(false)
          fetchData()
        } else {
          toast.error('Failed to add milestone.')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove this milestone: "${title}"?`)) return

    try {
      const success = await adminService.deleteMilestone(id, title)
      if (success) {
        toast.success('Milestone removed from roadmap.')
        fetchData()
      } else {
        toast.error('Failed to remove milestone.')
      }
    } catch (err) {
      console.error('[ROADMAP] Delete operation failed:', err)
      toast.error('An error occurred during removal.')
    }
  }

  const filteredMilestones = milestones.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'Completed': return 'var(--brand-green)'
      case 'In Progress': return 'var(--brand-gold)'
      default: return 'var(--brand-red)'
    }
  }

  return (
    <div className="admin-page-container animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex-columns items-center">
        <div className="flow" style={{ '--flow-space': '0.5rem' } as React.CSSProperties}>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <Flag className="w-8 h-8 text-on-surface" />
            National Strategic Roadmap
          </h1>
          <BrandLine />
          <p className="text-muted-foreground/80 text-sm mb-0">Manage movement objectives, mobilization phases, and strategic timelines.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
            onClick={() => handleOpenModal()}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Milestone
          </Button>
        </div>
      </div>

      {/* Roadmap Stats */}
      <div className="flex-columns items-stretch" style={{ '--column-gap': '1.5rem' } as React.CSSProperties}>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-micro font-bold text-muted-foreground/80 tracking-tight">Total Milestones</p>
              <h3 className="text-2xl font-bold text-on-surface">{milestones.length}</h3>
              <div className="flex items-center gap-1 text-micro font-bold text-primary mt-1">
                <Target className="w-3 h-3" /> Movement Trajectory
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6">
            <p className="text-micro font-bold tracking-tight text-muted-foreground/80 mb-2">Completion Rate</p>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-bold text-[var(--brand-green)]">
                {milestones.length ? Math.round((milestones.filter(m => m.status === 'Completed').length / milestones.length) * 100) : 0}%
              </h3>
              <span className="text-micro font-bold text-[var(--brand-green)] bg-[var(--brand-green)]/10 px-1.5 py-0.5 rounded-md mb-1">Achieved</span>
            </div>
            <p className="text-micro text-muted-foreground/80 font-bold tracking-tight mt-2">Verified Objectives</p>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-micro font-bold text-muted-foreground/80 tracking-tight">Active Operations</p>
              <h3 className="text-2xl font-bold text-[var(--brand-gold)]">
                {milestones.filter(m => m.status === 'In Progress').length}
              </h3>
              <p className="text-micro font-bold text-muted-foreground/80 mt-1">In Real-time Mobilization</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-micro font-bold text-muted-foreground/80 tracking-tight">Upcoming Phases</p>
              <h3 className="text-2xl font-bold text-[var(--brand-red)]">
                {milestones.filter(m => m.status === 'Upcoming').length}
              </h3>
              <p className="text-micro font-bold text-muted-foreground/80 mt-1">Strategic Pipeline</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Roadmap Management */}
      <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-destructive" />
            National Objective Timeline
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" />
            <Input 
              placeholder="Search milestones..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Milestone Objective</th>
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Category</th>
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Status</th>
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Target Date</th>
                  <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Priority</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted/30 w-3/4 rounded" />
                          <div className="h-2 bg-muted/20 w-1/2 rounded" />
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted/20 w-16 rounded" /></td>
                      <td className="px-6 py-5"><div className="h-6 bg-muted/20 w-24 rounded" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted/20 w-24 rounded" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted/20 w-16 rounded" /></td>
                      <td className="px-6 py-5 text-right"><div className="h-8 w-16 bg-muted/20 ml-auto rounded" /></td>
                    </tr>
                  ))
                ) : filteredMilestones.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground/80 text-xs font-bold tracking-tight">
                      No strategic objectives found.
                    </td>
                  </tr>
                ) : (
                  filteredMilestones.map((milestone) => (
                  <tr key={milestone.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col max-w-md">
                        <span className="text-xs font-bold text-on-surface tracking-tight">{milestone.title}</span>
                        <span className="text-micro font-bold text-muted-foreground/60 mt-0.5 line-clamp-1">{milestone.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-on-surface/80 tracking-tight">{milestone.category}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div 
                          className={cn("w-1.5 h-1.5 rounded-full", milestone.status === 'In Progress' && "animate-pulse")} 
                          style={{ backgroundColor: getStatusColor(milestone.status) }} 
                        />
                        <span className={cn(
                          "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md capitalize",
                          milestone.status === 'Completed' ? "bg-[var(--brand-green)]/10 text-[var(--brand-green)] border-[var(--brand-green)]/20" :
                          milestone.status === 'In Progress' ? "bg-[var(--brand-gold)]/10 text-[var(--brand-gold)] border-[var(--brand-gold)]/20" :
                          "bg-[var(--brand-red)]/10 text-[var(--brand-red)] border-[var(--brand-red)]/20"
                        )}>
                          {milestone.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-micro font-bold text-muted-foreground/80">
                        <Calendar className="w-3 h-3" />
                        {new Date(milestone.target_date!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "text-micro font-bold normal-case tracking-tight",
                        milestone.importance_level === 'Critical' ? "text-[var(--brand-red)]" : "text-on-surface/40"
                      )}>
                        {milestone.importance_level}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 rounded-sm text-stone-500 hover:text-primary border-stone-200 hover:bg-primary/5 transition-all shadow-sm active:scale-95"
                          onClick={() => handleOpenModal(milestone)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 rounded-sm text-stone-400 hover:text-destructive border-stone-200 hover:bg-destructive/10 transition-all shadow-sm active:scale-95"
                          onClick={() => handleDelete(milestone.id, milestone.title)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl rounded-sm border-border/60 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                {editingMilestone ? <Edit2 className="w-4 h-4 text-destructive" /> : <Plus className="w-4 h-4 text-destructive" />}
                {editingMilestone ? 'Refine Objective' : 'Add Milestone'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground/80 hover:text-destructive"
                onClick={() => setShowModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/80 normal-case">Objective Title</label>
                      <Input 
                        required
                        placeholder="e.g. National Logistics Hub" 
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/80 normal-case">Strategic Category</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full h-10 px-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white"
                      >
                        <option value="Mobilization">Mobilization</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Policy">Policy</option>
                        <option value="Logistics">Logistics</option>
                        <option value="Communication">Communication</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/80 normal-case">Target Date</label>
                      <Input 
                        required
                        type="date"
                        value={formData.target_date}
                        onChange={e => setFormData({...formData, target_date: e.target.value})}
                        className="rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/80 normal-case">Target Member Count</label>
                      <Input 
                        type="number"
                        placeholder="0" 
                        value={formData.target_members}
                        onChange={e => setFormData({...formData, target_members: parseInt(e.target.value) || 0})}
                        className="rounded-sm border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/80 normal-case">Status</label>
                      <select
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as Milestone['status']})}
                        className="w-full h-10 px-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white"
                      >
                        <option value="Upcoming">Upcoming</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/80 normal-case">Importance Level</label>
                      <select
                        value={formData.importance_level}
                        onChange={e => setFormData({...formData, importance_level: e.target.value as Milestone['importance_level']})}
                        className="w-full h-10 px-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-micro font-bold tracking-tight text-muted-foreground/80 normal-case">Objective Description</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Detailed breakdown of the milestone..."
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full p-3 text-xs border border-border/60 rounded-sm focus:ring-on-surface/20 focus:border-on-surface focus:outline-none bg-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-4">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 h-12 text-micro font-bold tracking-tight rounded-sm border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                  onClick={() => setShowModal(false)}
                >
                  Discard
                </Button>
                <Button 
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {isSubmitting ? 'Syncing...' : editingMilestone ? 'Commit Changes' : 'Add Milestone'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
