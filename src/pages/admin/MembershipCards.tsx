import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import MembershipCard from '@/components/MembershipCard'
import { useGhanaRegions } from '@/hooks/useGhanaRegions'
import { constituencyService } from '@/services/constituencyService'
import { adminService } from '@/services/adminService'
import {
  getBulkCardMembers,
  updateMemberPhoto,
  downloadBulkCardsZip,
  downloadBulkIndividualPngs,
  downloadBulkCardsPdf,
  captureElementToPngBlob,
  type CardMember,
} from '@/services/cardBulkService'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

const COUNTRY_OPTIONS = [
  'ALL',
  'Ghana',
  'United Kingdom',
  'United States',
  'Canada',
  'Germany',
  'South Africa',
  'Nigeria',
  'Australia',
  'France',
  'China',
  'Other',
]

export default function MembershipCards() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const PAGE_SIZE = 50

  // Filters state initialized from URL query params
  const [platformFilter, setPlatformFilter] = useState<'ALL' | 'GHANA' | 'DIASPORA'>(
    (searchParams.get('platform') as 'ALL' | 'GHANA' | 'DIASPORA') || 'ALL'
  )
  const [regionFilter, setRegionFilter] = useState(searchParams.get('region') || 'ALL')
  const [constituencyFilter, setConstituencyFilter] = useState(searchParams.get('constituency') || 'ALL')
  const [countryFilter, setCountryFilter] = useState(searchParams.get('country') || 'ALL')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [photosOnly, setPhotosOnly] = useState(searchParams.get('photosOnly') === '1')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10) || 1)
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'reg_asc' | 'joined_desc'>(
    (searchParams.get('sort') as 'name_asc' | 'name_desc' | 'reg_asc' | 'joined_desc') || 'name_asc'
  )

  // Data state
  const [members, setMembers] = useState<CardMember[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Dynamic dropdown options
  const regions = useGhanaRegions()
  const [constituencyOptions, setConstituencyOptions] = useState<string[]>([])

  // Download & Progress state
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [progressPct, setProgressPct] = useState(0)

  // Photo Update Modal state
  const [photoModalMember, setPhotoModalMember] = useState<CardMember | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  // Map of member ID -> HTML element for html2canvas rendering
  const cardElementRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Lead scoping check
  const currentUser = adminService.getCurrentUser()
  const userRole = (currentUser?.role || '') as string
  const isConstituencyLead = userRole === 'CONSTITUENCY_LEAD'
  const isChapterLead =
    userRole === 'CHAPTER_LEAD' ||
    userRole === 'BASE_DIASPORA_LEAD' ||
    userRole === 'DIASPORA_AFFAIRS_OFFICER'

  useEffect(() => {
    constituencyService
      .listNames()
      .then((items) => setConstituencyOptions(['ALL', ...items.map((c) => c.name)]))
      .catch((err) => console.error('[MEMBERSHIP-CARDS] Failed to load constituencies:', err))
  }, [])

  // Auto-set initial filters if lead user
  useEffect(() => {
    if (isConstituencyLead && currentUser?.constituency) {
      setConstituencyFilter(currentUser.constituency)
      if (currentUser.region) setRegionFilter(currentUser.region)
      setPlatformFilter('GHANA')
    } else if (isChapterLead && (currentUser?.country || currentUser?.chapter)) {
      if (currentUser.country) setCountryFilter(currentUser.country)
      setPlatformFilter('DIASPORA')
    }
  }, [isConstituencyLead, isChapterLead, currentUser])

  // Reset to page 1 whenever filters change
  const handleFilterChange = (setter: () => void) => {
    setter()
    setPage(1)
  }

  // Fetch members when filters, page, or search change
  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const res = await getBulkCardMembers({
        platform: platformFilter,
        region: regionFilter,
        constituency: constituencyFilter,
        country: countryFilter,
        search: searchQuery,
        photosOnly,
        sortBy,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })

      if (active) {
        setMembers(res.members)
        setTotalCount(res.totalCount)
        setSelectedIds(new Set(res.members.map((m) => m.id)))
        setLoading(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [platformFilter, regionFilter, constituencyFilter, countryFilter, searchQuery, photosOnly, sortBy, page])

  // Synchronize URL search params
  useEffect(() => {
    const params = new URLSearchParams()
    if (platformFilter !== 'ALL') params.set('platform', platformFilter)
    if (regionFilter !== 'ALL') params.set('region', regionFilter)
    if (constituencyFilter !== 'ALL') params.set('constituency', constituencyFilter)
    if (countryFilter !== 'ALL') params.set('country', countryFilter)
    if (searchQuery) params.set('search', searchQuery)
    if (photosOnly) params.set('photosOnly', '1')
    if (page > 1) params.set('page', page.toString())
    if (sortBy !== 'name_asc') params.set('sort', sortBy)
    setSearchParams(params, { replace: true })
  }, [platformFilter, regionFilter, constituencyFilter, countryFilter, searchQuery, photosOnly, page, sortBy, setSearchParams])

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(members.map((m) => m.id)))
    }
  }

  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Get array of selected card elements for capture
  const getSelectedCardRefs = () => {
    const list: { member: CardMember; element: HTMLElement }[] = []
    members.forEach((m) => {
      if (selectedIds.has(m.id)) {
        const el = cardElementRefs.current.get(m.id)
        if (el) list.push({ member: m, element: el })
      }
    })
    return list
  }

  // Bulk ZIP download
  const handleBulkZipDownload = async () => {
    const targetCards = getSelectedCardRefs()
    if (targetCards.length === 0) {
      toast.error('Please select at least one member card to download')
      return
    }

    setIsProcessing(true)
    setProgressMsg('Rendering digital cards...')
    setProgressPct(0)

    try {
      const zipBlob = await downloadBulkCardsZip(targetCards, (curr, total) => {
        const pct = Math.round((curr / total) * 100)
        setProgressPct(pct)
        setProgressMsg(`Generating card ${curr} of ${total} (${pct}%)`)
      })

      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `The_Base_Membership_Cards_${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Successfully downloaded ${targetCards.length} membership cards (ZIP)`)
    } catch (err: unknown) {
      console.error('[BULK-CARDS] Download failed:', err)
      toast.error('Failed to generate ZIP archive')
    } finally {
      setIsProcessing(false)
    }
  }

  // Bulk direct individual PNG download
  const handleBulkDirectPngDownload = async () => {
    const targetCards = getSelectedCardRefs()
    if (targetCards.length === 0) {
      toast.error('Please select at least one member card to download')
      return
    }

    setIsProcessing(true)
    setProgressMsg('Rendering individual PNG files...')
    setProgressPct(0)

    try {
      const count = await downloadBulkIndividualPngs(targetCards, (curr, total) => {
        const pct = Math.round((curr / total) * 100)
        setProgressPct(pct)
        setProgressMsg(`Downloading PNG image ${curr} of ${total} (${pct}%)`)
      })

      toast.success(`Downloaded ${count} individual PNG membership cards`)
    } catch (err: unknown) {
      console.error('[BULK-CARDS] Direct PNG download failed:', err)
      toast.error('Failed to download individual PNG images')
    } finally {
      setIsProcessing(false)
    }
  }

  // Bulk PDF export
  const handleBulkPdfExport = async () => {
    const targetCards = getSelectedCardRefs()
    if (targetCards.length === 0) {
      toast.error('Please select at least one member card to export')
      return
    }

    setIsProcessing(true)
    setProgressMsg('Rendering printable PDF sheet...')
    setProgressPct(0)

    try {
      const pdfBlob = await downloadBulkCardsPdf(targetCards, (curr, total) => {
        const pct = Math.round((curr / total) * 100)
        setProgressPct(pct)
        setProgressMsg(`Adding card ${curr} of ${total} to PDF (${pct}%)`)
      })

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `The_Base_Membership_Cards_Sheet_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Exported ${targetCards.length} membership cards to PDF`)
    } catch (err: unknown) {
      console.error('[BULK-CARDS] PDF export failed:', err)
      toast.error('Failed to generate PDF document')
    } finally {
      setIsProcessing(false)
    }
  }

  // Single card PNG download
  const handleSinglePngDownload = async (member: CardMember) => {
    const el = cardElementRefs.current.get(member.id)
    if (!el) return
    try {
      const blob = await captureElementToPngBlob(el)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${member.id}_${member.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Card downloaded for ${member.fullName}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to download card')
    }
  }

  // Single card PDF download
  const handleSinglePdfDownload = async (member: CardMember) => {
    const el = cardElementRefs.current.get(member.id)
    if (!el) return
    try {
      const blob = await captureElementToPngBlob(el)
      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader()
        reader.onloadend = () => res(reader.result as string)
        reader.readAsDataURL(blob)
      })

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, 85.6, 54)
      pdf.save(`${member.id}_Card.pdf`)
      toast.success(`PDF downloaded for ${member.fullName}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to download single card PDF')
    }
  }

  // Photo Upload Modal Handlers
  const handleOpenPhotoModal = (member: CardMember) => {
    setPhotoModalMember(member)
    setPhotoPreview(member.avatarUrl)
    setPhotoFile(null)
  }

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSavePhoto = async () => {
    if (!photoModalMember || !photoFile) {
      toast.error('Please select a new photo to upload')
      return
    }

    setUploadingPhoto(true)
    try {
      const newAvatarUrl = await updateMemberPhoto(
        photoModalMember.authId,
        photoModalMember.id,
        photoModalMember.avatarUrl,
        photoFile
      )

      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === photoModalMember.id ? { ...m, avatarUrl: newAvatarUrl } : m))
      )

      toast.success(`Photo updated successfully for ${photoModalMember.fullName}`)
      setPhotoModalMember(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Photo upload failed'
      console.error('[PHOTO-UPDATE]', err)
      toast.error(msg)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const verifiedPhotoCount = members.filter((m) => !!m.avatarUrl).length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const startCardIndex = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const endCardIndex = Math.min(page * PAGE_SIZE, totalCount)

  const renderPaginationBar = () => (
    <div
      className="panel pagination-bar"
      style={{
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
      }}
    >
      <div style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
        Showing <strong>{startCardIndex}–{endCardIndex}</strong> of <strong>{totalCount.toLocaleString()}</strong> cards (Page {page} of {totalPages})
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setPage(1)}
          disabled={page <= 1 || loading}
          title="First page"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>first_page</span>
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
          title="Previous page"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
          Prev
        </button>

        <select
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          disabled={loading}
          style={{
            height: 32,
            padding: '0 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid hsl(var(--border))',
            fontSize: 12,
            background: 'hsl(var(--surface))',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <option key={p} value={p}>
              Page {p} of {totalPages}
            </option>
          ))}
        </select>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || loading}
          title="Next page"
        >
          Next
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => setPage(totalPages)}
          disabled={page >= totalPages || loading}
          title="Last page"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>last_page</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="main">
      <AdminPageHeader
        title="Membership Cards & Bulk Export"
        description="Filter, sort, bulk download, and manage digital credentials for members."
        actions={
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/members')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              group
            </span>
            Member Directory
          </button>
        }
      />

      {/* Role Scoping Notification Banner */}
      {(isConstituencyLead || isChapterLead) && (
        <div
          className="panel"
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            borderLeft: '4px solid hsl(var(--primary))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span className="material-symbols-outlined" style={{ color: 'hsl(var(--primary))' }}>
            lock
          </span>
          <p style={{ margin: 0, fontSize: 13, color: 'hsl(var(--on-surface))' }}>
            <strong>Scoped Access:</strong> You are viewing membership cards for your assigned jurisdiction{' '}
            <strong>
              {currentUser?.constituency || currentUser?.country || currentUser?.chapter}
            </strong>
            .
          </p>
        </div>
      )}

      {/* Tactical KPIs Strip — Grid layout responsive 3-column fix */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}>
        <div className="panel" style={{ padding: '16px 20px', borderLeft: '3px solid hsl(var(--primary))', position: 'relative', overflow: 'hidden' }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Total Filtered Cards
          </p>
          <p style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 800, margin: 0, color: 'hsl(var(--primary))' }}>
            {totalCount.toLocaleString()}
          </p>
        </div>

        <div className="panel" style={{ padding: '16px 20px', borderLeft: '3px solid hsl(var(--accent))', position: 'relative', overflow: 'hidden' }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Selected for Export
          </p>
          <p style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 800, margin: 0, color: 'hsl(var(--accent))' }}>
            {selectedIds.size.toLocaleString()}
          </p>
        </div>

        <div className="panel" style={{ padding: '16px 20px', borderLeft: '3px solid hsl(156 100% 25%)', position: 'relative', overflow: 'hidden' }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Photo Verified
          </p>
          <p style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 800, margin: 0, color: 'hsl(var(--on-surface))' }}>
            {members.length > 0 ? `${Math.round((verifiedPhotoCount / members.length) * 100)}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Filter & Toolbar Panel */}
      <div className="panel" style={{ padding: '18px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Row: Search + Photos Only + Sort + Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--on-surface-muted))',
                  fontSize: 18,
                }}
              >
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
                placeholder="Search name, Reg No, phone, email..."
                style={{
                  width: '100%',
                  paddingLeft: 38,
                  paddingRight: searchQuery ? 32 : 12,
                  height: 38,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 13,
                  background: 'hsl(var(--surface))',
                  color: 'hsl(var(--on-surface))',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => handleFilterChange(() => setSearchQuery(''))}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--on-surface-muted))',
                    cursor: 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    close
                  </span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'hsl(var(--on-surface))',
                  userSelect: 'none',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-xs)',
                  background: photosOnly ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                  border: photosOnly ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                }}
              >
                <input
                  type="checkbox"
                  checked={photosOnly}
                  onChange={(e) => handleFilterChange(() => setPhotosOnly(e.target.checked))}
                  style={{ width: 15, height: 15, cursor: 'pointer' }}
                />
                Photos Only
              </label>

              <select
                value={sortBy}
                onChange={(e) => handleFilterChange(() => setSortBy(e.target.value as typeof sortBy))}
                style={{
                  height: 38,
                  padding: '0 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 13,
                  background: 'hsl(var(--surface))',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <option value="name_asc">Sort: Name (A – Z)</option>
                <option value="name_desc">Sort: Name (Z – A)</option>
                <option value="reg_asc">Sort: Registration No.</option>
                <option value="joined_desc">Sort: Date Joined</option>
              </select>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleBulkZipDownload}
                disabled={isProcessing || selectedIds.size === 0}
                style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Download high-resolution PNG images for selected cards in a ZIP archive"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  folder_zip
                </span>
                Bulk PNGs (ZIP) ({selectedIds.size})
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={handleBulkDirectPngDownload}
                disabled={isProcessing || selectedIds.size === 0}
                style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Download individual PNG files directly to your browser downloads folder"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  image
                </span>
                Bulk PNG Direct
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={handleBulkPdfExport}
                disabled={isProcessing || selectedIds.size === 0}
                style={{ height: 38, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                title="Export 4-up A4 printable PDF sheet"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  picture_as_pdf
                </span>
                Export PDF Sheet
              </button>
            </div>
          </div>

          {/* Bottom Row: Categorical Filter Selectors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              paddingTop: 12,
              borderTop: '1px solid hsl(var(--border))',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 4, textTransform: 'uppercase' }}>
                Platform / Network
              </label>
              <select
                value={platformFilter}
                onChange={(e) => handleFilterChange(() => setPlatformFilter(e.target.value as typeof platformFilter))}
                disabled={isConstituencyLead || isChapterLead}
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                  background: 'hsl(var(--surface))',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <option value="ALL">All Platforms</option>
                <option value="GHANA">Ghana Resident Network</option>
                <option value="DIASPORA">Diaspora Network</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 4, textTransform: 'uppercase' }}>
                Region
              </label>
              <select
                value={regionFilter}
                onChange={(e) => handleFilterChange(() => setRegionFilter(e.target.value))}
                disabled={isConstituencyLead}
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                  background: 'hsl(var(--surface))',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <option value="ALL">All Regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 4, textTransform: 'uppercase' }}>
                Constituency
              </label>
              <select
                value={constituencyFilter}
                onChange={(e) => handleFilterChange(() => setConstituencyFilter(e.target.value))}
                disabled={isConstituencyLead}
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                  background: 'hsl(var(--surface))',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {constituencyOptions.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All Constituencies' : c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 4, textTransform: 'uppercase' }}>
                Country (Diaspora)
              </label>
              <select
                value={countryFilter}
                onChange={(e) => handleFilterChange(() => setCountryFilter(e.target.value))}
                disabled={isChapterLead}
                style={{
                  width: '100%',
                  height: 34,
                  padding: '0 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                  background: 'hsl(var(--surface))',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'All Countries' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Overlay during generation */}
      {isProcessing && (
        <div
          className="panel"
          style={{
            padding: '16px 20px',
            marginBottom: 24,
            background: 'hsl(var(--container-low))',
            borderLeft: '4px solid hsl(var(--primary))',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
            <span>{progressMsg}</span>
            <span>{progressPct}%</span>
          </div>
          <div style={{ height: 8, background: 'hsl(var(--border))', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'hsl(var(--primary))',
                transition: 'width 0.2s linear',
              }}
            />
          </div>
        </div>
      )}

      {/* Select All Checkbox & Summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={members.length > 0 && selectedIds.size === members.length}
            onChange={handleToggleSelectAll}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          Select Page ({members.length} Cards)
        </label>

        <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          Total matching: <strong>{totalCount.toLocaleString()}</strong> cards
        </span>
      </div>

      {/* Top Pagination Bar */}
      {totalCount > 0 && renderPaginationBar()}

      {/* Loading state */}
      {loading ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--on-surface-muted))' }}>
            progress_activity
          </span>
          <p style={{ color: 'hsl(var(--on-surface-muted))', marginTop: 8 }}>Loading digital membership cards...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))' }}>
            badge
          </span>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '8px 0 4px' }}>
            No matching membership cards found
          </p>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
            Try adjusting your search query, region, constituency, or platform filters.
          </p>
        </div>
      ) : (
        /* Cards Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
            gap: 24,
          }}
        >
          {members.map((member) => {
            const isSelected = selectedIds.has(member.id)
            return (
              <div
                key={member.id}
                className="panel"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  border: isSelected ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border))',
                  position: 'relative',
                }}
              >
                {/* Header Row: Checkbox, Name, Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOne(member.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--on-surface))' }}>
                      {member.fullName}
                    </span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => handleOpenPhotoModal(member)}
                      title="Update profile photo"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        photo_camera
                      </span>
                      Photo
                    </button>

                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => handleSinglePngDownload(member)}
                      title="Download PNG Card"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        image
                      </span>
                      PNG
                    </button>

                    <button
                      className="btn btn-outline btn-sm"
                      style={{ padding: '2px 8px', fontSize: 11 }}
                      onClick={() => handleSinglePdfDownload(member)}
                      title="Download Single PDF"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        picture_as_pdf
                      </span>
                      PDF
                    </button>
                  </div>
                </div>

                {/* Digital Membership Card Preview */}
                <div
                  ref={(el) => {
                    if (el) cardElementRefs.current.set(member.id, el)
                    else cardElementRefs.current.delete(member.id)
                  }}
                  style={{ width: '100%', background: '#fff', borderRadius: 'var(--radius-md)' }}
                >
                  <MembershipCard
                    userName={member.fullName}
                    userRegNo={member.id}
                    avatarUrl={member.avatarUrl}
                    gender={member.gender}
                    joinedDate={member.joinedDate}
                    status={member.status}
                    country={member.country}
                    region={member.region}
                    constituency={member.constituency}
                    chapter={member.chapter}
                    city={member.city}
                    isForDownload={true}
                    onPhotoClick={() => handleOpenPhotoModal(member)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Bottom Pagination Bar */}
      {!loading && totalCount > 0 && renderPaginationBar()}

      {/* Photo Crop & Upload Modal */}
      {photoModalMember && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="panel"
            style={{
              width: '100%',
              maxWidth: 440,
              padding: 24,
              background: 'hsl(var(--surface))',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'hsl(var(--on-surface))' }}>
                Update Member Photo
              </h3>
              <button
                onClick={() => setPhotoModalMember(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--on-surface-muted))' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '0 0 16px' }}>
              Updating photo for <strong>{photoModalMember.fullName}</strong> ({photoModalMember.id}).
            </p>

            {/* Photo Preview Container */}
            <div
              style={{
                width: 140,
                height: 175,
                margin: '0 auto 16px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '2px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))' }}>
                  person
                </span>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', width: '100%' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  upload_file
                </span>
                Choose New Photo File
                <input type="file" accept="image/*" onChange={handlePhotoFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-outline"
                onClick={() => setPhotoModalMember(null)}
                disabled={uploadingPhoto}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSavePhoto}
                disabled={uploadingPhoto || !photoFile}
              >
                {uploadingPhoto ? 'Uploading...' : 'Save Photo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
