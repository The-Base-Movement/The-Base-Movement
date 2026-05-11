import { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, Search, MapPin, Users, User, ArrowUpDown, Filter, X, Send } from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import SEO from '@/components/SEO'
import { Button } from '@/components/ui/neon-button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberProfileCard } from '@/components/MemberProfileCard'
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { adminService } from '@/services/adminService'
import { LoadingScreen } from '@/components/LoadingScreen'
import type { Member } from '@/types/admin'
import { cn } from '@/lib/utils'

const diasporaCountries = [
  'United Kingdom', 'United States', 'Canada', 'Germany', 'France', 'Australia', 'South Africa', 'United Arab Emirates', 'Netherlands', 'Italy'
]

const professions = [
  'Healthcare', 'Education', 'Finance', 'Law', 'Technology', 'Agriculture', 'Creative Arts', 'Engineering', 'Trade', 'Research'
]

export default function Members() {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [ghanaRegions, setGhanaRegions] = useState<string[]>([])
  const [regionConstituencies, setRegionConstituencies] = useState<Record<string, string[]>>({})

  const [search, setSearch] = useState('')
  const [activePlatform, setActivePlatform] = useState<'GHANA' | 'DIASPORA'>('GHANA')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedConstituency, setSelectedConstituency] = useState<string>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedProfession, setSelectedProfession] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [fetchedMembers, fetchedRegions] = await Promise.all([
          adminService.getMembers(),
          adminService.getRegions()
        ])

        const mappedMembers: Member[] = fetchedMembers.map(m => ({
          id: m.id || Math.random().toString(),
          name: m.name || 'Unnamed Patriot',
          email: m.email || '',
          phone: m.phone || '',
          platform: m.type === 'Standard' ? 'GHANA' : 'DIASPORA',
          region: m.region || '',
          constituency: m.constituency || '',
          country: m.country || 'Ghana',
          profession: m.profession || 'Patriot',
          avatarUrl: m.avatarUrl || undefined,
          status: m.status || 'Pending',
          joined: m.joined || new Date().toISOString(),
          type: m.type || 'Standard'
        }))

        const regionsArr: string[] = []
        const constMap: Record<string, string[]> = {}
        
        fetchedRegions.forEach(r => {
          if (r.name) {
            regionsArr.push(r.name)
            constMap[r.name] = r.constituencies || []
          }
        })

        setMembers(mappedMembers)
        setGhanaRegions(regionsArr)
        setRegionConstituencies(constMap)
      } catch (error) {
        console.error('[MEMBERS] Data sync failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredMembers = useMemo(() => {
    return members
      .filter(member => {
        const matchesPlatform = member.platform === activePlatform
        const matchesSearch = (member.name || '').toLowerCase().includes(search.toLowerCase())
        const matchesProfession = selectedProfession === 'all' || member.profession === selectedProfession
        
        if (activePlatform === 'GHANA') {
          const matchesRegion = selectedRegion === 'all' || member.region === selectedRegion
          const matchesConstituency = selectedConstituency === 'all' || member.constituency === selectedConstituency
          return matchesPlatform && matchesSearch && matchesRegion && matchesConstituency && matchesProfession
        } else {
          const matchesCountry = selectedCountry === 'all' || member.country === selectedCountry
          return matchesPlatform && matchesSearch && matchesCountry && matchesProfession
        }
      })
      .sort((a, b) => {
        const nameA = a.name || ''
        const nameB = b.name || ''
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
      })
  }, [members, activePlatform, search, selectedRegion, selectedConstituency, selectedCountry, selectedProfession, sortOrder])

  const constituencies = useMemo(() => {
    if (selectedRegion === 'all') return []
    return regionConstituencies[selectedRegion] || []
  }, [selectedRegion, regionConstituencies])

  const clearFilters = () => {
    setSearch('')
    setSelectedRegion('all')
    setSelectedConstituency('all')
    setSelectedCountry('all')
    setSelectedProfession('all')
  }

  const isFiltered = search !== '' || selectedRegion !== 'all' || selectedConstituency !== 'all' || selectedCountry !== 'all' || selectedProfession !== 'all'

  const FilterSection = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-10", isMobile && "px-1")}>
      <div>
        <h3 className="text-stone-900 font-bold text-sm mb-6 flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-600" />
          Find patriots
        </h3>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
          <Input
            placeholder="Name or profession..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-12 bg-white border-stone-100 rounded-none focus:ring-emerald-500 font-medium text-sm"
          />
        </div>
      </div>

      <div>
        <h3 className="text-stone-900 font-bold text-sm mb-4">Movement network</h3>
        <Tabs 
          value={activePlatform} 
          onValueChange={(val) => {
            setActivePlatform(val as 'GHANA' | 'DIASPORA');
            setSelectedRegion('all');
            setSelectedConstituency('all');
            setSelectedCountry('all');
          }}
          className="w-full"
        >
          <TabsList className="bg-stone-100 p-1 rounded-none h-12 w-full">
            <TabsTrigger value="GHANA" className="flex-1 rounded-none font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-none">Ghana</TabsTrigger>
            <TabsTrigger value="DIASPORA" className="flex-1 rounded-none font-bold text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-600 shadow-none">Diaspora</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-6">
        <h3 className="text-stone-900 font-bold text-sm">Location filters</h3>
        
        {activePlatform === 'GHANA' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-stone-400 pl-1">Region</label>
              <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); setSelectedConstituency('all'); }}>
                <SelectTrigger className="w-full bg-white border-stone-100 text-sm font-medium rounded-none h-12">
                  <SelectValue placeholder="All regions" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-stone-100">
                  <SelectItem value="all" className="text-sm font-medium">All regions</SelectItem>
                  {ghanaRegions.map(r => <SelectItem key={r} value={r} className="text-sm font-medium">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-stone-400 pl-1">Constituency</label>
              <Select value={selectedConstituency} onValueChange={setSelectedConstituency} disabled={selectedRegion === 'all'}>
                <SelectTrigger className="w-full bg-white border-stone-100 text-sm font-medium rounded-none h-12">
                  <SelectValue placeholder="All constituencies" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-stone-100">
                  <SelectItem value="all" className="text-sm font-medium">All constituencies</SelectItem>
                  {constituencies.map(c => <SelectItem key={c} value={c} className="text-sm font-medium">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-stone-400 pl-1">Country</label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full bg-white border-stone-100 text-sm font-medium rounded-none h-12">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent className="rounded-none border-stone-100">
                <SelectItem value="all" className="text-sm font-medium">All countries</SelectItem>
                {diasporaCountries.map(c => <SelectItem key={c} value={c} className="text-sm font-medium">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-[11px] font-medium text-stone-400 pl-1">Professional field</label>
          <Select value={selectedProfession} onValueChange={setSelectedProfession}>
            <SelectTrigger className="w-full bg-white border-stone-100 text-sm font-medium rounded-none h-12">
              <SelectValue placeholder="All professions" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-stone-100">
              <SelectItem value="all" className="text-sm font-medium">All professions</SelectItem>
              {professions.map(p => <SelectItem key={p} value={p} className="text-sm font-medium">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isFiltered && (
        <Button 
          variant="ghost" 
          onClick={clearFilters}
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs h-12 rounded-none border-dashed border-2 border-red-100 hover:border-red-200"
        >
          <X className="w-4 h-4 mr-2" />
          Clear all filters
        </Button>
      )}
    </div>
  )

  if (isLoading) return <LoadingScreen />

  return (
    <div className="bg-stone-50/50 min-h-screen pb-20">
      <SEO 
        title="Movement Directory"
        description="Connect with brothers and sisters committed to building a new Ghana. Search across verified members worldwide."
        canonical="/members"
      />
      
      {/* Standardized Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <Breadcrumbs />
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span className="text-micro font-medium text-emerald-600 tracking-tight">Movement network</span>
            </div>
            <h1 className="text-stone-900 text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Movement directory
            </h1>
            <BrandLine />
            <p className="text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Connect with brothers and sisters committed to building a new Ghana. Search across {members.length} verified members worldwide.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        {/* Mobile Filter Trigger */}
        <div className="lg:hidden mb-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="default" className="w-full h-14 gap-2 font-bold text-sm border-stone-200 shadow-sm active:scale-95 rounded-none">
                <Filter className="w-4 h-4" />
                Filter directory
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0 border-r-0">
              <SheetHeader className="p-6 border-b border-stone-100 text-left">
                <SheetTitle className="font-bold text-lg">Filters</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto h-full p-6 pb-24">
                <FilterSection isMobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Desktop Sidebar with separate background */}
          <aside className="hidden lg:block lg:w-[320px] shrink-0 sticky top-24 self-start">
            <div className="bg-white p-8 rounded-none border border-stone-100 shadow-sm">
              <FilterSection />
            </div>
          </aside>

          {/* Results Area - No background to let cards pop */}
          <div className="flex-1 p-8">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-stone-100">
              <p className="text-stone-400 font-bold text-xs tracking-tight">
                {filteredMembers.length} patriots found
              </p>
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-stone-600 hover:text-emerald-600 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort: {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </button>
            </div>

            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredMembers.map(member => (
                  <MemberProfileCard 
                    key={member.id} 
                    member={member} 
                    setSelectedMember={setSelectedMember} 
                  />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-stone-200" />
                </div>
                <h3 className="text-stone-900 font-bold">No patriots found</h3>
                <p className="text-stone-400 text-sm mt-2 max-w-xs mx-auto">Try adjusting your filters or search term to discover more movement members.</p>
                <Button 
                  variant="ghost" 
                  onClick={clearFilters}
                  className="mt-8 text-emerald-600 font-bold"
                >
                  Clear search parameters
                </Button>
              </div>
            )}

            {/* Quote Block */}
            <div className="mt-20 border-l-4 border-emerald-600 pl-8 py-4">
              <div className="max-w-2xl">
                <p className="text-stone-400 text-lg font-medium italic leading-relaxed">
                  "Our strength lies in our unity across borders. Every verified patriot is a pillar in the foundation of the new Ghana we are building."
                </p>
                <BrandLine className="w-24 mt-6" />
              </div>
            </div>
          </div>
        </div>
      </main>


      {/* Profile Modal */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[32px] bg-white">
          <div className="relative h-48 bg-stone-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 to-stone-900"></div>
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-[28px] bg-white p-1 shadow-2xl">
                <div className="w-full h-full rounded-[24px] bg-stone-50 flex items-center justify-center">
                   {selectedMember?.avatarUrl ? (
                     <img src={selectedMember.avatarUrl} alt="" className="w-full h-full rounded-[24px] object-cover" />
                   ) : (
                     <User className="w-10 h-10 text-stone-300" />
                   )}
                </div>
              </div>
            </div>
            <div className="absolute top-6 right-8">
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-medium flex items-center gap-2",
                (selectedMember?.status === 'Active' || selectedMember?.status === 'Approved' || !selectedMember?.status) 
                  ? "bg-emerald-500 text-white" 
                  : "bg-amber-500 text-white"
              )}>
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {(selectedMember?.status === 'Active' || selectedMember?.status === 'Approved' || !selectedMember?.status) ? 'Verified' : 'Pending'}
              </div>
            </div>
          </div>

          <div className="px-8 pt-16 pb-12">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-1">{selectedMember?.name}</h2>
              <p className="text-emerald-600 font-bold text-sm">{selectedMember?.profession}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-stone-400 tracking-tight">Network</span>
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  {selectedMember?.platform === 'GHANA' ? 'Ghana' : 'Diaspora'}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-medium text-stone-400 tracking-tight">Location</span>
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="truncate">
                    {selectedMember?.platform === 'GHANA' 
                      ? selectedMember?.region 
                      : selectedMember?.country}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              <span className="text-[10px] font-medium text-stone-400 tracking-tight">Member biography</span>
              <p className="text-stone-500 text-sm leading-relaxed font-medium">
                Committed to the growth and prosperity of Ghana. An active participant in community development projects and movement initiatives, focused on building a better future.
              </p>
            </div>

            <div className="flex gap-4">
              <Button className="flex-1 h-14 rounded-2xl bg-stone-900 text-white hover:bg-stone-800 border-none font-bold text-sm">
                <Send className="w-4 h-4 mr-2" />
                Send message
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedMember(null)}
                className="flex-1 h-14 rounded-2xl border-stone-100 font-bold text-sm"
              >
                Close profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

