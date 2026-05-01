import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Users, Search, Plus, Filter, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { allChapters } from '@/data/chaptersData'

// Flag mapping for diaspora chapters
const countryFlags: Record<string, string> = {
  'Germany': '🇩🇪',
  'United Kingdom': '🇬🇧',
  'Australia': '🇦🇺',
  'United States': '🇺🇸',
  'Austria': '🇦🇹',
  'Belgium': '🇧🇪',
  'Brazil': '🇧🇷',
  'Burkina Faso': '🇧🇫',
  'Cameroon': '🇨🇲',
  'Canada': '🇨🇦',
  'China': '🇨🇳',
  'Czech Republic': '🇨🇿',
  'Denmark': '🇩🇰',
  'Egypt': '🇪🇬',
  'Finland': '🇫🇮',
  'France': '🇫🇷',
  'India': '🇮🇳',
  'Ireland': '🇮🇪',
  'Israel': '🇮🇱',
  'Italy': '🇮🇹',
  'Ivory Coast': '🇨🇮',
  'Japan': '🇯🇵',
  'Kenya': '🇰🇪',
  'Kuwait': '🇰🇼',
  'Luxembourg': '🇱🇺',
  'Malaysia': '🇲🇾',
  'Mexico': '🇲🇽',
  'Morocco': '🇲🇦',
  'Netherlands': '🇳🇱',
  'New Zealand': '🇳🇿',
  'Nigeria': '🇳🇬',
  'Norway': '🇳🇴',
  'Poland': '🇵🇱',
  'Portugal': '🇵🇹',
  'Qatar': '🇶🇦',
  'Russia': '🇷🇺',
  'Saudi Arabia': '🇸🇦',
  'Senegal': '🇸🇳',
  'Singapore': '🇸🇬',
  'South Africa': '🇿🇦',
  'South Korea': '🇰🇷',
  'Spain': '🇪🇸',
  'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭',
  'Tanzania': '🇹🇿',
  'Thailand': '🇹🇭',
  'Togo': '🇹🇬',
  'Turkey': '🇹🇷',
  'United Arab Emirates': '🇦🇪'
}

const ghanaChapters = allChapters.filter(c => c.country === 'Ghana');
const diasporaChapters = allChapters.filter(c => c.country !== 'Ghana');

export default function Chapters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'ghana' | 'diaspora'>('ghana')
  const [requestSent, setRequestSent] = useState<Record<string, boolean>>({})

  const handleJoinRequest = (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRequestSent(prev => ({ ...prev, [chapterId]: true }));
    // In a real app, this would send an API request to be approved by a leader
  }

  const filteredChapters = (activeTab === 'ghana' ? ghanaChapters : diasporaChapters).filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.city_or_region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-8 py-6">
          <Breadcrumbs />
          <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
                <h1 className="text-4xl font-bold text-stone-900 tracking-tighter font-meta mb-2">
                  Movement Chapters
                </h1>
              <p className="text-stone-500 max-w-xl text-sm leading-relaxed">
                Connect with your local community. Organize, mobilize, and build the Ghana we deserve through our global network of {allChapters.length}+ regional hubs.
              </p>
            </div>
            <div className="flex gap-3">
              <Button className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold tracking-widest text-xs h-12 px-6 rounded-none">
                <Plus className="w-4 h-4 mr-2" /> Start a Chapter
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center border-t border-stone-100 pt-6">
            <div className="flex bg-stone-100 p-1 rounded-none w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab('ghana')}
                className={`flex-1 sm:flex-none px-6 py-2 text-[10px] font-semibold tracking-widest rounded-none transition-all ${activeTab === 'ghana' ? 'bg-white text-brand-green shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Ghana Regional
              </button>
              <button 
                onClick={() => setActiveTab('diaspora')}
                className={`flex-1 sm:flex-none px-6 py-2 text-[10px] font-semibold tracking-widest rounded-none transition-all ${activeTab === 'diaspora' ? 'bg-white text-brand-green shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Global Diaspora
              </button>
            </div>
            
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text"
                placeholder="Search by city, region or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-stone-100 border-none rounded-none text-sm focus:ring-1 focus:ring-brand-green transition-all"
              />
            </div>
            <Button variant="outline" className="h-11 px-4 border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter) => (
            <Link 
              key={chapter.id} 
              to={`/dashboard/chapters/${chapter.id}`}
              className="group bg-white border border-stone-200 rounded-none overflow-hidden hover:shadow-xl hover:border-brand-green transition-all duration-500 flex flex-col"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-[#CE1126] via-[#DAA520] to-[#006B3F] opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-stone-50 rounded-none flex items-center justify-center text-stone-400 group-hover:text-brand-green transition-colors">
                    {chapter.country === 'Ghana' ? <MapPin className="w-6 h-6" /> : <span className="text-2xl">{countryFlags[chapter.country] || '🌍'}</span>}
                  </div>
                  <span className={`px-3 py-1 rounded-none text-[10px] font-semibold tracking-widest ${
                    requestSent[chapter.id] 
                      ? 'bg-amber-50 text-amber-600'
                      : chapter.status === 'Active' || chapter.status === 'Member' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-stone-50 text-stone-600'
                  }`}>
                    {requestSent[chapter.id] ? 'Request Pending' : chapter.status}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-stone-900 tracking-tighter font-meta mb-1 group-hover:text-brand-green transition-colors">
                  {chapter.name}
                </h3>
                <p className="text-stone-400 text-[10px] font-semibold tracking-[0.2em] mb-6 uppercase">
                  {chapter.city_or_region}, {chapter.country}
                </p>
                
                <div className="space-y-4 pt-6 border-t border-stone-50 mt-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Strength</span>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-brand-green" />
                      <span className="text-sm font-semibold text-stone-700">{chapter.membersCount}</span>
                    </div>
                  </div>
                </div>
                
                {chapter.status === 'Join Chapter' && !requestSent[chapter.id] ? (
                  <button 
                    onClick={(e) => handleJoinRequest(e, chapter.id)}
                    className="w-full mt-8 h-12 border border-brand-green bg-brand-green text-white rounded-none text-[10px] font-semibold tracking-widest hover:bg-white hover:text-brand-green transition-all flex items-center justify-center gap-2"
                  >
                    Join Chapter <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <div className={`w-full mt-8 h-12 border rounded-none text-[10px] font-semibold tracking-widest transition-all flex items-center justify-center gap-2 ${
                    requestSent[chapter.id] 
                      ? 'border-amber-200 bg-amber-50 text-amber-600' 
                      : 'border-stone-100 text-stone-400 group-hover:bg-brand-green group-hover:text-white group-hover:border-brand-green'
                  }`}>
                    {requestSent[chapter.id] ? 'Request Sent' : 'View Details'} <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Global Stats Footer */}
        <div className="mt-20 bg-charcoal-dark p-12 rounded-none text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-none -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 grid md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <p className="text-brand-green text-[10px] font-semibold tracking-[0.3em] mb-4 uppercase">Total Chapters</p>
              <p className="text-5xl font-meta font-bold tracking-tighter">{allChapters.length}</p>
            </div>
            <div>
              <p className="text-warm-gold text-[10px] font-semibold tracking-[0.3em] mb-4 uppercase">Countries Represented</p>
              <p className="text-5xl font-meta font-bold tracking-tighter">{new Set(allChapters.map(c => c.country)).size}</p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
                "Our strength lies in our unity across borders. Together, we build the foundations of a new Ghana."
              </p>
              <div className="flex gap-2">
                <div className="w-8 h-1 bg-[#CE1126]"></div>
                <div className="w-8 h-1 bg-[#DAA520]"></div>
                <div className="w-8 h-1 bg-[#006B3F]"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
