import { useState } from 'react'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { MapPin, Search, Plus, Filter, Building2, Send } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ChapterCard } from '@/components/ChapterCard'
import { useChapters } from '@/context/ChaptersContext'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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

export default function Chapters() {
  const { chapters } = useChapters()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'ghana' | 'diaspora'>('ghana')
  const [requestSent, setRequestSent] = useState<Record<string, boolean>>({})

  const ghanaChapters = chapters.filter(c => c.country === 'Ghana')
  const diasporaChapters = chapters.filter(c => c.country !== 'Ghana')
  
  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [chapterLocation, setChapterLocation] = useState('')
  const [chapterDescription, setChapterDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)

  const handleJoinRequest = (e: React.MouseEvent, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRequestSent(prev => ({ ...prev, [chapterId]: true }));
    // In a real app, this would send an API request to be approved by a leader
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const success = await adminService.submitChapterApplication({
        proposed_chapter_name: chapterLocation,
        region: 'National', // Default or extracted from location
        constituency: 'To be assigned',
        vision_statement: chapterDescription,
        experience_summary: 'Submitted via Chapter Request Hub'
      })

      if (success) {
        setSubmissionSuccess(true)
        setTimeout(() => {
          setIsRequestModalOpen(false)
          setSubmissionSuccess(false)
          setChapterLocation('')
          setChapterDescription('')
        }, 500)
      } else {
        toast.error('Failed to submit chapter request. Please try again.')
      }
    } catch (error) {
      console.error('[CHAPTERS] Submission failed:', error)
      toast.error('Strategic communication link failed.')
    } finally {
      setIsSubmitting(false)
    }
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
                <h1 className="text-stone-900 mb-2">
                  Movement Chapters
                </h1>
              <p className="text-stone-500 max-w-xl">
                Connect with your local community. Organize, mobilize, and build the Ghana we deserve through our global network of {chapters.length}+ regional hubs.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsRequestModalOpen(true)}
                className="bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white font-semibold tracking-widest text-xs h-12 px-6 rounded-none"
              >
                <Plus className="w-4 h-4 mr-2" /> Request a Chapter
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center border-t border-stone-100 pt-6">
            <div className="flex bg-stone-100 p-1 rounded-none w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab('ghana')}
                className={`flex-1 sm:flex-none px-6 py-2 text-[10px] font-semibold tracking-widest rounded-none transition-all ${activeTab === 'ghana' ? 'bg-white text-[var(--brand-green)] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Ghana Regional
              </button>
              <button 
                onClick={() => setActiveTab('diaspora')}
                className={`flex-1 sm:flex-none px-6 py-2 text-[10px] font-semibold tracking-widest rounded-none transition-all ${activeTab === 'diaspora' ? 'bg-white text-[var(--brand-green)] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
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
            <Button variant="default" className="h-11 px-4 border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-[1280px] mx-auto px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map((chapter) => (
            <ChapterCard 
              key={chapter.id} 
              chapter={chapter} 
              requestSent={requestSent} 
              countryFlags={countryFlags} 
              handleJoinRequest={handleJoinRequest} 
            />
          ))}
        </div>

        {/* Global Stats Footer */}
        <div className="mt-20 bg-charcoal-dark p-12 rounded-none text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-green)]/10 rounded-none -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 grid md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <p className="text-[var(--brand-green)] text-[10px] font-bold tracking-[0.3em] mb-4 uppercase">Total Chapters</p>
              <p className="text-5xl font-meta font-bold tracking-tighter leading-none mb-0">{chapters.length}</p>
            </div>
            <div>
              <p className="text-warm-gold text-[10px] font-bold tracking-[0.3em] mb-4 uppercase">Countries Represented</p>
              <p className="text-5xl font-meta font-bold tracking-tighter leading-none mb-0">{new Set(chapters.map(c => c.country)).size}</p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
                "Our strength lies in our unity across borders. Together, we build the foundations of a new Ghana."
              </p>
              <div className="flex gap-2">
                <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Request Chapter Modal */}
      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none rounded-none p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-charcoal-dark text-white relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]"></div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-[var(--brand-green)]" />
              <DialogTitle className="text-xl font-bold tracking-tight uppercase font-meta">Request a Chapter</DialogTitle>
            </div>
            <DialogDescription className="text-stone-400 text-xs">
              Propose a new chapter for your region. Requests are reviewed by the National Executive Committee for strategic alignment and leadership verification.
            </DialogDescription>
          </DialogHeader>

          {submissionSuccess ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-none flex items-center justify-center mb-2">
                <Send className="w-8 h-8 text-[var(--brand-green)]" />
              </div>
              <h3 className="text-stone-900">Request Submitted Successfully</h3>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Your proposal for the <span className="font-bold text-[var(--brand-green)]">{chapterLocation}</span> chapter has been logged. Our regional coordinators will contact you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Chapter Location / Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <Input 
                    required
                    placeholder="e.g. Kumasi, Ashanti Region or London, UK"
                    value={chapterLocation}
                    onChange={(e) => setChapterLocation(e.target.value)}
                    className="pl-10 h-12 bg-stone-50 border-stone-200 rounded-none focus:ring-brand-green font-medium text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Why start a chapter here?</label>
                <Textarea 
                  required
                  placeholder="Describe the local interest and your vision for organizing this hub..."
                  value={chapterDescription}
                  onChange={(e) => setChapterDescription(e.target.value)}
                  className="min-h-[120px] bg-stone-50 border-stone-200 rounded-none focus:ring-brand-green font-medium text-sm p-4"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="default" 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="flex items-center gap-2 text-stone-400 hover:text-[var(--brand-red)] transition-colors text-[10px] font-bold uppercase tracking-widest rounded-none"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-12 bg-[var(--brand-green)] hover:bg-[var(--brand-green)]/90 text-white font-bold text-[10px] uppercase tracking-widest rounded-none min-w-[140px]"
                >
                  {isSubmitting ? 'Processing...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
