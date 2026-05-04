import { MapPin, Users, Plus, Search, ChevronRight, Shield, Crown, Globe, History } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
import { Textarea } from '@/components/ui/textarea'
import { useState, useEffect, useMemo } from 'react'
import { useChapters } from '@/context/ChaptersContext'
import { toast } from 'sonner'

// Removing local mock data as we are now using ChaptersContext
export default function ChaptersManagement() {
  const { chapters, addChapter, updateChapter, deleteChapter } = useChapters()
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending'>('All')
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  
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

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await adminService.getRegionalStats()
      setRegionalStats(stats)
    }
    fetchStats()

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])



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
      if (success) toast.success(`Chapter "${formData.name}" established successfully.`)
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

  const itemsPerPage = isMobile ? 8 : 12
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage)
  
  const currentChapters = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredChapters.slice(start, start + itemsPerPage)
  }, [filteredChapters, currentPage, itemsPerPage])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Chapter Network</h1>
          <p className="text-stone-500 text-sm mt-1">Coordinate regional cells and constituency headquarters.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => toast.info("Accessing Audit Vault...")}
            className="h-11 text-[10px] uppercase font-bold tracking-widest border-stone-200"
          >
            <History className="w-4 h-4 mr-2" /> View Audit Trail
          </Button>
          {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
            <Button 
              variant="primary" 
              onClick={openAddModal}
              className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Establish New Chapter
            </Button>
          )}
        </div>
      </div>

      {/* Chapters Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-none border-stone-200 shadow-sm bg-[var(--brand-black)] text-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Chapters</p>
              <h3 className="text-2xl font-black font-meta">{chapters.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-stone-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-[var(--brand-black)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Movement Size</p>
              <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">{totalMembers.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        {regionalStats.slice(0, 3).map((stat) => (
          <Card key={stat.region} className="rounded-none border-stone-200 shadow-sm overflow-hidden relative group cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-stone-100 flex items-center justify-center transition-colors group-hover:bg-[var(--brand-black)] group-hover:text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 group-hover:text-[var(--brand-black)] transition-colors">{stat.region}</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-xl font-black font-meta text-[var(--brand-black)]">{stat.memberCount.toLocaleString()}</h3>
                  <div className={cn(
                    "px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                    stat.performance === 'High' && "bg-emerald-50 text-[var(--brand-green)] border-[var(--brand-green)]/20",
                    stat.performance === 'Medium' && "bg-amber-50 text-[var(--brand-gold)] border-[var(--brand-gold)]/20",
                    stat.performance === 'Low' && "bg-red-50 text-[var(--brand-red)] border-[var(--brand-red)]/20",
                  )}>
                    {stat.performance}
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 h-1 bg-[var(--brand-red)] transition-all duration-300 w-0 group-hover:w-full" style={{ backgroundColor: stat.color }} />
          </Card>
        ))}
      </div>

      {/* Regional Impact Intelligence Map */}
      <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-stone-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black font-meta uppercase tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-[var(--brand-red)]" />
              Regional Movement Density
            </CardTitle>
            <CardDescription className="text-xs mt-1">Geospatial distribution of chapters and mobilization strength.</CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[var(--brand-green)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">High Strength</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[var(--brand-gold)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-[var(--brand-red)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Emerging</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 flex flex-col md:flex-row gap-10 items-center justify-center bg-stone-50/30">
          <div className="relative w-full max-w-[500px] aspect-[4/5] bg-stone-100/50 flex items-center justify-center border border-stone-200/50 group overflow-hidden">
             {/* Abstract SVG Map of Ghana Regions */}
             <svg viewBox="0 0 400 500" className="w-full h-full p-8 opacity-80 group-hover:opacity-100 transition-opacity duration-700">
                {/* Northern Regions */}
                <path d="M50,50 L350,50 L350,200 L50,200 Z" fill="var(--brand-red)" fillOpacity="0.15" stroke="var(--brand-red)" strokeWidth="2" className="hover:fill-opacity-40 transition-all cursor-pointer" />
                {/* Middle Regions */}
                <path d="M50,205 L350,205 L350,350 L50,350 Z" fill="var(--brand-gold)" fillOpacity="0.2" stroke="var(--brand-gold)" strokeWidth="2" className="hover:fill-opacity-50 transition-all cursor-pointer" />
                {/* Southern / Coastal Regions */}
                <path d="M50,355 L200,355 L200,480 L50,480 Z" fill="var(--brand-green)" fillOpacity="0.25" stroke="var(--brand-green)" strokeWidth="2" className="hover:fill-opacity-60 transition-all cursor-pointer" />
                <path d="M205,355 L350,355 L350,480 L205,480 Z" fill="var(--brand-green)" fillOpacity="0.25" stroke="var(--brand-green)" strokeWidth="2" className="hover:fill-opacity-60 transition-all cursor-pointer" />
                
                {/* Markers */}
                <circle cx="275" cy="420" r="8" fill="var(--brand-black)" className="animate-pulse" />
                <circle cx="125" cy="420" r="8" fill="var(--brand-black)" />
                <circle cx="200" cy="275" r="8" fill="var(--brand-black)" />
                <circle cx="100" cy="125" r="8" fill="var(--brand-black)" />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-300 transform -rotate-45">National Geospatial Grid</span>
             </div>
          </div>
          
          <div className="flex-1 space-y-6 w-full">
            <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-2">Regional Performance Tier</h4>
            <div className="space-y-4">
              {regionalStats.map((stat) => (
                <div key={stat.region} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-tight text-stone-600 group-hover:text-[var(--brand-black)] transition-colors">{stat.region}</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase">{stat.performance} Impact</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 overflow-hidden rounded-none">
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
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search chapters by name, region or country..." 
            className="pl-10 h-11 rounded-none border-stone-200"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as 'All' | 'Active' | 'Pending'); setCurrentPage(1); }}
          className="h-11 px-4 text-[10px] font-bold uppercase tracking-widest rounded-none border border-stone-200 bg-white focus:outline-none focus:border-[var(--brand-black)]"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {currentChapters.map((chapter) => (
          <Card key={chapter.id} className="rounded-none border-stone-200 shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-50 bg-stone-50/50">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-[var(--brand-red)] uppercase tracking-wider">{chapter.id.slice(0, 8).toUpperCase()}</span>
                  <CardTitle className="text-sm font-black text-[var(--brand-black)] uppercase tracking-tight leading-tight">
                    {chapter.name}
                  </CardTitle>
                </div>
                <div className={cn(
                  "px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                  (chapter.status === 'Active') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                )}>
                  {chapter.status}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 group/lead">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5 text-[var(--brand-gold)]" /> Regional Hub
                  </p>
                  <p className="text-xs font-black text-stone-900 uppercase tracking-tight truncate">{chapter.city_or_region}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Strength</p>
                  <p className="text-xs font-black text-stone-900 flex items-center justify-end gap-1">
                    <Users className="w-3 h-3 text-[var(--brand-green)]" />
                    {(chapter.member_count || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-stone-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight">Ghana</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
                    <Button 
                      variant="outline" 
                      onClick={() => openEditModal(chapter)}
                      className="h-9 px-0 text-[8px] font-black uppercase tracking-widest border-stone-100 hover:bg-stone-900 hover:text-white transition-all"
                    >
                      Manage Hub
                    </Button>
                  )}
                  {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
                    <Button 
                      variant="ghost" 
                      onClick={() => handleDeleteChapter(chapter.id, chapter.name)}
                      className="h-9 px-0 text-[8px] font-black uppercase tracking-widest text-stone-400 hover:text-[var(--brand-red)] transition-colors"
                    >
                      Delete Chapter <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Chapter Placeholder */}
        {adminService.can('MANAGE_CHAPTER', 'CHAPTERS') && (
          <button 
            onClick={openAddModal}
            className="border-2 border-dashed border-stone-200 rounded-none p-8 flex flex-col items-center justify-center gap-4 text-stone-400 hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-[var(--brand-red)] group-hover:text-white transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Establish New Chapter</span>
          </button>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-stone-200">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center md:text-left w-full md:w-auto">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredChapters.length)} of {filteredChapters.length} Chapters
          </span>
          <div className="flex items-center justify-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-none border-stone-200"
            >
              Previous
            </Button>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] [&::-webkit-scrollbar]:hidden">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "min-w-[32px] h-8 px-2 text-[10px] font-black transition-colors shrink-0",
                    currentPage === i + 1 
                      ? "bg-[var(--brand-black)] text-white" 
                      : "text-stone-400 hover:bg-stone-100 hover:text-[var(--brand-black)]"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-none border-stone-200"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Chapter Editor Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none rounded-none p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-charcoal-dark text-white relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]"></div>
            <DialogTitle className="text-xl font-bold tracking-tight uppercase font-meta">
              {editingChapterId ? 'Configure Regional Hub' : 'Establish New Chapter'}
            </DialogTitle>
            <DialogDescription className="text-stone-400 text-xs mt-2">
              {editingChapterId 
                ? 'Update infrastructure settings and mobilization status for this regional cell.' 
                : 'Register a new mobilization hub. This chapter will immediately be visible on the public platform once established.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveChapter} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Chapter Name</label>
                <Input 
                  required
                  placeholder="e.g. Adabraka Hub"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-12 bg-stone-50 border-stone-200 rounded-none focus:ring-brand-green font-medium text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">City / Region</label>
                <Input 
                  required
                  placeholder="e.g. Accra"
                  value={formData.city_or_region}
                  onChange={(e) => setFormData({...formData, city_or_region: e.target.value})}
                  className="h-12 bg-stone-50 border-stone-200 rounded-none focus:ring-brand-green font-medium text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Country</label>
                <Input 
                  required
                  placeholder="e.g. Ghana"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="h-12 bg-stone-50 border-stone-200 rounded-none focus:ring-brand-green font-medium text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Hub Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full h-12 bg-stone-50 border border-stone-200 rounded-none focus:ring-brand-green px-4 text-sm font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Mission Description</label>
              <Textarea 
                required
                placeholder="Describe the chapter's focus area..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="min-h-[100px] bg-stone-50 border-stone-200 rounded-none focus:ring-brand-green font-medium text-sm p-4"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeModal}
                className="text-[10px] font-bold uppercase tracking-widest rounded-none"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[var(--brand-black)] text-white hover:bg-stone-800 font-bold text-[10px] uppercase tracking-widest rounded-none px-8"
              >
                {editingChapterId ? 'Update Hub' : 'Create Chapter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
