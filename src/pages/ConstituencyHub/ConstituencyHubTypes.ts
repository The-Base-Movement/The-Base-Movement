export interface ConstituencyMember {
  authId: string
  regNo: string
  name: string
  phone: string
  region: string
  status: string
  joined: string
  avatarUrl?: string
}

export interface Announcement {
  id: string
  constituency_id: number
  content: string
  author_name: string
  created_at: string
}

export interface ConstituencyDonation {
  id: string
  full_name: string
  phone: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  reference: string | null
}
