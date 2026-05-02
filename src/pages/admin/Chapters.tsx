import { MapPin, Users, Plus, Search, ChevronRight, Shield, Target, Crown, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Mock Data for Chapters
const chaptersData = [
  { id: 'CH-ACC-01', name: 'Greater Accra Central', region: 'Greater Accra', lead: 'Dr. Samuel Kweku', members: 4500, impact: 'High', status: 'Active' },
  { id: 'CH-ASH-01', name: 'Kumasi Metropolitan', region: 'Ashanti', lead: 'Nana Ama Serwaa', members: 8200, impact: 'Very High', status: 'Active' },
  { id: 'CH-WES-01', name: 'Sekondi-Takoradi', region: 'Western', lead: 'Ekow Essien', members: 3100, impact: 'Medium', status: 'Active' },
  { id: 'CH-CEN-01', name: 'Cape Coast South', region: 'Central', lead: 'Prof. John Mensah', members: 2800, impact: 'High', status: 'Active' },
  { id: 'CH-NOR-01', name: 'Tamale North', region: 'Northern', lead: 'Alhaji Ibrahim', members: 5400, impact: 'High', status: 'Pending' },
]

export default function ChaptersManagement() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Chapter Network</h1>
          <p className="text-stone-500 text-sm mt-1">Coordinate regional cells and constituency headquarters.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]">
            <Plus className="w-4 h-4 mr-2" /> Establish New Chapter
          </Button>
        </div>
      </div>

      {/* Chapters Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-none border-stone-200 shadow-sm bg-[var(--brand-green)] text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Chapters</p>
              <h3 className="text-2xl font-black font-meta">124</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm bg-[var(--brand-red)] text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Active Regions</p>
              <h3 className="text-2xl font-black font-meta">16 / 16</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm bg-[var(--brand-gold)] text-[var(--brand-black)]">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-black/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-[var(--brand-black)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Target Milestone</p>
              <h3 className="text-2xl font-black font-meta">82%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input 
            placeholder="Search chapters by region or lead..." 
            className="pl-10 h-11 rounded-none border-stone-200"
          />
        </div>
        <Button variant="outline" className="h-11 rounded-none border-stone-200 px-8 text-[10px] font-bold uppercase tracking-widest">
          Filter By Status
        </Button>
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {chaptersData.map((chapter) => (
          <Card key={chapter.id} className="rounded-none border-stone-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-50 bg-stone-50/50">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[var(--brand-red)] uppercase tracking-wider">{chapter.id}</span>
                  <CardTitle className="text-sm font-black text-[var(--brand-black)] uppercase tracking-tight leading-tight">
                    {chapter.name}
                  </CardTitle>
                </div>
                <div className={cn(
                  "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                  chapter.status === 'Active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                )}>
                  {chapter.status}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 group/lead">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 text-[var(--brand-gold)]" /> Chapter Lead
                  </p>
                  <p className="text-xs font-black text-stone-900 uppercase tracking-tight truncate">{chapter.lead}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Growth</p>
                  <p className="text-xs font-black text-stone-900 flex items-center justify-end gap-1">
                    <Users className="w-3 h-3 text-[var(--brand-green)]" />
                    {chapter.members.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-stone-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">{chapter.region}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-gold)]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--brand-gold)]">{chapter.impact} Impact</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button variant="outline" className="h-9 px-0 text-[8px] font-black uppercase tracking-widest border-stone-100 hover:bg-stone-900 hover:text-white transition-all">
                    <UserPlus className="w-3 h-3 mr-1.5" /> Manage Lead
                  </Button>
                  <Button variant="ghost" className="h-9 px-0 text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-[var(--brand-black)]">
                    Audit Logs <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Chapter Placeholder */}
        <button className="border-2 border-dashed border-stone-200 rounded-none p-8 flex flex-col items-center justify-center gap-4 text-stone-400 hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] transition-all group">
          <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-[var(--brand-red)] group-hover:text-white transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Establish New Chapter</span>
        </button>
      </div>
    </div>
  )
}
