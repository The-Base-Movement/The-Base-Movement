import { useState, useMemo, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, Search, MapPin, Users, User, ArrowUpDown, Filter, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MemberProfileCard } from '@/components/MemberProfileCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { adminService } from '@/services/adminService'
import { LoadingScreen } from '@/components/LoadingScreen'
import type { Member } from '@/types/admin'

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

        // Map members to UI format
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

        // Map regions and constituencies
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

  // Filtered and Sorted Members
  const filteredMembers = useMemo(() => {
    const sourceData = members.length > 0 ? members : [] 
    return sourceData
      .filter(member => {
        const matchesPlatform = member.platform === activePlatform
        
        // Defensive checks for search
        const memberName = member.name || ''
        const matchesSearch = memberName.toLowerCase().includes(search.toLowerCase())
        
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
        if (sortOrder === 'asc') return nameA.localeCompare(nameB)
        return nameB.localeCompare(nameA)
      })
  }, [members, activePlatform, search, selectedRegion, selectedConstituency, selectedCountry, selectedProfession, sortOrder])

  const constituencies = useMemo(() => {
    if (selectedRegion === 'all') return []
    return regionConstituencies[selectedRegion] || []
  }, [selectedRegion, regionConstituencies])

  if (isLoading) return <LoadingScreen />

  return (
    <div className="bg-stone-50/50 min-h-screen font-meta pb-20">
      {/* Header Section */}
      <section className="bg-charcoal-dark py-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[var(--brand-green)]/20 rounded-none flex items-center justify-center">
              <Users className="w-6 h-6 text-[var(--brand-green)]" />
            </div>
            <h1 className="text-white">Member <span className="text-[var(--brand-green)]">Directory</span></h1>
          </div>
          <div className="flex h-1 w-24 mb-6">
            <div className="flex-1 bg-[var(--brand-red)]"></div>
            <div className="flex-1 bg-[var(--brand-gold)]"></div>
            <div className="flex-1 bg-[var(--brand-green)]"></div>
          </div>
          <p className="text-white/60 max-w-xl mb-0">
            The Base movement is built by its people. Connect with brothers and sisters committed to Ghana's prosperity, both at home and in the diaspora.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-8 -mt-8 relative z-20">
        <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden bg-white rounded-none">
          <CardContent className="p-0">
            {/* Control Bar */}
            <div className="p-6 border-b border-slate-100 bg-white space-y-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <Tabs 
                  defaultValue="GHANA" 
                  onValueChange={(val) => {
                    setActivePlatform(val as 'GHANA' | 'DIASPORA');
                    setSelectedRegion('all');
                    setSelectedConstituency('all');
                    setSelectedCountry('all');
                  }}
                  className="w-full lg:w-auto"
                >
                  <TabsList className="bg-slate-50 p-1 h-12 w-full lg:w-auto">
                    <TabsTrigger value="GHANA" className="flex-1 lg:px-8 font-bold text-[10px] tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--brand-green)] data-[state=active]:shadow-sm rounded-none">Ghana</TabsTrigger>
                    <TabsTrigger value="DIASPORA" className="flex-1 lg:px-8 font-bold text-[10px] tracking-tight data-[state=active]:bg-white data-[state=active]:text-[var(--brand-green)] data-[state=active]:shadow-sm rounded-none">Diaspora</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex-1 w-full relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input
                    placeholder="Search by name or profession..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-12 bg-slate-50 border-none font-medium placeholder:text-slate-300 rounded-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto bg-slate-50 p-1 rounded-none">
                  <button 
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-tight text-slate-500 hover:text-[var(--brand-green)] transition-colors"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    Sort {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                  </button>
                </div>
              </div>

              {/* Sub-Filters */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-400 mr-2">
                  <Filter className="w-3 h-3" />
                  <span className="text-[10px] font-bold tracking-tight">Filter by:</span>
                </div>

                {activePlatform === 'GHANA' ? (
                  <>
                    <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); setSelectedConstituency('all'); }}>
                      <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200 text-[10px] font-bold tracking-tight rounded-none h-10">
                        <SelectValue placeholder="All regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs font-bold">All regions</SelectItem>
                        {ghanaRegions.map(r => <SelectItem key={r} value={r} className="text-xs font-bold">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Select value={selectedConstituency} onValueChange={setSelectedConstituency} disabled={selectedRegion === 'all'}>
                      <SelectTrigger className="w-full sm:w-56 bg-white border-slate-200 text-[10px] font-bold tracking-tight rounded-none h-10">
                        <SelectValue placeholder="All constituencies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs font-bold">All constituencies</SelectItem>
                        {constituencies.map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full sm:w-56 bg-white border-slate-200 text-[10px] font-bold tracking-tight rounded-none h-10">
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs font-bold">All countries</SelectItem>
                      {diasporaCountries.map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                  <SelectTrigger className="w-full sm:w-56 bg-white border-slate-200 text-[10px] font-bold tracking-tight rounded-none h-10">
                    <SelectValue placeholder="All professions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs font-bold">All professions</SelectItem>
                    {professions.map(p => <SelectItem key={p} value={p} className="text-xs font-bold">{p}</SelectItem>)}
                  </SelectContent>
                </Select>

                {(search !== '' || selectedRegion !== 'all' || selectedConstituency !== 'all' || selectedCountry !== 'all' || selectedProfession !== 'all') && (
                  <button 
                    onClick={() => {
                      setSearch('');
                      setSelectedRegion('all');
                      setSelectedConstituency('all');
                      setSelectedCountry('all');
                      setSelectedProfession('all');
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-tight text-red-500 hover:bg-red-50 rounded-none transition-all ml-auto"
                  >
                    <X className="w-3 h-3" />
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-8">
              {filteredMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMembers.map(member => (
                    <MemberProfileCard 
                      key={member.id} 
                      member={member} 
                      setSelectedMember={setSelectedMember} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-none flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-charcoal-dark">No members found</h3>
                  <p className="text-slate-400 max-w-sm mt-2">We couldn't find any members matching your current filters. Try adjusting your search criteria.</p>
                  <button 
                    onClick={() => {
                      setSearch('');
                      setSelectedRegion('all');
                      setSelectedConstituency('all');
                      setSelectedCountry('all');
                      setSelectedProfession('all');
                    }}
                    className="mt-8 text-[var(--brand-green)] font-bold text-[10px] tracking-tight hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member Profile Modal */}
      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-none bg-white">
          <DialogHeader className="p-0">
            <div className="bg-charcoal-dark p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-none bg-primary/10 border-4 border-primary/20 flex items-center justify-center mb-4 shadow-xl">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <DialogTitle className="text-white mb-1">{selectedMember?.name}</DialogTitle>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary tracking-tight">{selectedMember?.profession}</span>
                  <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-none tracking-tight">
                    {selectedMember?.status === 'Active' || selectedMember?.status === 'Approved' || !selectedMember?.status ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-accent"></div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8">
            {/* Membership Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 tracking-tight">Platform</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-primary" />
                  <p className="text-xs font-bold text-charcoal-dark mb-0">{selectedMember?.platform}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 tracking-tight mb-0">Joined date</p>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-accent" />
                  <p className="text-xs font-bold text-charcoal-dark mb-0">Oct 2024</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 tracking-tight">Location</p>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-none border border-slate-100">
                  <MapPin className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold text-charcoal-dark mb-0">
                    {selectedMember?.platform === 'GHANA' 
                      ? `${selectedMember?.constituency}, ${selectedMember?.region} Region` 
                      : `${selectedMember?.country}`}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 tracking-tight">Member bio</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Committed to the growth and prosperity of Ghana. Active participant in community development projects and movement initiatives.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <Button 
                variant="primary"
                className="flex-1 py-6 text-[10px] shadow-lg shadow-primary/20"
              >
                Send message
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setSelectedMember(null)}
                className="flex-1 py-6 text-[10px]"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
