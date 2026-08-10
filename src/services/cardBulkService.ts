import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import JSZip from 'jszip'

export interface CardMember {
  id: string // registration_number
  authId: string
  fullName: string
  avatarUrl: string | null
  gender: string
  joinedDate: string
  status: string
  country: string
  region: string
  constituency: string
  chapter: string
  city: string
  platform: 'GHANA' | 'DIASPORA'
  phone: string
  email: string
}

export interface BulkMemberQueryFilters {
  platform?: 'ALL' | 'GHANA' | 'DIASPORA'
  region?: string
  constituency?: string
  country?: string
  chapter?: string
  status?: string
  search?: string
  sortBy?: 'name_asc' | 'name_desc' | 'reg_asc' | 'joined_desc'
  limit?: number
  offset?: number
}

export async function getBulkCardMembers(
  filters: BulkMemberQueryFilters = {}
): Promise<{ members: CardMember[]; totalCount: number }> {
  const {
    platform = 'ALL',
    region = '',
    constituency = '',
    country = '',
    chapter = '',
    status = '',
    search = '',
    sortBy = 'name_asc',
    limit = 200,
    offset = 0,
  } = filters

  let query = supabase
    .from('users')
    .select(
      'id, registration_number, full_name, avatar_url, gender, joined_at, status, country, region, constituency, chapter, city, platform, phone_number, email',
      { count: 'exact' }
    )
    .is('deleted_at', null)

  if (platform !== 'ALL') {
    query = query.eq('platform', platform)
  }

  if (region && region !== 'ALL') {
    query = query.eq('region', region)
  }

  if (constituency && constituency !== 'ALL') {
    query = query.eq('constituency', constituency)
  }

  if (country && country !== 'ALL') {
    query = query.eq('country', country)
  }

  if (chapter && chapter !== 'ALL') {
    query = query.eq('chapter', chapter)
  }

  if (status && status !== 'ALL') {
    query = query.eq('status', status)
  }

  if (search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(
      `full_name.ilike.${term},registration_number.ilike.${term},phone_number.ilike.${term},email.ilike.${term}`
    )
  }

  // Sorting
  if (sortBy === 'name_asc') {
    query = query.order('full_name', { ascending: true })
  } else if (sortBy === 'name_desc') {
    query = query.order('full_name', { ascending: false })
  } else if (sortBy === 'reg_asc') {
    query = query.order('registration_number', { ascending: true })
  } else if (sortBy === 'joined_desc') {
    query = query.order('joined_at', { ascending: false })
  }

  if (limit > 0) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[CARD-BULK-SERVICE] Error fetching members:', error)
    return { members: [], totalCount: 0 }
  }

  const members: CardMember[] = (data || []).map((u) => ({
    id: u.registration_number || u.id,
    authId: u.id,
    fullName: u.full_name || 'Member',
    avatarUrl: u.avatar_url || null,
    gender: u.gender || 'Not specified',
    joinedDate: u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-GB') : '30 Mar 2025',
    status: u.status || 'Active',
    country: u.country || 'Ghana',
    region: u.region || '',
    constituency: u.constituency || '',
    chapter: u.chapter || '',
    city: u.city || '',
    platform: (u.platform as 'GHANA' | 'DIASPORA') || 'GHANA',
    phone: u.phone_number || '',
    email: u.email || '',
  }))

  return { members, totalCount: count || members.length }
}

export async function updateMemberPhoto(
  authId: string,
  regNo: string,
  currentAvatarUrl: string | null,
  imageBlob: Blob
): Promise<string> {
  const fileName = adminService.generateAvatarPath(authId || regNo)
  const { data, error } = await adminService.uploadAvatar(fileName, imageBlob)

  if (error || !data?.path) {
    throw new Error(error?.message || 'Failed to upload new member photo')
  }

  const newPublicUrl = adminService.getAvatarPublicUrl(data.path)

  // Update DB row
  const { error: dbErr } = await supabase
    .from('users')
    .update({ avatar_url: newPublicUrl })
    .eq('id', authId)

  if (dbErr) {
    throw new Error(`Failed to save photo URL to member profile: ${dbErr.message}`)
  }

  // Purge old photo from storage best-effort
  if (currentAvatarUrl) {
    await adminService.deleteAvatarByPublicUrl(currentAvatarUrl).catch(() => null)
  }

  return newPublicUrl
}

function sanitizeFilename(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
}

export async function captureElementToPngBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas image generation failed'))
    }, 'image/png')
  })
}

export async function downloadBulkCardsZip(
  cardElements: { member: CardMember; element: HTMLElement }[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip()
  const total = cardElements.length

  for (let i = 0; i < total; i++) {
    const item = cardElements[i]
    const pngBlob = await captureElementToPngBlob(item.element)
    const filename = `${sanitizeFilename(item.member.id)}_${sanitizeFilename(item.member.fullName)}.png`
    zip.file(filename, pngBlob)
    if (onProgress) onProgress(i + 1, total)
  }

  return await zip.generateAsync({ type: 'blob' })
}

export async function downloadBulkCardsPdf(
  cardElements: { member: CardMember; element: HTMLElement }[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pdfWidth = pdf.internal.pageSize.getWidth() // 210mm
  const cardWidth = 90 // mm
  const cardHeight = cardWidth / 1.6 // ~56.25mm
  const marginX = (pdfWidth - cardWidth * 2) / 3 // spacing between cards
  const marginY = 15 // mm top/bottom margin

  const total = cardElements.length
  const cardsPerPage = 4

  for (let i = 0; i < total; i++) {
    if (i > 0 && i % cardsPerPage === 0) {
      pdf.addPage()
    }

    const item = cardElements[i]
    const pngBlob = await captureElementToPngBlob(item.element)
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(pngBlob)
    })

    const indexOnPage = i % cardsPerPage
    const col = indexOnPage % 2
    const row = Math.floor(indexOnPage / 2)

    const x = marginX + col * (cardWidth + marginX)
    const y = marginY + row * (cardHeight + 15)

    pdf.addImage(dataUrl, 'PNG', x, y, cardWidth, cardHeight)
    if (onProgress) onProgress(i + 1, total)
  }

  return pdf.output('blob')
}
