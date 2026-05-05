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
import { Button } from '@/components/ui/Button'
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
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-stone-900" />
            Engagement hub
          </h1>
          <p className="text-stone-500 text-sm mt-1">Manage opinion polls, surveys, and movement feedback.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-2" /> Create poll
          </Button>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-stone-400 tracking-tight">Total engagements</p>
              <h3 className="text-2xl font-bold text-stone-900">{stats?.totalEngagements || "..."}</h3>
              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 mt-1">
                <TrendingUp className="w-3 h-3" /> +15.2%
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6">
            <p className="text-[10px] font-bold tracking-tight text-stone-400 mb-2">National sentiment</p>
            <div className="flex items-end gap-3">
              <h3 className="text-2xl font-bold text-emerald-600">{stats?.nationalSentimentScore || "..."}%</h3>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mb-1">Positive</span>
            </div>
            <p className="text-[10px] text-stone-400 font-bold tracking-tight mt-2">Live engagement analysis</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-stone-400 tracking-tight">Avg response time</p>
              <h3 className="text-2xl font-bold text-stone-900">{stats?.avgResponseTime || "..."}</h3>
              <p className="text-[10px] font-bold text-stone-400 mt-1">Per survey session</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-stone-400 tracking-tight">Feedback rate</p>
              <h3 className="text-2xl font-bold text-stone-900">{stats?.feedbackRate || "..."}</h3>
              <p className="text-[10px] font-bold text-stone-400 mt-1">From active members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Polls Management */}
      <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--brand-red)]" />
            Campaign Management
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <Input 
              placeholder="Search polls..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-stone-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Campaign title</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight text-center">Responses</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Region</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">End date</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="h-4 bg-stone-100 w-3/4" />
                          <div className="h-2 bg-stone-50 w-1/2" />
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="h-4 bg-stone-50 w-full" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-stone-50 w-full" /></td>
                      <td className="px-6 py-5"><div className="h-6 bg-stone-50 w-16" /></td>
                      <td className="px-6 py-5"><div className="h-4 bg-stone-50 w-full" /></td>
                      <td className="px-6 py-5 text-right"><div className="h-8 w-8 bg-stone-50 ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredPolls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400 text-xs font-bold tracking-tight">
                      No matching polls found in the campaign hub.
                    </td>
                  </tr>
                ) : (
                  filteredPolls.map((poll) => (
                  <tr key={poll.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-stone-900 tracking-tight">{poll.question}</span>
                        <span className="text-[9px] font-bold text-stone-400 mt-0.5">{poll.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-stone-900">{poll.totalVotes.toLocaleString()}</span>
                        <div className="w-20 h-1 bg-stone-100 mt-2 overflow-hidden">
                          <div 
                            className="h-full transition-all duration-1000" 
                            style={{ 
                              width: poll.totalVotes > 10000 ? '90%' : poll.totalVotes > 5000 ? '60%' : '30%', 
                              backgroundColor: poll.status === 'Active' ? 'var(--brand-green)' : 'var(--brand-gold)' 
                            }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-stone-600 tracking-tight">{poll.region}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: poll.status === 'Active' ? 'var(--brand-green)' : 'var(--brand-gold)' }} />
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-bold tracking-tight border rounded-md",
                          poll.status === 'Active' 
                            ? "bg-emerald-50 text-[var(--brand-green)] border-emerald-100" 
                            : poll.status === 'Draft'
                            ? "bg-amber-50 text-[var(--brand-gold)] border-amber-100"
                            : "bg-stone-50 text-[var(--brand-black)] border-stone-200"
                        )}>
                          {poll.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
                        <Clock className="w-3 h-3" />
                        {poll.endDate}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-stone-400 hover:text-red-500 transition-colors"
                          onClick={() => handleDeletePoll(poll.id, poll.question)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-stone-400"
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
        </CardContent>
      </Card>

      {/* Quick Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-stone-900 text-white relative overflow-hidden rounded-xl shadow-xl border border-white/5">
          <div className="relative z-10 space-y-4">
            <h4 className="text-lg font-bold tracking-tight">Maximize engagement</h4>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              Use regional-specific polls to gather more precise data. Our research shows chapters with localized campaigns see 40% higher member participation.
            </p>
            <Button 
              variant="outline" 
              className="h-10 text-[10px] font-bold tracking-tight border-white/20 bg-transparent text-white hover:bg-white hover:text-stone-900 rounded-lg"
              onClick={() => setIsAnalyticsModalOpen(true)}
            >
              View analytics guide
            </Button>
          </div>
          <BarChart3 className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12" />
        </div>

        <div className="p-8 border border-stone-200 bg-white space-y-4 rounded-xl shadow-sm">
          <h4 className="text-lg font-bold tracking-tight text-stone-900">Recent feedback highlights</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-stone-50 border border-stone-100 flex items-center justify-center shrink-0 rounded-lg">
                <MessageSquare className="w-5 h-5 text-stone-400" />
              </div>
              <div>
                <p className="text-sm text-stone-600 italic leading-relaxed">"The new regional chapter meetings have significantly improved communication between constituency leads..."</p>
                <p className="text-[10px] font-bold text-stone-400 mt-2">— Member feedback from Ashanti Region</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="h-8 px-0 text-[10px] font-bold tracking-tight text-red-600 hover:bg-transparent hover:text-red-700"
              onClick={() => setIsFeedbackModalOpen(true)}
            >
              View all feedback <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
      {/* Create Poll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg rounded-xl border-stone-800 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--brand-red)]" />
                New poll campaign
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-stone-400 hover:text-[var(--brand-red)]"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCreatePoll}>
              <CardContent className="p-6 space-y-6">
                {/* Question */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-tight text-stone-400">Campaign question / topic</label>
                  <Input 
                    required
                    placeholder="e.g. Should we increase regional chapter funding?" 
                    value={newPoll.question}
                    onChange={e => setNewPoll({...newPoll, question: e.target.value})}
                    className="rounded-lg border-stone-200 focus:border-stone-900"
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold tracking-tight text-stone-400 flex justify-between">
                    Poll Options
                    <span className="text-stone-300">Min 2 Required</span>
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
                        className="rounded-lg border-stone-200"
                      />
                      {newPoll.options.length > 2 && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0 text-stone-300 hover:text-red-500"
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
                    variant="ghost" 
                    className="h-8 text-[10px] font-bold tracking-tight text-stone-400 hover:text-stone-900"
                    onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})}
                  >
                    <Plus className="w-3 h-3 mr-2" /> Add Option
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Region */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-tight text-stone-400">Target region</label>
                    <select
                      value={newPoll.region}
                      onChange={e => setNewPoll({...newPoll, region: e.target.value})}
                      className="w-full h-10 px-3 text-xs border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
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
                    <label className="text-[10px] font-bold tracking-tight text-stone-400">Expiration date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                      <Input 
                        type="date"
                        value={newPoll.endDate}
                        onChange={e => setNewPoll({...newPoll, endDate: e.target.value})}
                        className="pl-9 h-10 text-xs rounded-lg border-stone-200"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 pt-0 flex gap-3">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1 h-11 text-xs font-bold rounded-lg border-stone-200"
                  onClick={() => setShowCreateModal(false)}
                >
                  Discard
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl rounded-xl border-stone-800 bg-white shadow-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-600" />
                Movement Feedback Vault
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-stone-400 hover:text-red-600"
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
                <div key={idx} className="p-4 bg-stone-50 border border-stone-100 rounded-xl space-y-2">
                  <p className="text-sm text-stone-700 italic leading-relaxed">"{fb.text}"</p>
                  <p className="text-[10px] font-bold text-stone-400">— {fb.author} from {fb.region} Region</p>
                </div>
              ))}
            </CardContent>
            <div className="p-6 pt-0 border-t border-stone-100 bg-stone-50/10 flex justify-end mt-4">
              <Button 
                className="h-10 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800 w-full"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-lg rounded-xl border-stone-800 bg-white shadow-2xl overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 flex flex-row items-center justify-between bg-stone-50/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-red-600" />
                Engagement Analytics Guide
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-stone-400 hover:text-red-600"
                onClick={() => setIsAnalyticsModalOpen(true)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
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
                className="h-10 text-xs font-bold rounded-lg bg-stone-900 text-white hover:bg-stone-800 w-full"
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
