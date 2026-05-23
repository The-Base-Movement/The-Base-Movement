import React from 'react'
import { type Member } from '@/services/adminService'
import MembershipCard from '@/components/MembershipCard'

interface CardTabProps {
  member: Member
  cardRef: React.RefObject<HTMLDivElement | null>
  onPrint: () => void
  onDownload: () => void
}

export function CardTab({ member, cardRef, onPrint, onDownload }: CardTabProps) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div ref={cardRef}>
        <MembershipCard
          userName={member.name}
          userRegNo={member.id}
          gender={member.gender}
          country={member.country}
          region={member.region}
          constituency={member.constituency}
          chapter={member.chapter}
          status={member.status === 'Active' ? 'Active member' : member.status}
          joinedDate={member.joined}
          initials={member.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
          avatarUrl={member.avatarUrl}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginTop: 16,
        }}
      >
        <button
          className="btn btn-outline"
          onClick={onPrint}
          disabled={!member.avatarUrl}
          title={
            !member.avatarUrl ? 'Member has no profile photo — card cannot be printed' : undefined
          }
          style={{
            opacity: member.avatarUrl ? 1 : 0.4,
            cursor: member.avatarUrl ? 'pointer' : 'not-allowed',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            print
          </span>
          Print card
        </button>
        <button
          className="btn btn-primary"
          onClick={onDownload}
          disabled={!member.avatarUrl}
          title={
            !member.avatarUrl
              ? 'Member has no profile photo — card cannot be downloaded'
              : undefined
          }
          style={{
            opacity: member.avatarUrl ? 1 : 0.4,
            cursor: member.avatarUrl ? 'pointer' : 'not-allowed',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            download
          </span>
          Download PDF
        </button>
      </div>
      {!member.avatarUrl && (
        <p
          style={{
            marginTop: 10,
            fontSize: 11,
            fontWeight: 'var(--font-weight-normal, 400)',
            color: 'hsl(var(--on-surface-muted))',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            info
          </span>
          Profile photo required to print or download this member's card.
        </p>
      )}
    </div>
  )
}
