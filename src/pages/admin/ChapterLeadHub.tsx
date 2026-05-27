import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import type { Chapter } from '@/types/admin'
import type { ChapterMember, ChapterDonation } from './chapterhub/types'

// Sub-components
import { HubSelector } from './chapterhub/HubSelector'
import { HubHeader } from './chapterhub/HubHeader'
import { HubMembersList } from './chapterhub/HubMembersList'
import { HubDonationsList } from './chapterhub/HubDonationsList'
import { Skeleton } from '@/components/states'

export default function AdminChapterLeadHub() {
  const { chapterId } = useParams<{ chapterId: string }>()
  const { setCurrentLabel } = usePageLabel()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [members, setMembers] = useState<ChapterMember[]>([])
  const [donations, setDonations] = useState<ChapterDonation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'donations'>('members')
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

      const { data: memberData } = await supabase
        .from('users')
        .select(
          'id, registration_number, full_name, phone_number, region, constituency, status, joined_at, avatar_url'
        )
        .eq('chapter', found.name)
        .order('joined_at', { ascending: false })

      const mapped: ChapterMember[] = (memberData || []).map((u) => ({
        authId: u.id,
        regNo: u.registration_number,
        name: u.full_name,
        phone: u.phone_number || 'N/A',
        region: u.region || 'N/A',
        constituency: u.constituency || 'N/A',
        status: u.status,
        joined: u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-GB') : 'N/A',
        avatarUrl: u.avatar_url || undefined,
      }))
      setMembers(mapped)

      const memberIds = (memberData || []).map((u) => u.id)
      if (memberIds.length > 0) {
        const { data: donationData } = await supabase
          .from('donations')
          .select('id, full_name, phone, amount, payment_method, status, created_at, reference')
          .in('member_id', memberIds)
          .order('created_at', { ascending: false })
        setDonations(donationData || [])
      }

      setIsLoading(false)
    }
    load()
  }, [chapterId, setCurrentLabel])

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

  // If no chapter is selected (or not found), show the selector
  if (!chapter) {
    return <HubSelector chapters={chapters} />
  }

  const activeCount = members.filter((m) => m.status === 'Active' || m.status === 'Approved').length
  const pendingCount = members.filter((m) => m.status === 'Pending').length
  const totalDonated = donations.reduce((s, d) => s + Number(d.amount), 0)

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
        donationsCount={donations.length}
      />

      {activeTab === 'members' && (
        <HubMembersList
          members={members}
          searchQuery={memberSearch}
          setSearchQuery={setMemberSearch}
        />
      )}

      {activeTab === 'donations' && <HubDonationsList donations={donations} />}
    </div>
  )
}
