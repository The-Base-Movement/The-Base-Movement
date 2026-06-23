import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { adminService } from '@/services/adminService'
import { chapterOpsService } from './chapterhub/chapterOpsService'
import type { Chapter } from '@/types/admin'
import type { ChapterMember, ChapterDonation } from './chapterhub/types'

const PHONE_VISIBLE_ROLES = new Set([
  'CHAPTER_LEAD',
  'CHAPTER_SECRETARY',
  'CONSTITUENCY_LEAD',
  'SUPER_ADMIN',
  'FOUNDER',
  'ORGANIZER',
  'EXECUTIVE',
  'ADMIN',
])

// Sub-components
import { HubSelector } from './chapterhub/HubSelector'
import { HubHeader } from './chapterhub/HubHeader'
import { HubMembersList } from './chapterhub/HubMembersList'
import { HubDonationsList } from './chapterhub/HubDonationsList'
import { Skeleton } from '@/components/states'
import { Helpdesk } from '@/components/admin/Helpdesk'

export default function AdminChapterLeadHub() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const { setCurrentLabel } = usePageLabel()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [members, setMembers] = useState<ChapterMember[]>([])
  const [donations, setDonations] = useState<ChapterDonation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'donations' | 'helpdesk'>('members')
  const [memberSearch, setMemberSearch] = useState('')

  useEffect(() => {
    return () => setCurrentLabel('')
  }, [setCurrentLabel])

  useEffect(() => {
    async function load() {
      const allChapters = await adminService.getChapters()
      setChapters(allChapters)

      if (!chapterId) {
        setIsLoading(false)
        return
      }

      const found = allChapters.find((c) => c.id === chapterId)
      if (!found) {
        setIsLoading(false)
        return
      }
      setChapter(found)
      setCurrentLabel(found.name)

      const [chapterMembers, chapterDonations] = await chapterOpsService.loadChapterData(found.name)
      setMembers(chapterMembers)
      setDonations(chapterDonations)

      setIsLoading(false)
    }
    load()
  }, [chapterId, setCurrentLabel])

  const currentRole = adminService.getCurrentUser()?.role
  const canSeePhone = PHONE_VISIBLE_ROLES.has(currentRole ?? '')

  const verifiedDonations = useMemo(
    () => donations.filter((d) => d.status === 'Verified'),
    [donations]
  )

  if (isLoading) {
    return (
      <div className="main">
        <div className="kpis">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="panel"
              style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: 'hsl(var(--border))',
                }}
              />
              <Skeleton variant="text-sm" width={80} style={{ marginBottom: 10 }} />
              <Skeleton variant="text-xl" width={60} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!chapter) {
    return <HubSelector chapters={chapters} />
  }

  const activeCount = members.filter((m) => m.status === 'Active' || m.status === 'Approved').length
  const pendingCount = members.filter((m) => m.status === 'Pending').length
  const totalDonated = verifiedDonations.reduce((s, d) => s + Number(d.amount), 0)

  return (
    <div className="main">
      <HubHeader
        chapter={chapter}
        activeCount={activeCount}
        pendingCount={pendingCount}
        totalMembers={members.length}
        totalDonated={totalDonated}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        donationsCount={verifiedDonations.length}
      />

      {activeTab === 'members' && (
        <HubMembersList
          members={members}
          searchQuery={memberSearch}
          setSearchQuery={setMemberSearch}
          canSeePhone={canSeePhone}
        />
      )}

      {activeTab === 'donations' && (
        <HubDonationsList donations={verifiedDonations} canSeePhone={canSeePhone} />
      )}

      {activeTab === 'helpdesk' && <Helpdesk departmentId="chapter" />}
    </div>
  )
}
