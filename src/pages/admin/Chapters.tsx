import { MapPin, Users, Plus, Search, ChevronRight, Shield, Crown, Globe, History } from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import type { RegionalStat, Chapter } from '@/services/adminService'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect, useMemo } from 'react'
import { useChapters } from '@/context/ChaptersContext'
import { toast } from 'sonner'
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts'

// Removing local mock data as we are now using ChaptersContext
export default function ChaptersManagement() {
  const { chapters, addChapter, updateChapter, deleteChapter } = useChapters()
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  
  // Chapter Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    city_or_region: '',
    country: 'Ghana',
    description: '',
    status: 'Pending'
  })





  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Adapted mapping for service compatibility
    const chapterData = {
      name: formData.name,
      city_or_region: formData.city_or_region,
      country: formData.country,
      leader_name: 'Unassigned',
      member_count: 0,
      status: formData.status as Chapter['status']
    }

    if (editingChapterId) {
      const success = await updateChapter(editingChapterId, chapterData)
      if (success) toast.success(`Chapter "${formData.name}" updated successfully.`)
    } else {
      const success = await addChapter(chapterData)
      if (success) toast.success(`Chapter "${formData.name}" registered successfully.`)
    }
    closeModal()
  }

  const openAddModal = () => {
    setEditingChapterId(null)
    setFormData({
      name: '',
      city_or_region: '',
      country: 'Ghana',
      description: '',
      status: 'Pending'
    })
    setIsModalOpen(true)
  }

  const openEditModal = (chapter: Chapter) => {
    setEditingChapterId(chapter.id)
    setFormData({
      name: chapter.name,
      city_or_region: chapter.city_or_region,
      country: chapter.country || 'Ghana',
      description: '', 
      status: chapter.status
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingChapterId(null)
  }

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await adminService.getRegionalStats()
      setRegionalStats(stats)
    }
    fetchStats()
  }, [])

  // Deep Link Handling for Global Search
  useEffect(() => {
    if (chapters.length > 0) {
      const params = new URLSearchParams(window.location.search)
      const chapterId = params.get('id')
      if (chapterId) {
        const chapter = chapters.find(c => c.id === chapterId)
        if (chapter) {
          // Defer to avoid synchronous setState warning in effect
          setTimeout(() => {
            openEditModal(chapter)
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname)
          }, 0)
        }
      }
    }
  }, [chapters])

  const handleDeleteChapter = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to decommission the "${name}" chapter?`)) {
      const success = await deleteChapter(id, name)
      if (success) toast.error(`Chapter "${name}" has been decommissioned.`)
    }
  }

  const filteredChapters = useMemo(() => {
    return chapters.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                           c.city_or_region.toLowerCase().includes(search.toLowerCase())
      
      const normalizedStatus = c.status === 'Active' ? 'Active' : 'Pending'
      const matchesStatus = statusFilter === 'All' || normalizedStatus === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [chapters, search, statusFilter])

  const totalMembers = useMemo(() => 
    chapters.reduce((sum, c) => sum + (c.member_count || 0), 0), 
    [chapters]
  )

  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage)
  
  const currentChapters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredChapters.slice(start, start + itemsPerPage)
  }, [filteredChapters, currentPage, itemsPerPage])

  return (
    <div className="admin-page-container">
      {/* Page Header - Standardized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <MapPin className="w-8 h-8 text-on-surface" />
            Chapters
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Coordinate regional cells and constituency headquarters across the national movement infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="gold" 
            size="lg"
            onClick={() => toast.info("Accessing audit vault...")}
            className="rounded-sm text-micro px-10 h-12 font-bold tracking-tight transition-all shadow-sm active:scale-95"
          >
            <History className="w-4 h-4 mr-2" /> Inspect Audit Trail
          </Button>
          {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
            <Button 
              variant="primary"
              size="lg"
              onClick={openAddModal}
              className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Chapter
            </Button>
          )}
        </div>
      </div>

      {/* Chapters Overview Stats - Balanced Grid */}
      <div className="grid-stats mb-10" style={{ '--grid-min-width': '220px' } as React.CSSProperties}>
        <Card className="rounded-sm border-border/60 shadow-sm bg-charcoal-dark text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flow" style={{ '--flow-space': '0.1em' } as React.CSSProperties}>
              <p className="text-micro font-bold text-white/60 uppercase tracking-widest mb-1">Total chapters</p>
              <h3 className="text-2xl font-bold font-meta m-0">{chapters.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-border/40 flex items-center justify-center rounded-sm">
              <Users className="w-6 h-6 text-on-surface" />
            </div>
            <div className="flow" style={{ '--flow-space': '0.1em' } as React.CSSProperties}>
              <p className="text-micro font-bold text-muted-foreground/60 uppercase tracking-widest mb-1">Member count</p>
              <h3 className="text-2xl font-bold font-meta text-on-surface m-0">{totalMembers.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        {regionalStats.slice(0, 2).map((stat) => (
          <Card key={stat.region} className="rounded-sm border-border/60 shadow-sm overflow-hidden relative group cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-border/40 flex items-center justify-center transition-colors group-hover:bg-charcoal-dark group-hover:text-white rounded-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flow" style={{ '--flow-space': '0.1em' } as React.CSSProperties}>
                <p className="text-micro font-bold text-muted-foreground/40 group-hover:text-on-surface transition-colors normal-case mb-0">{stat.region}</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-meta text-on-surface m-0">{stat.memberCount.toLocaleString()}</h3>
                  <div className={cn(
                    "px-1.5 py-0.5 text-[8px] font-bold border rounded normal-case",
                    stat.performance === 'High' && "bg-primary/10 text-primary border-primary/20",
                    stat.performance === 'Medium' && "bg-accent/10 text-accent border-accent/20",
                    stat.performance === 'Low' && "bg-destructive/10 text-destructive border-destructive/20",
                  )}>
                    {stat.performance}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 bg-border/60 transition-all duration-300 w-0 group-hover:w-full" style={{ backgroundColor: stat.color }} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 📊 Resource Intensity vs Mobilization */}
        <Card className="rounded-sm border-border/60 shadow-sm bg-background p-6">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Resource-to-impact correlation
            </CardTitle>
            <CardDescription className="text-micro font-bold normal-case text-muted-foreground/40 mt-1">Mapping jurisdictional investment against mobilization strength.</CardDescription>
          </CardHeader>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  type="number" 
                  dataKey="chapters" 
                  name="Chapters" 
                  unit="" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(0,0,0,0.3)' }}
                  label={{ value: 'Chapter Density', position: 'bottom', offset: 0, fontSize: 10, fill: 'rgba(0,0,0,0.5)' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="memberCount" 
                  name="Patriots" 
                  unit="" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: 'rgba(0,0,0,0.3)' }}
                  label={{ value: 'Mobilization Strength', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'rgba(0,0,0,0.5)' }}
                />
                <ZAxis type="number" dataKey="chapters" range={[60, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
                <Scatter name="Regions" data={regionalStats} fill="var(--brand-green)">
                  {regionalStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 🗺️ Regional Allocation Summary */}
        <Card className="rounded-sm border-border/60 shadow-sm bg-background p-6">
          <CardHeader className="p-0 mb-8">
            <CardTitle className="text-xs font-bold normal-case font-meta flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Logistical footprint
            </CardTitle>
            <CardDescription className="text-micro font-bold normal-case text-muted-foreground/40 mt-1">Jurisdictional resource distribution hierarchy.</CardDescription>
          </CardHeader>
          <div className="space-y-5">
             {regionalStats.slice(0, 5).map((stat) => (
                <div key={stat.region} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-micro font-bold text-on-surface/80 group-hover:text-on-surface transition-colors normal-case">{stat.region}</span>
                    <span className="text-micro font-bold text-muted-foreground/40 normal-case">{stat.chapters} active hubs</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/10 overflow-hidden rounded-full border border-white/5">
                    <div 
                      className="h-full transition-all duration-1000 shadow-[0_0_8px_rgba(var(--brand-green-rgb),0.3)]" 
                      style={{ 
                        width: `${Math.min((stat.memberCount / 2000) * 100, 100)}%`,
                        backgroundColor: stat.color 
                      }} 
                    />
                  </div>
                </div>
             ))}
          </div>
        </Card>
      </div>

      {/* Regional Impact Intelligence Map */}
      <Card className="rounded-none border-border/60 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-border/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2 text-on-surface">
              <Globe className="w-5 h-5 text-muted-foreground/40" />
              Regional movement density
            </CardTitle>
            <CardDescription className="text-xs mt-1 font-medium text-muted-foreground/40">Geospatial distribution of chapters and mobilization strength.</CardDescription>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 md:flex md:gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-primary rounded-sm shrink-0" />
              <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">High strength</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-accent rounded-sm shrink-0" />
              <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">Moderate</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <div className="w-2.5 h-2.5 bg-border/40 rounded-sm shrink-0" />
              <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">Emerging density</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 cq-container bg-muted/20">
          <div className="flex flex-col md:flex-row items-start gap-10">
            <div className="relative w-full md:w-auto md:min-w-[280px] md:max-w-[340px] aspect-[4/5] bg-border/20 flex items-center justify-center border border-border/40 group overflow-hidden shrink-0">
             {/* Abstract SVG Map of Ghana Regions */}
             <svg viewBox="0 0 400 500" className="w-full h-full p-8 opacity-80 group-hover:opacity-100 transition-opacity duration-700">
                {/* Northern Regions */}
                <path d="M50,50 L350,50 L350,200 L50,200 Z" fill="var(--destructive)" fillOpacity="0.15" stroke="var(--destructive)" strokeWidth="2" className="hover:fill-opacity-40 transition-all cursor-pointer" />
                {/* Middle Regions */}
                <path d="M50,205 L350,205 L350,350 L50,350 Z" fill="var(--accent)" fillOpacity="0.2" stroke="var(--accent)" strokeWidth="2" className="hover:fill-opacity-50 transition-all cursor-pointer" />
                {/* Southern / Coastal Regions */}
                <path d="M50,355 L200,355 L200,480 L50,480 Z" fill="var(--primary)" fillOpacity="0.25" stroke="var(--primary)" strokeWidth="2" className="hover:fill-opacity-60 transition-all cursor-pointer" />
                <path d="M205,355 L350,355 L350,480 L205,480 Z" fill="var(--primary)" fillOpacity="0.25" stroke="var(--primary)" strokeWidth="2" className="hover:fill-opacity-60 transition-all cursor-pointer" />
                
                {/* Markers */}
                <circle cx="275" cy="420" r="8" fill="hsl(var(--on-surface))" className="animate-pulse" />
                <circle cx="125" cy="420" r="8" fill="hsl(var(--on-surface))" />
                <circle cx="200" cy="275" r="8" fill="hsl(var(--on-surface))" />
                <circle cx="100" cy="125" r="8" fill="hsl(var(--on-surface))" />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-micro font-bold normal-case text-muted-foreground/20 transform -rotate-45">National Geospatial Grid</span>
             </div>
          </div>
          
          <div className="flex-1 space-y-6 w-full">
            <h4 className="text-xs font-bold text-muted-foreground/40 border-b border-border/40 pb-2 normal-case">Regional performance tier</h4>
            <div className="space-y-4">
              {regionalStats.map((stat) => (
                <div key={stat.region} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-micro font-bold text-on-surface/80 group-hover:text-on-surface transition-colors normal-case">{stat.region}</span>
                    <span className="text-micro font-bold text-muted-foreground/40 normal-case">{stat.performance} impact</span>
                  </div>
                  <div className="h-1.5 w-full bg-border/40 overflow-hidden rounded-full">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${(stat.memberCount / 20000) * 100}%`,
                        backgroundColor: stat.color 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search chapters by name, region or country..." 
            className="pl-10 h-11 rounded-sm border-border/60 shadow-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as 'All' | 'Active' | 'Pending'); setCurrentPage(1); }}
          className="h-11 px-4 text-micro font-bold rounded-sm border border-border/60 bg-white focus:outline-none focus:border-charcoal-dark shadow-sm normal-case"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {currentChapters.map((chapter) => (
          <Card key={chapter.id} className="rounded-sm border-border/60 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-border/10 bg-muted/30">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-micro font-bold text-muted-foreground/40 normal-case">{chapter.id.slice(0, 8)}</span>
                  <CardTitle className="text-sm font-bold text-on-surface tracking-tight leading-tight">
                    {chapter.name}
                  </CardTitle>
                </div>
                <div className={cn(
                  "px-2 py-0.5 text-[8px] font-bold border normal-case rounded-full",
                  (chapter.status === 'Active') ? "bg-primary/10 text-primary border-primary/20" : "bg-accent/10 text-accent border-accent/20"
                )}>
                  {chapter.status}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 flow" style={{ '--flow-space': '1.25rem' } as React.CSSProperties}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 group/lead">
                  <p className="text-micro font-bold text-muted-foreground/40 normal-case flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 text-accent" /> Regional hub
                  </p>
                  <p className="text-xs font-bold text-on-surface tracking-tight truncate">{chapter.city_or_region}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-micro font-bold text-muted-foreground/40 normal-case">Strength</p>
                  <p className="text-xs font-bold text-on-surface flex items-center justify-end gap-1">
                    <Users className="w-3 h-3 text-primary" />
                    {(chapter.member_count || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/10">
                {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
                    <Button 
                      variant="gold" 
                      size="sm"
                      onClick={() => openEditModal(chapter)}
                      className="h-11 px-0 text-micro font-bold tracking-tight shadow-sm active:scale-95"
                    >
                      Configure Hub
                    </Button>
                )}
                {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeleteChapter(chapter.id, chapter.name)}
                      className="h-11 px-0 text-micro font-bold tracking-tight transition-all rounded-sm active:scale-95"
                    >
                      Decommission <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Chapter Placeholder */}
        {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
          <Button 
            variant="primary"
            onClick={openAddModal}
            className="rounded-sm p-10 flex flex-col items-center justify-center gap-6 transition-all group bg-brand-green/10 h-full shadow-sm hover:shadow-md active:scale-95"
          >
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-brand-green transition-all shadow-inner">
              <Plus className="w-7 h-7" />
            </div>
            <span className="text-micro font-bold tracking-tight">Add new chapter</span>
          </Button>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-border/60">
          <span className="text-micro font-bold text-muted-foreground/40 normal-case text-center md:text-left w-full md:w-auto">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredChapters.length)} of {filteredChapters.length} chapters
          </span>
          <div className="w-full md:w-auto flex-1">
            <Pagination>
              <PaginationContent className="justify-center md:justify-end">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={cn("h-11 rounded-sm shadow-sm active:scale-95 text-micro font-bold", currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer")}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn("h-11 w-11 rounded-sm text-micro font-bold", currentPage === i + 1 ? "shadow-md shadow-brand-green/20" : "cursor-pointer")}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={cn("h-11 rounded-sm shadow-sm active:scale-95 text-micro font-bold", currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}

      {/* Chapter Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none rounded-none p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-charcoal-dark text-white relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-on-surface/20"></div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {editingChapterId ? 'Configure regional hub' : 'Add new chapter'}
            </DialogTitle>
            <DialogDescription className="text-white/60 text-xs mt-2">
              {editingChapterId 
                ? 'Update infrastructure settings and mobilization status for this regional cell.' 
                : 'Register a new mobilization hub. This chapter will immediately be visible on the public platform once active.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveChapter} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-micro font-bold text-muted-foreground/40 normal-case">Chapter name</label>
                <Input 
                  required
                  placeholder="e.g. Adabraka hub"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-12 bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-micro font-bold text-muted-foreground/40 normal-case">City / region</label>
                <Input 
                  required
                  placeholder="e.g. Accra"
                  value={formData.city_or_region}
                  onChange={(e) => setFormData({...formData, city_or_region: e.target.value})}
                  className="h-12 bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-micro font-bold text-muted-foreground/40 normal-case">Country</label>
                <Input 
                  required
                  placeholder="e.g. Ghana"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="h-12 bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-micro font-bold text-muted-foreground/40 normal-case">Hub status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full h-12 bg-muted/5 border border-border/60 rounded-sm focus:ring-0 focus:border-charcoal-dark px-4 text-sm font-medium shadow-sm outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-micro font-bold text-muted-foreground/40 normal-case">Mission description</label>
              <Textarea 
                required
                placeholder="Describe the chapter's focus area..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="min-h-[100px] bg-muted/5 border-border/60 rounded-sm focus:ring-0 focus:border-on-surface font-medium text-sm p-4 shadow-sm"
              />
            </div>

            <DialogFooter className="pt-4 gap-4 flex-row">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeModal}
                className="flex-1 h-14 text-micro font-bold tracking-tight rounded-sm border-border/40 hover:bg-stone-50 transition-all active:scale-95"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                className="flex-1 h-14 text-micro font-bold tracking-tight rounded-sm shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                {editingChapterId ? 'Synchronize Hub' : 'Add Chapter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
