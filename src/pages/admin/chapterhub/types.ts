export interface ChapterMember {
  authId: string
  regNo: string
  name: string
  phone: string
  email: string
  country: string
  region: string
  constituency: string
  status: string
  joined: string
  joinedAt: string | null
  avatarUrl?: string
}

export interface ChapterDonation {
  id: string
  full_name: string
  phone: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  reference: string | null
}
