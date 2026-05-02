import { useState } from 'react'
import { 
  BarChart3, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  Users,
  MessageSquare,
  TrendingUp
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

// Mock Data for Polls
const pollsData = [
  { id: 'POLL-001', title: 'Economic Policy Feedback 2024', status: 'Active', votes: 12450, region: 'National', endDate: '2024-05-15' },
  { id: 'POLL-002', title: 'Regional Impact Assessment', status: 'Draft', votes: 0, region: 'Ashanti', endDate: '2024-06-01' },
  { id: 'POLL-003', title: 'Membership Benefits Survey', status: 'Closed', votes: 8900, region: 'National', endDate: '2024-04-10' },
  { id: 'POLL-004', title: 'Community Policing Initiatives', status: 'Active', votes: 3120, region: 'Greater Accra', endDate: '2024-05-20' },
]

export default function PollsManagement() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Engagement Hub</h1>
          <p className="text-stone-500 text-sm mt-1">Manage opinion polls, surveys, and movement feedback.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]">
            <Plus className="w-4 h-4 mr-2" /> Create New Poll
          </Button>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Total Engagements</p>
              <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">24.5k</h3>
              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 mt-1">
                <TrendingUp className="w-3 h-3" /> +15% this week
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Active Polls</p>
              <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">12</h3>
              <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-tight">Across all regions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Avg Response Time</p>
              <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">4.2m</h3>
              <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-tight">Per survey session</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Feedback Rate</p>
              <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">68%</h3>
              <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-tight">From active members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Polls Management */}
      <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xs font-black font-meta uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--brand-red)]" />
            Campaign Management
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <Input 
              placeholder="Search polls..." 
              className="pl-9 h-9 text-xs rounded-none border-stone-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Campaign Title</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Responses</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Region</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">End Date</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {pollsData.map((poll) => (
                  <tr key={poll.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-[var(--brand-black)] uppercase tracking-tight">{poll.title}</span>
                        <span className="text-[9px] font-bold text-stone-400 mt-0.5">{poll.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-stone-900">{poll.votes.toLocaleString()}</span>
                        <div className="w-16 h-1 bg-stone-100 mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-[var(--brand-green)]" 
                            style={{ width: poll.status === 'Closed' ? '100%' : '65%' }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-stone-600">{poll.region}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                        poll.status === 'Active' 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : poll.status === 'Draft'
                          ? "bg-stone-50 text-stone-500 border-stone-200"
                          : "bg-stone-100 text-stone-400 border-stone-200"
                      )}>
                        {poll.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
                        <Clock className="w-3 h-3" />
                        {poll.endDate}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Button variant="ghost" size="icon" className="text-stone-400">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-[var(--brand-black)] text-white relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h4 className="text-lg font-black font-meta uppercase tracking-tighter">Maximize Engagement</h4>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Use regional-specific polls to gather more precise data. Our research shows chapters with localized campaigns see 40% higher member participation.
            </p>
            <Button variant="outline" className="h-10 text-[10px] uppercase font-bold tracking-widest border-white/20 text-white hover:bg-white/10">
              View Analytics Guide
            </Button>
          </div>
          <BarChart3 className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12" />
        </div>

        <div className="p-8 border border-stone-200 bg-white space-y-4">
          <h4 className="text-lg font-black font-meta uppercase tracking-tighter text-[var(--brand-black)]">Recent Feedback Highlight</h4>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-stone-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-stone-400" />
              </div>
              <div>
                <p className="text-xs text-stone-600 italic">"The new regional chapter meetings have significantly improved communication between constituency leads..."</p>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-2">— Member feedback from Ashanti Region</p>
              </div>
            </div>
            <Button variant="ghost" className="h-8 px-0 text-[10px] font-black uppercase tracking-widest text-[var(--brand-red)] hover:bg-transparent">
              View All Feedback <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
