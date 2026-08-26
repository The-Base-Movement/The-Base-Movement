import { useRef } from 'react'
import MembershipCard from '@/components/MembershipCard'
import { MembershipCardActions } from '@/components/MembershipCardActions'

interface Props {
  form: {
    fullName: string
    region: string
    constituency: string
    status: string
    chapter: string
    joinedDate: string
    country: string
    city: string
    gender: string
  }
  avatarUrl: string | null
  userRegNo: string
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function MembershipCardPanel({ form, avatarUrl, userRegNo, onAvatarChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = form.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

  const previewRegNo =
    userRegNo ||
    `TBM-${!form.country || form.country === 'Ghana' ? 'GH' : 'DI'}-${new Date().getFullYear().toString().slice(-2)}XXXX`

  const cardProps = {
    userName: form.fullName,
    avatarUrl,
    userRegNo: previewRegNo,
    initials,
    gender: form.gender,
    joinedDate: form.joinedDate,
    status: form.status,
    region: form.region,
    constituency: form.constituency,
    country: form.country,
    city: form.city,
    chapter: form.chapter,
  }

  return (
    <div className="panel">
      <div className="ph">
        <h3>Membership card</h3>
        <span className="meta">Live preview</span>
      </div>
      <div style={{ padding: 20 }}>
        <div className="mcard-container">
          <MembershipCard {...cardProps} onPhotoClick={() => fileRef.current?.click()} />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onAvatarChange}
        />
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <MembershipCardActions cardProps={cardProps} regNo={previewRegNo} />
      </div>
    </div>
  )
}
