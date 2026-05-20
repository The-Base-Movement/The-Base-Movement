import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { authService } from '@/services/authService'
import { toast } from 'sonner'
import SEO from '@/components/SEO'
import { useChapters } from '@/context/ChaptersContext'

import { DashboardRequestModal } from './chapters/DashboardRequestModal'
import { DashboardMobileFilterDrawer } from './chapters/DashboardMobileFilterDrawer'
import { DashboardPageHeader } from './chapters/DashboardPageHeader'
import { DashboardKpiRow } from './chapters/DashboardKpiRow'
import { DashboardMobileFilterToggle } from './chapters/DashboardMobileFilterToggle'
import { DashboardFilterControls } from './chapters/DashboardFilterControls'
import { DashboardChapterGrid } from './chapters/DashboardChapterGrid'
import { PublicHeader } from './chapters/PublicHeader'
import { PublicFilterSection } from './chapters/PublicFilterSection'
import { PublicMobileFilterDrawer } from './chapters/PublicMobileFilterDrawer'
import { PublicChapterGrid } from './chapters/PublicChapterGrid'
import { PublicRequestModal } from './chapters/PublicRequestModal'

// Using dynamic database assets via flag_url and country mapping

const GHANA_REGIONS_LIST = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

/**
 * Robustly determines which Ghana region a chapter belongs to.
 */
const getChapterRegion = (c: { region?: string | null; city_or_region: string }) => {
  if (c.region && GHANA_REGIONS_LIST.includes(c.region)) return c.region

  const city = (c.city_or_region || '').toLowerCase()
  if (!city || city === 'ghana') return null

  const matched = GHANA_REGIONS_LIST.find(
    (r) =>
      city === r.toLowerCase() || city.includes(r.toLowerCase()) || r.toLowerCase().includes(city)
  )
  if (matched) return matched

  if (city.includes('accra') || city.includes('tema')) return 'Greater Accra'
  if (city.includes('kumasi') || city.includes('obuasi')) return 'Ashanti'
  if (city.includes('takoradi') || city.includes('sekondi')) return 'Western'
  if (city.includes('tamale')) return 'Northern'
  if (city.includes('cape coast') || city.includes('winneba')) return 'Central'
  if (city.includes('koforidua')) return 'Eastern'
  if (city.includes('ho')) return 'Volta'
  if (city.includes('sunyani')) return 'Bono'
  if (city.includes('techiman')) return 'Bono East'
  if (city.includes('wa')) return 'Upper West'
  if (city.includes('bolgatanga')) return 'Upper East'

  return null
}

export default function Chapters() {
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const { chapters } = useChapters()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'ghana' | 'diaspora'>('ghana')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [regions, setRegions] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [userChapterName, setUserChapterName] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'az' | 'za' | 'members-desc' | 'members-asc'>('az')
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  // Request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [chapterLocation, setChapterLocation] = useState('')
  const [chapterDescription, setChapterDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)

  useEffect(() => {
    setRegions(['All Regions', ...GHANA_REGIONS_LIST.slice().sort()])
    const user = authService.getUser()
    if (user) adminService.getUserChapter(user.id).then(setUserChapterName)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedRegion, activeTab, sortOrder, showActiveOnly])

  const ghanaChapters = chapters.filter((c) => c.country === 'Ghana')
  const diasporaChapters = chapters.filter((c) => c.country !== 'Ghana')
  const activeChapters = activeTab === 'ghana' ? ghanaChapters : diasporaChapters
  const filteredChapters = activeChapters
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city_or_region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.country.toLowerCase().includes(searchTerm.toLowerCase())
      let matchRegion = true
      if (activeTab === 'ghana' && selectedRegion !== 'All Regions') {
        const derived = getChapterRegion(c)
        matchRegion = derived === selectedRegion
      }
      const matchStatus = showActiveOnly ? c.status === 'Active' : true
      return matchSearch && matchRegion && matchStatus
    })
    .sort((a, b) => {
      if (sortOrder === 'az') return a.name.localeCompare(b.name)
      if (sortOrder === 'za') return b.name.localeCompare(a.name)
      if (sortOrder === 'members-desc') return (b.member_count || 0) - (a.member_count || 0)
      return (a.member_count || 0) - (b.member_count || 0)
    })

  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredChapters.length / itemsPerPage)
  const paginatedChapters = filteredChapters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const success = await adminService.submitChapterApplication({
        proposed_chapter_name: chapterLocation,
        region: 'National',
        constituency: 'To be assigned',
        vision_statement: chapterDescription,
        experience_summary: 'Submitted via Chapter Request Hub',
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
    } catch {
      toast.error('Strategic communication link failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const sharedFilterProps = {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    selectedRegion,
    setSelectedRegion,
    regions,
    chapters,
    sortOrder,
    setSortOrder,
    showActiveOnly,
    setShowActiveOnly,
  }

  const sharedModalProps = {
    chapterLocation,
    setChapterLocation,
    chapterDescription,
    setChapterDescription,
    isSubmitting,
    submissionSuccess,
    onClose: () => setIsRequestModalOpen(false),
    onSubmit: handleSubmitRequest,
  }

  // ── Dashboard layout ──────────────────────────────────────────────────────
  if (isDashboard) {
    return (
      <div className="main">
        {isRequestModalOpen && <DashboardRequestModal {...sharedModalProps} />}

        {showMobileFilters && (
          <DashboardMobileFilterDrawer
            {...sharedFilterProps}
            onClose={() => setShowMobileFilters(false)}
            onRequestChapter={() => {
              setShowMobileFilters(false)
              setIsRequestModalOpen(true)
            }}
          />
        )}

        <DashboardPageHeader totalChapters={chapters.length} />

        <DashboardKpiRow
          ghanaCount={ghanaChapters.length}
          diasporaCount={diasporaChapters.length}
          totalCount={chapters.length}
          countryCount={new Set(chapters.map((c) => c.country)).size}
        />

        <DashboardMobileFilterToggle
          onOpenFilters={() => setShowMobileFilters(true)}
          onRequestChapter={() => setIsRequestModalOpen(true)}
        />

        <div className="sidebar-main" style={{ alignItems: 'start' }}>
          <div
            className="desktop-only"
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <DashboardFilterControls
              {...sharedFilterProps}
              onRequestChapter={() => setIsRequestModalOpen(true)}
            />
          </div>

          <DashboardChapterGrid
            paginatedChapters={paginatedChapters}
            userChapterName={userChapterName}
            totalPages={totalPages}
            currentPage={currentPage}
            onClearSearch={() => setSearchTerm('')}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    )
  }

  // ── Public layout ─────────────────────────────────────────────────────────
  const publicFilterProps = {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    selectedRegion,
    setSelectedRegion,
    regions,
    totalChapters: chapters.length,
    countryCount: new Set(chapters.map((c) => c.country)).size,
    onRequestChapter: () => setIsRequestModalOpen(true),
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      <SEO
        title="Movement Chapters"
        description="Connect with your local community through our global network of regional hubs."
        canonical="/chapters"
      />

      <PublicHeader totalChapters={chapters.length} />

      {showMobileFilters && (
        <PublicMobileFilterDrawer
          {...publicFilterProps}
          onClose={() => setShowMobileFilters(false)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
        <div className="lg:hidden mb-8 flex gap-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex-1 h-12 gap-2 font-bold text-xs border border-stone-200 bg-white cursor-pointer hover:bg-stone-50 flex items-center justify-center"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              filter_list
            </span>{' '}
            Filter &amp; Search
          </button>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex-1 font-bold text-xs h-12 bg-primary text-white border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add
            </span>{' '}
            Request
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:block lg:w-[320px] shrink-0 sticky top-0 self-start">
            <PublicFilterSection {...publicFilterProps} />
          </aside>
          <PublicChapterGrid
            paginatedChapters={paginatedChapters}
            filteredTotal={filteredChapters.length}
            userChapterName={userChapterName}
            totalPages={totalPages}
            currentPage={currentPage}
            onClearSearch={() => setSearchTerm('')}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>

      {isRequestModalOpen && <PublicRequestModal {...sharedModalProps} />}
    </div>
  )
}
