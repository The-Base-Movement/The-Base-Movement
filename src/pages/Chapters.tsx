import { useState } from 'react'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { MapPin, Search, Plus, Building2, Send, Globe } from 'lucide-react'
import { BrandLine } from '@/components/ui/BrandLine'
import { Button } from '@/components/ui/neon-button'
import SEO from '@/components/SEO'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ChapterCard } from '@/components/ChapterCard'
import { useChapters } from '@/context/ChaptersContext'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import { Filter } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const success = await adminService.submitChapterApplication({
        proposed_chapter_name: chapterLocation,
        region: 'National',
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

  // Pagination Logic
  const itemsPerPage = 12;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage);
  const paginatedChapters = filteredChapters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to first page when filtering
  useState(() => {
    setCurrentPage(1);
  });

  const FilterSection = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={cn("space-y-8", isMobile && "pb-20")}>
      <div className={cn("bg-white p-6 shadow-sm", !isMobile && "border border-stone-200")}>
        <h3 className="text-tiny font-bold text-stone-400 normal-case tracking-tight mb-6">Chapter Filters</h3>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-tiny font-medium tracking-tight text-stone-500">Search Chapters</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input 
                type="text"
                placeholder="City, region, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-stone-50 border border-stone-200 rounded-none text-xs focus:ring-1 focus:ring-brand-green outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-tiny font-medium tracking-tight text-stone-500">Region Selection</p>
            <div className="flex flex-col gap-2">
              <Button
                variant={activeTab === 'ghana' ? 'active-tab' : 'default'}
                onClick={() => setActiveTab('ghana')}
                className={cn(
                  "w-full h-12 justify-between px-4 text-tiny font-bold tracking-tight border rounded-none transition-all shadow-sm active:scale-95",
                  activeTab === 'ghana' ? '!text-white' : 'text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50'
                )}
              >
                Ghana Regional
                <Building2 className={cn("w-4 h-4", activeTab === 'ghana' ? "text-white" : "text-stone-300")} />
              </Button>
              <Button 
                variant={activeTab === 'diaspora' ? 'active-tab' : 'default'}
                onClick={() => setActiveTab('diaspora')}
                className={cn(
                  "w-full h-12 justify-between px-4 text-tiny font-bold tracking-tight border rounded-none transition-all shadow-sm active:scale-95",
                  activeTab === 'diaspora' ? '!text-white' : 'text-stone-500 border-stone-200 hover:text-brand-green hover:bg-stone-50'
                )}
              >
                Global Diaspora
                <Globe className={cn("w-4 h-4", activeTab === 'diaspora' ? "text-white" : "text-stone-300")} />
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <Button 
              variant="accent"
              onClick={() => setIsRequestModalOpen(true)}
              className="w-full font-bold tracking-tight text-tiny h-12 px-6 rounded-none shadow-sm normal-case transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" /> Request a Chapter
            </Button>
            <p className="text-micro text-stone-400 font-bold tracking-tight mt-3 text-center italic">
              Don't see your region? Propose a new hub.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-charcoal-dark p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--brand-green)]/10 -mr-12 -mt-12 blur-2xl"></div>
        <div className="relative z-10 space-y-4">
          <div>
            <p className="text-[var(--brand-green)] text-micro font-bold tracking-tight normal-case">Global Network</p>
            <p className="text-3xl font-meta font-bold tracking-tight mt-1">{chapters.length}</p>
            <p className="text-micro text-stone-400 font-bold tracking-tight">Active Chapters</p>
          </div>
          <div className="h-px bg-white/10" />
          <div>
            <p className="text-warm-gold text-micro font-bold tracking-tight normal-case">Global Presence</p>
            <p className="text-3xl font-meta font-bold tracking-tight mt-1">{new Set(chapters.map(c => c.country)).size}</p>
            <p className="text-micro text-stone-400 font-bold tracking-tight">Active Countries</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50/50 pb-20">
      <SEO 
        title="Movement Chapters"
        description="Connect with your local community. Organize, mobilize, and build the Ghana we deserve through our global network of regional hubs."
        canonical="/chapters"
      />
      <div className="bg-white border-b border-stone-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />
          <div className="mt-4">
            <h1 className="text-stone-900 text-4xl md:text-5xl font-meta font-bold tracking-tighter mb-6 flex items-center gap-4">
              Movement Chapters
            </h1>
            <BrandLine />
            <p className="text-stone-500 max-w-2xl mt-6 leading-relaxed font-medium text-sm md:text-base">
              Connect with your local community. Organize, mobilize, and build the Ghana we deserve through our global network of {chapters.length}+ regional hubs.
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="lg:hidden mb-8 flex gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="default" className="flex-1 h-12 gap-2 font-bold tracking-tight text-xs border-stone-200 shadow-sm active:scale-95">
                <Filter className="w-4 h-4" />
                Filter & Search
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 border-r-0">
              <SheetHeader className="p-6 border-b border-stone-100">
                <SheetTitle className="font-meta font-bold tracking-tight text-lg">Filters</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto h-full p-6">
                <FilterSection isMobile />
              </div>
            </SheetContent>
          </Sheet>
          
          <Button 
            variant="primary"
            onClick={() => setIsRequestModalOpen(true)}
            className="flex-1 font-bold text-xs h-12 rounded-none"
          >
            <Plus className="w-4 h-4 mr-2" /> Request
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:block lg:w-[320px] shrink-0 lg:sticky lg:top-8 lg:self-start">
            <FilterSection />
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedChapters.map((chapter) => (
                <ChapterCard 
                  key={chapter.id} 
                  chapter={chapter} 
                  requestSent={requestSent} 
                  countryFlags={countryFlags} 
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-12 pt-12 border-t border-stone-100">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={cn("cursor-pointer", currentPage === 1 && "opacity-30 pointer-events-none")}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          isActive={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className="cursor-pointer font-bold tracking-tight"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={cn("cursor-pointer", currentPage === totalPages && "opacity-30 pointer-events-none")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {filteredChapters.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-stone-200">
                <Building2 className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                <p className="text-stone-400 font-bold tracking-tight">No strategic hubs found matching your query.</p>
                <Button 
                  variant="ghost" 
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-brand-green font-bold text-xs"
                >
                  Clear search parameters
                </Button>
              </div>
            )}

            <div className="mt-20 border-l-4 border-primary pl-8 py-4">
              <p className="text-muted-foreground/80 text-lg leading-relaxed italic max-w-2xl font-body-md">
                "Our strength lies in our unity across borders. Together, we build the foundations of a new Ghana. Every chapter is a pillar of our collective destiny."
              </p>
              <div className="mt-6 h-1 w-24 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]" />
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-none rounded-none p-0 overflow-hidden bg-white">
          <DialogHeader className="p-8 bg-charcoal-dark text-white relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand-red)] via-[var(--brand-gold)] to-[var(--brand-green)]"></div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-[var(--brand-green)]" />
              <DialogTitle className="text-xl font-bold tracking-tight font-meta normal-case">Request a chapter</DialogTitle>
            </div>
            <DialogDescription className="text-stone-400 text-xs font-bold tracking-tight">
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
                <label className="text-micro font-bold text-stone-400 tracking-tight">Chapter location / country</label>
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
                <label className="text-micro font-bold text-stone-400 tracking-tight">Why start a chapter here?</label>
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
                  className="flex items-center gap-2 text-stone-400 hover:text-[var(--brand-red)] transition-colors text-micro font-bold tracking-tight rounded-none"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={isSubmitting}
                  className="h-12 font-bold text-micro tracking-tight rounded-none min-w-[140px]"
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
