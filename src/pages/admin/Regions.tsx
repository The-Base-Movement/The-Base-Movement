import { useState, useEffect } from 'react'
import { MapPin, ChevronRight, ChevronDown, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { adminService, type Region } from '@/services/adminService'
import { toast } from 'sonner'

export default function AdminRegions() {
  const [regions, setRegions] = useState<Region[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<number[]>([])
  const [constituencySearch, setConstituencySearch] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const data = await adminService.getRegions()
      setRegions(data)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const totalConstituencies = regions.reduce((acc, r) => acc + (r.constituencies?.length || 0), 0)

  const toggleRegion = (id: number) => {
    setExpandedRegions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const filteredRegions = regions.filter(region => {
    const rName = region.name || ''
    const rConstituencies = region.constituencies || []
    return rName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rConstituencies.some(c => c?.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const handleAction = (action: string, region: string, constituency?: string) => {
    const resource = constituency ? `REGIONS/${region}/CONSTITUENCIES/${constituency}` : `REGIONS/${region}`
    adminService.logAction(action, resource, 'Success')
    toast.success(`${action.replace('_', ' ')} recorded in Audit Vault for ${constituency || region}`)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <MapPin className="w-8 h-8 text-on-surface" />
            Regions & constituencies
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Manage administrative regions and regional jurisdictions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            size="lg"
            className="rounded-sm text-[10px] uppercase tracking-[0.2em] px-8"
          >
            <Plus className="w-4 h-4 mr-2" /> Define New Region
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-sm border-border/40 shadow-sm bg-on-surface text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center shrink-0 rounded-lg">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold normal-case opacity-60">Regions</p>
              <p className="text-2xl font-bold tracking-tight">16</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-sm border-border/40 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-destructive/10 flex items-center justify-center shrink-0 rounded-lg">
              <MapPin className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-[9px] font-bold normal-case text-muted-foreground/80">Constituencies</p>
              <p className="text-2xl font-bold tracking-tight text-on-surface">{totalConstituencies}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/40 shadow-sm col-span-2 md:col-span-2">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[9px] font-bold normal-case text-muted-foreground/80">Avg. per region</p>
              <p className="text-2xl font-bold tracking-tight text-on-surface">
                {Math.round(totalConstituencies / 16)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search regions or constituencies..."
          className="pl-10 h-11 rounded-sm border-border/40 shadow-sm"
        />
      </div>

      {/* Regions List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-none border-border/40 shadow-none animate-pulse">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-muted/10" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/10 w-24" />
                    <div className="h-2 bg-muted/5 w-16" />
                  </div>
                </div>
                <div className="h-6 w-6 bg-muted/5" />
              </div>
            </Card>
          ))
        ) : filteredRegions.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground/80 text-sm font-bold tracking-wider border border-dashed border-border/40 rounded-sm bg-muted/5">
            No matching geographical data found.
          </div>
        ) : (
          filteredRegions.map((region) => {
            const isExpanded = expandedRegions.includes(region.id)
            const cSearch = constituencySearch[region.id] || ''
            const visibleConstituencies = (region.constituencies || []).filter(c =>
              c?.toLowerCase().includes(cSearch.toLowerCase())
            )

            return (
              <Card key={region.id} className="rounded-sm border-border/40 shadow-sm overflow-hidden bg-white">
                {/* Region Header Row */}
                <button
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors group"
                  onClick={() => toggleRegion(region.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 flex items-center justify-center transition-colors rounded-lg",
                      isExpanded ? "bg-on-surface text-white" : "bg-muted/10 text-muted-foreground/80 group-hover:bg-muted/20"
                    )}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold tracking-tight text-on-surface">
                        {region.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 font-bold tracking-wider">
                        {region.constituencies.length} constituencies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Action buttons - stop propagation so they don't toggle expand */}
                    <button
                      className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-on-surface hover:bg-muted/10 transition-colors"
                      onClick={e => { e.stopPropagation(); handleAction('REGION_EDIT', region.name) }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/5 transition-colors"
                      onClick={e => { e.stopPropagation(); handleAction('REGION_DELETE', region.name) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground/80" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground/80" />
                    }
                  </div>
                </button>

                {/* Expanded: Constituency Grid */}
                {isExpanded && (
                  <div className="border-t border-border/40 bg-muted/5 px-6 py-5 space-y-4">
                    {/* Constituency search */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" />
                        <Input
                          value={cSearch}
                          onChange={e => setConstituencySearch(prev => ({ ...prev, [region.id]: e.target.value }))}
                          placeholder="Filter constituencies..."
                          className="pl-9 h-9 rounded-lg border-border/40 text-xs shadow-sm"
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-sm border-border/40 hover:bg-stone-100"
                      >
                        <Plus className="w-3 h-3 mr-1.5" /> Define Constituency
                      </Button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                      {visibleConstituencies.map(con => (
                        <div
                          key={con}
                          className="group flex items-center justify-between gap-1 px-3 py-2 bg-white border border-border/40 hover:border-on-surface/40 transition-colors rounded-lg"
                        >
                          <span className="text-[10px] font-bold tracking-tight text-on-surface/80 group-hover:text-on-surface truncate">
                            {con}
                          </span>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => handleAction('CONSTITUENCY_EDIT', region.name, con)}
                          >
                            <Edit2 className="w-2.5 h-2.5 text-muted-foreground/60 hover:text-on-surface" />
                          </button>
                        </div>
                      ))}
                      {visibleConstituencies.length === 0 && (
                        <p className="col-span-full text-center text-[10px] text-muted-foreground/60 font-bold tracking-wider py-4">
                          No match found.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
