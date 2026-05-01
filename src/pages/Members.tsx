import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Globe, Search, MapPin, Users, User, ArrowUpDown, Filter, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ghanaRegions = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
  'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
]

const regionConstituencies: Record<string, string[]> = {
  'Ahafo': ['Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'],
  'Ashanti': ['Adansi-Asokwa', 'Fomena', 'New Edubease', 'Afigya Kwabre North', 'Afigya Kwabre South', 'Asawase', 'Asokwa', 'Bantama', 'Suame', 'Mampong'],
  'Greater Accra': ['Ablekuma Central', 'Ablekuma North', 'Ablekuma West', 'Adenta', 'Ashaiman', 'Ayawaso Central', 'Ayawaso West', 'Dome-Kwabenya', 'Madina', 'Tema Central'],
  'Northern': ['Gushegu', 'Karaga', 'Kpandai', 'Kumbungu', 'Tamale Central', 'Sagnarigu', 'Savelugu'],
  // ... adding a few more for demo
}

const diasporaCountries = [
  'United Kingdom', 'United States', 'Canada', 'Germany', 'France', 'Australia', 'South Africa', 'United Arab Emirates', 'Netherlands', 'Italy'
]

const professions = [
  'Healthcare', 'Education', 'Finance', 'Law', 'Technology', 'Agriculture', 'Creative Arts', 'Engineering', 'Trade', 'Research'
]

interface Member {
  id: number
  name: string
  platform: 'GHANA' | 'DIASPORA'
  region: string | null
  constituency: string | null
  country: string
  profession: string
  avatar: string | null
}

// Mock data for members
const mockMembers: Member[] = [
  { id: 1, name: 'Abena Mensah', platform: 'GHANA', region: 'Greater Accra', constituency: 'Madina', country: 'Ghana', profession: 'Healthcare', avatar: null },
  { id: 2, name: 'Kwesi Osei', platform: 'GHANA', region: 'Ashanti', constituency: 'Bantama', country: 'Ghana', profession: 'Education', avatar: null },
  { id: 3, name: 'John Smith', platform: 'DIASPORA', region: null, constituency: null, country: 'United Kingdom', profession: 'Finance', avatar: null },
  { id: 4, name: 'Ama Adow', platform: 'GHANA', region: 'Greater Accra', constituency: 'Adenta', country: 'Ghana', profession: 'Law', avatar: null },
  { id: 5, name: 'Sarah Wilson', platform: 'DIASPORA', region: null, constituency: null, country: 'United States', profession: 'Technology', avatar: null },
  { id: 6, name: 'Kojo Antwi', platform: 'GHANA', region: 'Northern', constituency: 'Tamale Central', country: 'Ghana', profession: 'Agriculture', avatar: null },
  { id: 7, name: 'Ekow Eshun', platform: 'DIASPORA', region: null, constituency: null, country: 'Canada', profession: 'Creative Arts', avatar: null },
  { id: 8, name: 'Baaba Yankah', platform: 'GHANA', region: 'Central', constituency: 'Cape Coast South', country: 'Ghana', profession: 'Engineering', avatar: null },
  { id: 9, name: 'Michael Boateng', platform: 'GHANA', region: 'Ashanti', constituency: 'Suame', country: 'Ghana', profession: 'Trade', avatar: null },
  { id: 10, name: 'Grace Ofori', platform: 'DIASPORA', region: null, constituency: null, country: 'Germany', profession: 'Research', avatar: null },
]

export default function Members() {
  const [search, setSearch] = useState('')
  const [activePlatform, setActivePlatform] = useState<'GHANA' | 'DIASPORA'>('GHANA')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedConstituency, setSelectedConstituency] = useState<string>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedProfession, setSelectedProfession] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  // Filtered and Sorted Members
  const filteredMembers = useMemo(() => {
    return mockMembers
      .filter(member => {
        const matchesPlatform = member.platform === activePlatform
        const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase())
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
        if (sortOrder === 'asc') return a.name.localeCompare(b.name)
        return b.name.localeCompare(a.name)
      })
  }, [activePlatform, search, selectedRegion, selectedConstituency, selectedCountry, selectedProfession, sortOrder])

  const constituencies = useMemo(() => {
    if (selectedRegion === 'all') return []
    return regionConstituencies[selectedRegion] || []
  }, [selectedRegion])

  return (
    <div className="bg-stone-50/50 min-h-screen font-meta pb-20">
      {/* Header Section */}
      <section className="bg-charcoal-dark py-16 px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-green/20 rounded-none flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-green" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Member <span className="text-brand-green">Directory</span></h1>
          </div>
          <div className="flex h-1 w-24 mb-6">
            <div className="flex-1 bg-[#CE1126]"></div>
            <div className="flex-1 bg-[#DAA520]"></div>
            <div className="flex-1 bg-[#006B3F]"></div>
          </div>
          <p className="text-white/60 max-w-xl text-sm md:text-base font-medium leading-relaxed">
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
                    <TabsTrigger value="GHANA" className="flex-1 lg:px-8 font-bold text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-brand-green data-[state=active]:shadow-sm rounded-none">Ghana</TabsTrigger>
                    <TabsTrigger value="DIASPORA" className="flex-1 lg:px-8 font-bold text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-brand-green data-[state=active]:shadow-sm rounded-none">Diaspora</TabsTrigger>
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
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest text-slate-500 hover:text-brand-green transition-colors"
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
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filter By:</span>
                </div>

                {activePlatform === 'GHANA' ? (
                  <>
                    <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); setSelectedConstituency('all'); }}>
                      <SelectTrigger className="w-full sm:w-48 bg-white border-slate-200 text-[10px] font-bold tracking-widest rounded-none h-10">
                        <SelectValue placeholder="All Regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs uppercase font-bold">All Regions</SelectItem>
                        {ghanaRegions.map(r => <SelectItem key={r} value={r} className="text-xs uppercase font-bold">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Select value={selectedConstituency} onValueChange={setSelectedConstituency} disabled={selectedRegion === 'all'}>
                      <SelectTrigger className="w-full sm:w-56 bg-white border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-lg h-10">
                        <SelectValue placeholder="All Constituencies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs uppercase font-bold">All Constituencies</SelectItem>
                        {constituencies.map(c => <SelectItem key={c} value={c} className="text-xs uppercase font-bold">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full sm:w-56 bg-white border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-lg h-10">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs uppercase font-bold">All Countries</SelectItem>
                      {diasporaCountries.map(c => <SelectItem key={c} value={c} className="text-xs uppercase font-bold">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                  <SelectTrigger className="w-full sm:w-56 bg-white border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-lg h-10">
                    <SelectValue placeholder="All Professions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs uppercase font-bold">All Professions</SelectItem>
                    {professions.map(p => <SelectItem key={p} value={p} className="text-xs uppercase font-bold">{p}</SelectItem>)}
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
                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest text-red-500 hover:bg-red-50 rounded-none transition-all ml-auto"
                  >
                    <X className="w-3 h-3" />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-8">
              {filteredMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMembers.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="group relative p-[1px] transition-all duration-500 hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-brand-green/10"
                    >
                      {/* Ghana First Gradient Border */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#CE1126] via-[#DAA520] to-[#006B3F] opacity-30 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <Card className="relative border-none shadow-none bg-white rounded-none overflow-hidden h-full">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-none bg-brand-green/5 border border-brand-green/10 flex items-center justify-center shrink-0 group-hover:bg-brand-green transition-colors duration-500">
                              <User className="w-7 h-7 text-brand-green group-hover:text-white transition-colors duration-500" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-charcoal-dark truncate tracking-tight">{member.name}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{member.profession}</p>
                            </div>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                            <div className="flex items-center gap-2 text-slate-500">
                              <MapPin className="w-3 h-3 text-brand-green" />
                              <span className="text-[10px] font-bold uppercase tracking-tight truncate">
                                {member.platform === 'GHANA' ? `${member.constituency}, ${member.region}` : member.country}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <Globe className="w-3 h-3 text-warm-gold" />
                              <span className="text-[10px] font-bold uppercase tracking-tight">{member.platform} PLATFORM</span>
                            </div>
                          </div>

                          <div className="mt-6">
                            <button className="w-full py-2.5 bg-slate-50 group-hover:bg-brand-green group-hover:text-white text-[9px] font-bold tracking-[0.2em] rounded-none transition-all">
                              View Profile
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-none flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-xl font-black text-charcoal-dark uppercase tracking-tight">No Members Found</h3>
                  <p className="text-slate-400 max-w-sm mt-2 text-sm font-medium">We couldn't find any members matching your current filters. Try adjusting your search criteria.</p>
                  <button 
                    onClick={() => {
                      setSearch('');
                      setSelectedRegion('all');
                      setSelectedConstituency('all');
                      setSelectedCountry('all');
                      setSelectedProfession('all');
                    }}
                    className="mt-8 text-brand-green font-black text-[10px] uppercase tracking-widest hover:underline"
                  >
                    Reset All Filters
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
                <div className="w-24 h-24 rounded-none bg-brand-green/10 border-4 border-brand-green/20 flex items-center justify-center mb-4 shadow-xl">
                  <User className="w-12 h-12 text-brand-green" />
                </div>
                <DialogTitle className="text-2xl font-bold text-white tracking-tight mb-1">{selectedMember?.name}</DialogTitle>
                <span className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em]">{selectedMember?.profession}</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-warm-gold"></div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-8">
            {/* Membership Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Platform</p>
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-brand-green" />
                  <p className="text-xs font-black text-charcoal-dark uppercase">{selectedMember?.platform}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Joined Date</p>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-warm-gold" />
                  <p className="text-xs font-black text-charcoal-dark uppercase">Oct 2024</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-none border border-slate-100">
                  <MapPin className="w-4 h-4 text-brand-green" />
                  <p className="text-xs font-bold text-charcoal-dark uppercase">
                    {selectedMember?.platform === 'GHANA' 
                      ? `${selectedMember?.constituency}, ${selectedMember?.region} Region` 
                      : `${selectedMember?.country}`}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Member Bio</p>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Committed to the growth and prosperity of Ghana. Active participant in community development projects and movement initiatives.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button className="flex-1 py-4 bg-brand-green text-white text-[10px] font-bold tracking-widest rounded-none shadow-lg shadow-brand-green/20 hover:opacity-90 transition-all">
                Send Message
              </button>
              <button 
                onClick={() => setSelectedMember(null)}
                className="flex-1 py-4 bg-slate-50 text-slate-400 text-[10px] font-bold tracking-widest rounded-none hover:bg-slate-100 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
