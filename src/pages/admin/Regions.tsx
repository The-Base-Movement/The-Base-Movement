import { useState } from 'react'
import { MapPin, ChevronRight, ChevronDown, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── Mock Data ──────────────────────────────────────────────────────────────────
const regionsData = [
  {
    id: 1, name: 'Ahafo',
    constituencies: ['Asunafo North', 'Asunafo South', 'Asutifi North', 'Asutifi South', 'Tano North', 'Tano South'],
  },
  {
    id: 2, name: 'Ashanti',
    constituencies: [
      'Adansi-Asokwa', 'Fomena', 'New Edubease', 'Afigya Kwabre North', 'Afigya Kwabre South',
      'Ahafo Ano North', 'Ahafo Ano South East', 'Ahafo Ano South West', 'Akrofuom', 'Odotobri',
      'Manso Nkwanta', 'Manso Edubia', 'Asante Akim Central', 'Asante Akim North', 'Asante Akim South',
      'Asawase', 'Asokwa', 'Atwima-Kwanwoma', 'Atwima Mponua', 'Atwima-Nwabiagya South',
      'Atwima-Nwabiagya North', 'Bekwai', 'Bosome-Freho', 'Bosomtwe', 'Ejisu',
      'Ejura-Sekyedumase', 'Juaben', 'Bantama', 'Manhyia North', 'Manhyia South',
      'Nhyiaeso', 'Subin', 'Kwabre East', 'Kwadaso', 'Mampong',
      'Obuasi East', 'Obuasi West', 'Offinso South', 'Offinso North', 'Oforikrom',
      'Old Tafo', 'Sekyere Afram Plains', 'Nsuta-Kwamang-Beposo', 'Afigya Sekyere East', 'Kumawu',
      'Effiduase-Asokore', 'Suame',
    ],
  },
  {
    id: 3, name: 'Bono',
    constituencies: ['Banda Ahenkro', 'Berekum East', 'Berekum West', 'Dormaa Central', 'Dormaa East', 'Dormaa West', 'Jaman North', 'Jaman South', 'Sunyani East', 'Sunyani West', 'Tain', 'Wenchi'],
  },
  {
    id: 4, name: 'Bono East',
    constituencies: ['Atebubu-Amantin', 'Kintampo North', 'Kintampo South', 'Nkoranza North', 'Nkoranza South', 'Pru East', 'Pru West', 'Sene East', 'Sene West', 'Techiman South', 'Techiman North'],
  },
  {
    id: 5, name: 'Central',
    constituencies: [
      'Abura-Asebu-Kwamankese', 'Agona East', 'Agona West', 'Ajumako-Enyan-Essiam', 'Asikuma-Odoben-Brakwa',
      'Assin Central', 'Assin North', 'Assin South', 'Awutu-Senya East', 'Awutu-Senya West',
      'Cape Coast North', 'Cape Coast South', 'Effutu', 'Ekumfi', 'Gomoa East',
      'Gomoa Central', 'Gomoa West', 'Komenda-Edina-Eguafo-Abirem', 'Mfantseman', 'Twifo-Atii Morkwaa',
      'Hemang Lower Denkyira', 'Upper Denkyira East', 'Upper Denkyira West',
    ],
  },
  {
    id: 6, name: 'Eastern',
    constituencies: [
      'Abuakwa North', 'Abuakwa South', 'Achiase', 'Akropong', 'Akwapim South', 'Ofoase-Ayirebi',
      'Asene Akroso Manso', 'Asuogyaman', 'Atiwa East', 'Atiwa West', 'Ayensuano',
      'Akim Oda', 'Abirem', 'Akim Swedru', 'Akwatia', 'Fanteakwa North', 'Fanteakwa South',
      'Kade', 'Afram Plains North', 'Afram Plains South', 'Abetifi', 'Mpraeso', 'Nkawkaw',
      'Lower Manya', 'New Juaben North', 'New Juaben South', 'Nsawam Adoagyiri',
      'Okere', 'Suhum', 'Upper Manya', 'Upper West Akim', 'Lower West Akim', 'Yilo Krobo',
    ],
  },
  {
    id: 7, name: 'Greater Accra',
    constituencies: [
      'Ablekuma Central', 'Ablekuma North', 'Ablekuma West', 'Ablekuma South', 'Odododiodio', 'Okaikwei Central',
      'Okaikwei South', 'Ada', 'Sege', 'Adenta', 'Ashaiman', 'Ayawaso Central', 'Ayawaso East',
      'Ayawaso North', 'Ayawaso West', 'Anyaa-Sowutuom', 'Dome-Kwabenya', 'Trobu',
      'Bortianor-Ngleshie-Amanfrom', 'Domeabra-Obom', 'Amasaman', 'Korle Klottey',
      'Kpone-Katamanso', 'Krowor', 'Dade Kotopon', 'Abokobi-Madina', 'Ledzokuku',
      'Ningo-Prampram', 'Okaikwei North', 'Shai-Osudoku', 'Tema Central', 'Tema East', 'Tema West', 'Weija',
    ],
  },
  {
    id: 8, name: 'North East',
    constituencies: ['Bunkpurugu', 'Chereponi', 'Nalerigu', 'Yagaba-Kubori', 'Walewale', 'Yunyoo'],
  },
  {
    id: 9, name: 'Northern',
    constituencies: ['Gushegu', 'Karaga', 'Kpandai', 'Kumbungu', 'Mion', 'Nanton', 'Bimbilla', 'Wulensi', 'Saboba', 'Sagnarigu', 'Savelugu', 'Tamale Central', 'Tamale North', 'Tamale South', 'Yendi'],
  },
  {
    id: 10, name: 'Oti',
    constituencies: ['Krachi East', 'Krachi West', 'Krachi Nchumuru', 'Nkwanta North', 'Nkwanta South', 'Biakoye', 'Jasikan', 'Kadjebi', 'Guan'],
  },
  {
    id: 11, name: 'Savannah',
    constituencies: ['Bole', 'Sawla-Tuna-Kalba', 'Damongo', 'Daboya-Mankarigu', 'Salaga North', 'Salaga South', 'Yapei-Kusawgu'],
  },
  {
    id: 12, name: 'Upper East',
    constituencies: ['Bolgatanga Central', 'Bolgatanga East', 'Chiana-Paga', 'Navrongo Central', 'Builsa North', 'Builsa South', 'Bawku Central', 'Binduri', 'Pusiga', 'Zebilla', 'Garu', 'Tempane', 'Talensi', 'Nabdam', 'Bongo'],
  },
  {
    id: 13, name: 'Upper West',
    constituencies: ['Wa Central', 'Wa West', 'Wa East', 'Nadowli-Kaleo', 'Jirapa', 'Lambussie', 'Lawra', 'Nandom', 'Daffiama-Bussie-Issa', 'Sissala West', 'Sissala East'],
  },
  {
    id: 14, name: 'Volta',
    constituencies: ['Ho Central', 'Ho West', 'Hohoe', 'Kpando', 'North Dayi', 'South Dayi', 'Afadzato South', 'Agotime-Ziope', 'Adaklu', 'North Tongu', 'South Tongu', 'Central Tongu', 'Akatsi South', 'Akatsi North', 'Ketu South', 'Ketu North', 'Keta', 'Anlo'],
  },
  {
    id: 15, name: 'Western',
    constituencies: ['Takoradi', 'Sekondi', 'Essikado-Ketan', 'Kwesimintsim', 'Effia', 'Ahanta West', 'Mpohor', 'Shama', 'Wassa East', 'Tarkwa-Nsuaem', 'Prestea Huni-Valley', 'Evalue-Ajomoro-Gwira', 'Ellembelle', 'Jomoro'],
  },
  {
    id: 16, name: 'Western North',
    constituencies: ['Sefwi-Wiawso', 'Sefwi Akontombra', 'Bodi', 'Juaboso', 'Bia West', 'Bia East', 'Bibiani-Anhwiaso-Bekwai', 'Aowin', 'Suaman'],
  },
]

const totalConstituencies = regionsData.reduce((acc, r) => acc + r.constituencies.length, 0)

export default function AdminRegions() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRegions, setExpandedRegions] = useState<number[]>([])
  const [constituencySearch, setConstituencySearch] = useState<Record<number, string>>({})

  const toggleRegion = (id: number) => {
    setExpandedRegions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const filteredRegions = regionsData.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.constituencies.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">
            Regions & Constituencies
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Manage all 16 administrative regions and their {totalConstituencies} constituencies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Region
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-none border-stone-200 shadow-sm bg-[var(--brand-black)] text-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Regions</p>
              <p className="text-2xl font-black font-meta">16</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-stone-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[var(--brand-red)]" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Constituencies</p>
              <p className="text-2xl font-black font-meta text-[var(--brand-black)]">{totalConstituencies}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm md:col-span-2">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[var(--brand-green)]" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Avg. per Region</p>
              <p className="text-2xl font-black font-meta text-[var(--brand-black)]">
                {Math.round(totalConstituencies / 16)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search regions or constituencies..."
          className="pl-10 h-11 rounded-none border-stone-200"
        />
      </div>

      {/* Regions List */}
      <div className="space-y-3">
        {filteredRegions.length === 0 ? (
          <div className="py-20 text-center text-stone-400 text-sm font-bold uppercase tracking-widest">
            No results found.
          </div>
        ) : (
          filteredRegions.map((region) => {
            const isExpanded = expandedRegions.includes(region.id)
            const cSearch = constituencySearch[region.id] || ''
            const visibleConstituencies = region.constituencies.filter(c =>
              c.toLowerCase().includes(cSearch.toLowerCase())
            )

            return (
              <Card key={region.id} className="rounded-none border-stone-200 shadow-sm overflow-hidden">
                {/* Region Header Row */}
                <button
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition-colors group"
                  onClick={() => toggleRegion(region.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-8 h-8 flex items-center justify-center transition-colors",
                      isExpanded ? "bg-[var(--brand-black)] text-white" : "bg-stone-100 text-stone-500 group-hover:bg-stone-200"
                    )}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-tight text-[var(--brand-black)]">
                        {region.name}
                      </p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                        {region.constituencies.length} Constituencies
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Action buttons — stop propagation so they don't toggle expand */}
                    <button
                      className="p-1.5 rounded text-stone-300 hover:text-[var(--brand-black)] hover:bg-stone-100 transition-colors"
                      onClick={e => { e.stopPropagation(); alert(`Edit ${region.name}`) }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded text-stone-300 hover:text-[var(--brand-red)] hover:bg-red-50 transition-colors"
                      onClick={e => { e.stopPropagation(); alert(`Delete ${region.name}`) }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-stone-400" />
                      : <ChevronRight className="w-4 h-4 text-stone-400" />
                    }
                  </div>
                </button>

                {/* Expanded: Constituency Grid */}
                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 px-6 py-5 space-y-4">
                    {/* Constituency search */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                        <Input
                          value={cSearch}
                          onChange={e => setConstituencySearch(prev => ({ ...prev, [region.id]: e.target.value }))}
                          placeholder="Filter constituencies..."
                          className="pl-9 h-9 rounded-none border-stone-200 text-xs"
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="h-9 px-4 text-[9px] font-black uppercase tracking-widest rounded-none border-stone-200"
                      >
                        <Plus className="w-3 h-3 mr-1.5" /> Add Constituency
                      </Button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
                      {visibleConstituencies.map(con => (
                        <div
                          key={con}
                          className="group flex items-center justify-between gap-1 px-3 py-2 bg-white border border-stone-200 hover:border-[var(--brand-black)] transition-colors"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-tight text-stone-600 group-hover:text-[var(--brand-black)] truncate">
                            {con}
                          </span>
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => alert(`Edit constituency: ${con}`)}
                          >
                            <Edit2 className="w-2.5 h-2.5 text-stone-400 hover:text-[var(--brand-black)]" />
                          </button>
                        </div>
                      ))}
                      {visibleConstituencies.length === 0 && (
                        <p className="col-span-full text-center text-[10px] text-stone-400 uppercase tracking-widest py-4">
                          No match.
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
