import React from 'react'
import { createPortal } from 'react-dom'
import {
  type Member,
  type AuditLogEntry,
  type MemberDonation,
  type MemberPollVote,
  type MemberSession,
  type MemberNote,
} from '@/services/adminService'
import { ActivityTab } from './ActivityTab'
import { IdentityTab } from './IdentityTab'
import { DonationsTab } from './DonationsTab'
import { PollsTab } from './PollsTab'
import { SessionsTab } from './SessionsTab'
import { NotesTab } from './NotesTab'
import { CardTab } from './CardTab'

type DetailTab = 'activity' | 'identity' | 'donations' | 'polls' | 'sessions' | 'notes' | 'card'

interface MemberDetailPanelProps {
  member: Member
  activeTab: DetailTab
  onTabChange: (tab: DetailTab) => void
  onClose: () => void
  logs: AuditLogEntry[]
  donations: MemberDonation[]
  pollVotes: MemberPollVote[]
  sessions: MemberSession[]
  notes: MemberNote[]
  noteContent: string
  onNoteChange: (v: string) => void
  onAddNote: () => void
  isSubmittingNote: boolean
  cardRef: React.RefObject<HTMLDivElement | null>
  onPrint: () => void
  onDownload: () => void
  onEdit: (m: Member) => void
  onVerify: (id: string, name: string) => void
}

export function MemberDetailPanel({
  member,
  activeTab,
  onTabChange,
  onClose,
  logs,
  donations,
  pollVotes,
  sessions,
  notes,
  noteContent,
  onNoteChange,
  onAddNote,
  isSubmittingNote,
  cardRef,
  onPrint,
  onDownload,
  onEdit,
  onVerify,
}: MemberDetailPanelProps) {
  const tabs = [
    { id: 'activity' as const, label: 'Activity', count: logs.length },
    { id: 'identity' as const, label: 'Identity', count: 0 },
    { id: 'donations' as const, label: 'Donations', count: donations.length },
    { id: 'polls' as const, label: 'Polls', count: pollVotes.length },
    { id: 'sessions' as const, label: 'Sessions', count: sessions.length },
    { id: 'notes' as const, label: 'Notes', count: notes.length },
    { id: 'card' as const, label: 'ID Card', count: 0 },
  ]

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        background: 'rgba(15,19,16,.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          maxWidth: 1200,
          overflowY: 'auto',
          background: '#f1f5ee',
        }}
      >
        {/* Dark header */}
        <div
          className="member-detail-header"
          style={{
            background: 'linear-gradient(135deg,#0f1310,#1f2620)',
            color: '#fff',
            padding: '24px 28px',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '3px solid hsl(var(--destructive))',
            borderBottom: '3px solid hsl(var(--primary))',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -40,
              top: -40,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle,rgba(218,165,32,.15),transparent 70%)',
            }}
          />

          <button
            aria-label="Close member details"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              close
            </span>
          </button>

          <div
            className="member-detail-identity-row"
            style={{ display: 'flex', gap: 20, alignItems: 'flex-start', position: 'relative' }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: '3px solid hsl(var(--accent))',
                flexShrink: 0,
                overflow: 'hidden',
                background: '#2a332b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 24,
                    color: '#fff',
                  }}
                >
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)}
                </span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9.5,
                  color: 'hsl(var(--accent))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                }}
              >
                {member.status === 'Active' || member.status === 'Approved'
                  ? 'Verified member'
                  : 'Pending verification'}{' '}
                · since {member.joined?.split('-')[0] || '2025'}
              </div>
              <h2
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 28,
                  letterSpacing: '-.02em',
                  marginTop: 4,
                  lineHeight: 1.1,
                }}
              >
                {member.name}
              </h2>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color: 'hsl(var(--accent))',
                  marginTop: 4,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '.04em',
                }}
              >
                {member.id.substring(0, 12).toUpperCase()}
              </div>
              <div
                className="desktop-only"
                style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}
              >
                <span
                  style={{
                    padding: '3px 10px',
                    background: 'rgba(218,165,32,.1)',
                    border: '1px solid rgba(218,165,32,.36)',
                    borderRadius: 99,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight:
                      'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                    fontSize: 10,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    color: 'hsl(var(--accent))',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                    verified
                  </span>
                  {member.status === 'Active' || member.status === 'Approved'
                    ? 'KYC verified'
                    : 'Pending KYC'}
                </span>
                {member.constituency && (
                  <span
                    style={{
                      padding: '3px 10px',
                      background: 'rgba(255,255,255,.08)',
                      border: '1px solid rgba(255,255,255,.16)',
                      borderRadius: 99,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight:
                        'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                      fontSize: 10,
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {member.constituency}
                  </span>
                )}
                {member.region && (
                  <span
                    style={{
                      padding: '3px 10px',
                      background: 'rgba(255,255,255,.08)',
                      border: '1px solid rgba(255,255,255,.16)',
                      borderRadius: 99,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight:
                        'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                      fontSize: 10,
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {member.region}
                  </span>
                )}
                {member.gender && (
                  <span
                    style={{
                      padding: '3px 10px',
                      background: 'rgba(255,255,255,.08)',
                      border: '1px solid rgba(255,255,255,.16)',
                      borderRadius: 99,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight:
                        'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                      fontSize: 10,
                      letterSpacing: '.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {member.gender}
                  </span>
                )}
              </div>
            </div>
            {/* Pills — mobile only, full-width row below avatar+name */}
            <div
              className="mobile-only member-detail-pills"
              style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%', order: 1 }}
            >
              <span
                style={{
                  padding: '3px 10px',
                  background: 'rgba(218,165,32,.1)',
                  border: '1px solid rgba(218,165,32,.36)',
                  borderRadius: 99,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight:
                    'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                  fontSize: 10,
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: 'hsl(var(--accent))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                  verified
                </span>
                {member.status === 'Active' || member.status === 'Approved'
                  ? 'KYC verified'
                  : 'Pending KYC'}
              </span>
              {member.constituency && (
                <span
                  style={{
                    padding: '3px 10px',
                    background: 'rgba(255,255,255,.08)',
                    border: '1px solid rgba(255,255,255,.16)',
                    borderRadius: 99,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight:
                      'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                    fontSize: 10,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {member.constituency}
                </span>
              )}
              {member.region && (
                <span
                  style={{
                    padding: '3px 10px',
                    background: 'rgba(255,255,255,.08)',
                    border: '1px solid rgba(255,255,255,.16)',
                    borderRadius: 99,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight:
                      'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                    fontSize: 10,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {member.region}
                </span>
              )}
              {member.gender && (
                <span
                  style={{
                    padding: '3px 10px',
                    background: 'rgba(255,255,255,.08)',
                    border: '1px solid rgba(255,255,255,.16)',
                    borderRadius: 99,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight:
                      'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                    fontSize: 10,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {member.gender}
                </span>
              )}
            </div>
            <div
              className="member-detail-actions"
              style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', flexWrap: 'wrap' }}
            >
              <button
                className="btn btn-sm"
                style={{
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,.18)',
                }}
                onClick={() => onEdit(member)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  edit
                </span>
                Edit
              </button>
              <button
                className="btn btn-sm"
                style={{
                  background: 'rgba(255,255,255,.08)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,.18)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  mail
                </span>
                Message
              </button>
              <button
                className="btn btn-sm btn-dest"
                onClick={() => {
                  // flag action placeholder
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  flag
                </span>
                Flag
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="member-quick-stats">
            {[
              { label: 'Lifetime contribution', val: '₵0', sub: 'No donations yet' },
              {
                label: 'Polls voted',
                val: pollVotes.length || '—',
                sub: 'Poll activity',
              },
              { label: 'Chapter activity', val: '—', sub: 'Events attended YTD' },
              {
                label: 'Membership tier',
                val: member.type || 'Citizen',
                sub: 'Active tier',
                accent: true,
              },
            ].map((s, i) => (
              <div key={i}>
                <div className="sl">{s.label}</div>
                <div className={`sv tnum${s.accent ? ' accent' : ''}`}>{s.val}</div>
                <div className="sd">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid hsl(var(--border))',
            background: '#fff',
            padding: '0 14px',
            overflowX: 'auto',
          }}
        >
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              style={{
                padding: '14px 16px',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                color: activeTab === id ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))',
                background: 'none',
                border: 'none',
                borderBottom:
                  activeTab === id ? '2px solid hsl(var(--destructive))' : '2px solid transparent',
                cursor: 'pointer',
                letterSpacing: '-.005em',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
              {count > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    padding: '1px 7px',
                    background: '#f1f5ee',
                    borderRadius: 99,
                    fontSize: 9,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight:
                      'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '22px 20px' }}>
          {activeTab === 'activity' && (
            <ActivityTab member={member} logs={logs} donations={donations} />
          )}
          {activeTab === 'identity' && (
            <IdentityTab member={member} onEdit={onEdit} onVerify={onVerify} />
          )}
          {activeTab === 'donations' && <DonationsTab donations={donations} />}
          {activeTab === 'polls' && <PollsTab votes={pollVotes} />}
          {activeTab === 'sessions' && <SessionsTab sessions={sessions} />}
          {activeTab === 'notes' && (
            <NotesTab
              member={member}
              notes={notes}
              noteContent={noteContent}
              onNoteChange={onNoteChange}
              onAddNote={onAddNote}
              isSubmitting={isSubmittingNote}
            />
          )}
          {activeTab === 'card' && (
            <CardTab member={member} cardRef={cardRef} onPrint={onPrint} onDownload={onDownload} />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
