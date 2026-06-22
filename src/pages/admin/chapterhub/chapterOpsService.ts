import { supabase } from '@/lib/supabase'
import type { ChapterMember, ChapterDonation } from './types'

export const chapterOpsService = {
  async loadChapterData(chapterName: string): Promise<[ChapterMember[], ChapterDonation[]]> {
    const { data: memberData } = await supabase
      .from('users')
      .select(
        'id, registration_number, full_name, phone_number, region, constituency, status, joined_at, avatar_url'
      )
      .eq('chapter', chapterName)
      .order('joined_at', { ascending: false })

    const members: ChapterMember[] = (memberData || []).map((u) => ({
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

    let donations: ChapterDonation[] = []
    const memberIds = (memberData || []).map((u) => u.id)
    if (memberIds.length > 0) {
      const { data: donationData } = await supabase
        .from('donations')
        .select('id, full_name, phone, amount, payment_method, status, created_at, reference')
        .in('member_id', memberIds)
        .order('created_at', { ascending: false })
      donations = donationData || []
    }

    return [members, donations]
  },
}
