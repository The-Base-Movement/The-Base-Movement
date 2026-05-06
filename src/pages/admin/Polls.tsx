import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Plus, 
  Search, 
  Clock, 
  MoreVertical,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  X,
  Trash2,
  Calendar
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
import { adminService, type Poll, type PollStats } from '@/services/adminService'
import { toast } from 'sonner'

// Mock Data for Polls
export default function PollsManagement() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [stats, setStats] = useState<PollStats | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPoll, setNewPoll] = useState({
    question: '',
    region: 'National',
    status: 'Active',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    options: ['', '']
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [pollData, statData] = await Promise.all([
        adminService.getPolls(),
        adminService.getPollStats()
      ])
      setPolls(pollData)
      setStats(statData)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePollAction = (action: string, pollTitle: string) => {
    adminService.logAction(action, `POLLS/${pollTitle}`, 'Success')
    toast.success(`${action.replace('_', ' ')}: ${pollTitle} updated in Audit Vault`)
  }

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPoll.options.filter(o => o.trim()).length < 2) {
      toast.error('Please provide at least 2 options.')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await adminService.createPoll({
        ...newPoll,
        options: newPoll.options.filter(o => o.trim())
      })
      if (success) {
        toast.success('Poll created successfully!')
        setShowCreateModal(false)
        setNewPoll({
          question: '',
          region: 'National',
          status: 'Active',
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          options: ['', '']
        })
        fetchData()
      } else {
        toast.error('Failed to create poll.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePoll = async (id: string, question: string) => {
    if (!window.confirm(`Are you sure you want to delete the poll: "${question}"?`)) return

    try {
      const success = await adminService.deletePoll(id)
      if (success) {
        toast.success('Poll deleted successfully.')
        fetchData()
      } else {
        toast.error('Failed to delete poll.')
      }
    } catch (err) {
      console.error('[POLLS] Delete operation failed:', err)
      toast.error('An error occurred while deleting the poll.')
    }
  }

  const filteredPolls = polls.filter(p => p.question.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-on-surface" />
            Engagement hub
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Manage opinion polls, surveys, and movement feedback.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary"
            size="lg"
            className="rounded-sm text-[10px] uppercase tracking-[0.2em] px-10 h-12 shadow-lg shadow-brand-green/20"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Establish Campaign
          </Button>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Total engagements</p>
              <h3 className="text-2xl font-bold text-on-surface">{stats?.totalEngagements || "..."}</h3>
              <div className="flex items-center gap-1 text-[9px] font-bold text-primary mt-1">
                <TrendingUp className="w-3 h-3" /> +15.2%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold tracking-tight text-muted-foreground/80 mb-2">National sentiment</p>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-bold text-primary">{stats?.nationalSentimentScore || "..."}%</h3>
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md mb-1">Positive</span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 font-bold tracking-tight mt-2">Live engagement analysis</p>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Avg response time</p>
              <h3 className="text-2xl font-bold text-on-surface">{stats?.avgResponseTime || "..."}</h3>
              <p className="text-[10px] font-bold text-muted-foreground/80 mt-1">Per survey session</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Feedback rate</p>
              <h3 className="text-2xl font-bold text-on-surface">{stats?.feedbackRate || "..."}</h3>
              <p className="text-[10px] font-bold text-muted-foreground/80 mt-1">From active members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Polls Management */}
      <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-border/40 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-destructive" />
            Campaign Management
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" />
            <Input 
              placeholder="Search polls..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Campaign title</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight text-center">Responses</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Region</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">End date</th>
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
                      <td className="px-6 py-5"><div className="h-4 bg-muted/20 w-full rounded" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted/20 w-full rounded" /></td>
                      <td className="px-6 py-5"><div className="h-6 bg-muted/20 w-16 rounded" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-muted/20 w-full rounded" /></td>
                      <td className="px-6 py-5 text-right"><div className="h-8 w-8 bg-muted/20 ml-auto rounded" /></td>
                    </tr>
                  ))
                ) : filteredPolls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground/80 text-xs font-bold tracking-tight">
                      No matching polls found in the campaign hub.
                    </td>
                  </tr>
                ) : (
                  filteredPolls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface tracking-tight">{poll.question}</span>
                        <span className="text-[9px] font-bold text-muted-foreground/80 mt-0.5">{poll.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-on-surface">{poll.totalVotes.toLocaleString()}</span>
                        <div className="w-20 h-1 bg-muted/30 mt-2 overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000" 
                            style={{ 
                              width: poll.totalVotes > 10000 ? '90%' : poll.totalVotes > 5000 ? '60%' : '30%', 
                              backgroundColor: poll.status === 'Active' ? 'var(--primary)' : 'var(--accent)' 
                            }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-on-surface/80 tracking-tight">{poll.region}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: poll.status === 'Active' ? 'var(--primary)' : 'var(--accent)' }} />
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-bold tracking-tight border rounded-md",
                          poll.status === 'Active' 
                            ? "bg-primary/10 text-primary border-primary/20" 
                            : poll.status === 'Draft'
                            ? "bg-accent/10 text-accent border-accent/20"
                            : "bg-muted/30 text-on-surface border-border/60"
                        )}>
                          {poll.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80">
                        <Clock className="w-3 h-3" />
                        {poll.endDate}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-sm text-stone-400 hover:text-destructive border-stone-200 hover:bg-destructive/10 transition-all shadow-sm"
                          onClick={() => handleDeletePoll(poll.id, poll.question)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-sm text-stone-500 hover:text-accent border-stone-200 hover:bg-stone-50 transition-all shadow-sm"
                          onClick={() => handlePollAction('POLL_MANAGE', poll.question)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-border/40">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 animate-pulse space-y-4">
                  <div className="h-4 bg-muted/30 w-3/4 rounded" />
                  <div className="h-3 bg-muted/20 w-1/2 rounded" />
                  <div className="h-8 bg-muted/30 w-full rounded-lg" />
                </div>
              ))
            ) : filteredPolls.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground/80 text-xs font-bold">
                No matching polls found.
              </div>
            ) : (
              filteredPolls.map((poll) => (
                <div key={poll.id} className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-on-surface leading-tight">{poll.question}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">{poll.id}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border rounded-full",
                      poll.status === 'Active' ? "bg-primary/10 text-primary border-primary/20" : "bg-accent/10 text-accent border-accent/20"
                    )}>
                      {poll.status}
                    </div>
                  </div>

                  <div className="p-4 bg-muted/10 rounded-sm border border-border/40 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Responses</span>
                      <span className="text-sm font-bold text-on-surface">{poll.totalVotes.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000" 
                        style={{ 
                          width: poll.totalVotes > 10000 ? '90%' : poll.totalVotes > 5000 ? '60%' : '30%', 
                          backgroundColor: poll.status === 'Active' ? 'var(--primary)' : 'var(--accent)' 
                        }} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Region</p>
                      <p className="text-xs font-bold text-on-surface">{poll.region}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Expires</p>
                      <p className="text-xs font-bold text-on-surface/80">{poll.endDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-11 rounded-sm border-border/40 text-on-surface/80 text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm"
                      onClick={() => handlePollAction('POLL_MANAGE', poll.question)}
                    >
                      Manage Campaign
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-11 w-11 rounded-sm border border-border/40 text-stone-400 hover:text-destructive hover:bg-destructive/10 transition-all shadow-sm"
                      onClick={() => handleDeletePoll(poll.id, poll.question)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-on-surface text-white relative overflow-hidden rounded-sm shadow-xl border border-white/5">
          <div className="relative z-10 space-y-4">
            <h4 className="text-lg font-bold tracking-tight">Maximize engagement</h4>
            <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-sm">
              Use regional-specific polls to gather more precise data. Our research shows chapters with localized campaigns see 40% higher member participation.
            </p>
            <Button 
              variant="outline"
              size="sm"
              className="h-10 px-8 text-[10px] font-black uppercase tracking-widest border-white/20 bg-transparent text-white hover:bg-white hover:text-on-surface rounded-sm transition-all shadow-lg"
              onClick={() => setIsAnalyticsModalOpen(true)}
            >
              Scan Analytics Guide
            </Button>
          </div>
          <BarChart3 className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12" />
        </div>

        <div className="p-8 border border-border/60 bg-white space-y-4 rounded-sm shadow-sm">
          <h4 className="text-lg font-bold tracking-tight text-on-surface">Recent feedback highlights</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-muted/10 border border-border/40 flex items-center justify-center shrink-0 rounded-lg">
                <MessageSquare className="w-5 h-5 text-muted-foreground/80" />
              </div>
              <div>
                <p className="text-sm text-on-surface/80 italic leading-relaxed">"The new regional chapter meetings have significantly improved communication between constituency leads..."</p>
                <p className="text-[10px] font-bold text-muted-foreground/80 mt-2">- Member feedback from Ashanti Region</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="h-9 px-0 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-transparent hover:text-accent/80 transition-colors group/btn"
              onClick={() => setIsFeedbackModalOpen(true)}
            >
              Scan Feedback Vault <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg rounded-sm border-border/60 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <Plus className="w-4 h-4 text-destructive" />
                New poll campaign
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground/80 hover:text-destructive"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCreatePoll}>
              <CardContent className="p-6 space-y-6">
                {/* Question */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-tight text-muted-foreground/80">Campaign question / topic</label>
                  <Input 
                    required
                    placeholder="e.g. Should we increase regional chapter funding?" 
                    value={newPoll.question}
                    onChange={e => setNewPoll({...newPoll, question: e.target.value})}
                    className="rounded-lg border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold tracking-tight text-muted-foreground/80 flex justify-between">
                    Poll Options
                    <span className="text-muted-foreground/40">Min 2 Required</span>
                  </label>
                  {newPoll.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input 
                        placeholder={`Option ${idx + 1}`} 
                        value={opt}
                        onChange={e => {
                          const updated = [...newPoll.options]
                          updated[idx] = e.target.value
                          setNewPoll({...newPoll, options: updated})
                        }}
                        className="rounded-lg border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                      />
                      {newPoll.options.length > 2 && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0 text-muted-foreground/40 hover:text-red-500"
                          onClick={() => {
                            const updated = newPoll.options.filter((_, i) => i !== idx)
                            setNewPoll({...newPoll, options: updated})
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-10 text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-on-surface hover:bg-stone-50 border-stone-200 rounded-sm px-6 transition-all shadow-sm"
                    onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})}
                  >
                    <Plus className="w-3 h-3 mr-2" /> Add Option
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Region */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-tight text-muted-foreground/80">Target region</label>
                    <select
                      value={newPoll.region}
                      onChange={e => setNewPoll({...newPoll, region: e.target.value})}
                      className="w-full h-10 px-3 text-xs border border-border/60 rounded-lg focus:ring-on-surface/20 focus:border-on-surface focus:outline-none"
                    >
                      <option>National</option>
                      <option>Greater Accra</option>
                      <option>Ashanti</option>
                      <option>Western</option>
                      <option>Eastern</option>
                      <option>Central</option>
                    </select>
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-tight text-muted-foreground/80">Expiration date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80 pointer-events-none" />
                      <Input 
                        type="date"
                        value={newPoll.endDate}
                        onChange={e => setNewPoll({...newPoll, endDate: e.target.value})}
                        className="pl-9 h-10 text-xs rounded-lg border-border/60 focus:ring-on-surface/20 focus:border-on-surface"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-4">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 h-12 text-[10px] uppercase font-black tracking-widest rounded-sm border-border/40 hover:bg-stone-50 transition-all shadow-sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Discard
                </Button>
                <Button 
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-[10px] uppercase font-black tracking-widest rounded-sm shadow-lg shadow-brand-green/20"
                >
                  {isSubmitting ? 'Launching...' : 'Deploy Campaign'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Feedback Vault Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl rounded-sm border-border/60 bg-white shadow-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-destructive" />
                Movement Feedback Vault
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground/80 hover:text-destructive"
                onClick={() => setIsFeedbackModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {[
                { author: 'Ashanti Patriot', region: 'Ashanti', text: 'The new regional chapter meetings have significantly improved communication between constituency leads.' },
                { author: 'Greater Accra Lead', region: 'Greater Accra', text: 'Requesting more mobilization materials for the upcoming town hall sessions.' },
                { author: 'Western Member', region: 'Western', text: 'The digital strategy polls are a great way to stay engaged with the leadership.' }
              ].map((fb, idx) => (
                <div key={idx} className="p-4 bg-muted/10 border border-border/40 rounded-sm space-y-2">
                  <p className="text-sm text-on-surface/80 italic leading-relaxed">"{fb.text}"</p>
                  <p className="text-[10px] font-bold text-muted-foreground/80">- {fb.author} from {fb.region} Region</p>
                </div>
              ))}
            </CardContent>
            <div className="p-6 pt-0 border-t border-border/40 bg-muted/5 flex justify-end mt-4">
              <Button 
                variant="primary"
                className="h-12 text-[10px] font-black uppercase tracking-widest rounded-sm w-full shadow-lg shadow-brand-green/20"
                onClick={() => setIsFeedbackModalOpen(false)}
              >
                Close Vault
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Guide Modal */}
      {isAnalyticsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg rounded-sm border-border/60 bg-white shadow-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-destructive" />
                Engagement Analytics Guide
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground/80 hover:text-destructive"
                onClick={() => setIsAnalyticsModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4 text-sm text-on-surface/80 leading-relaxed">
                <p>Learn how to interpret movement engagement data to drive more effective mobilization campaigns.</p>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li>Analyze regional participation rates to identify high-growth areas.</li>
                  <li>Monitor sentiment scores to proactively address movement concerns.</li>
                  <li>Use average response times to optimize survey length and timing.</li>
                </ul>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Button 
                variant="primary"
                className="h-12 text-[10px] font-black uppercase tracking-widest rounded-sm w-full shadow-lg shadow-brand-green/20"
                onClick={() => setIsAnalyticsModalOpen(false)}
              >
                Got It
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
