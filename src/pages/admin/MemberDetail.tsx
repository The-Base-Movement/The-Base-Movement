import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  adminService,
  type Member,
  type AuditLogEntry,
  type MemberDonation,
  type MemberPollVote,
  type MemberSession,
  type MemberNote,
} from '@/services/adminService'
import { useChapters } from '@/context/ChaptersContext'
import {
  jobTaxonomyService,
  emptyJobSelection,
  type JobSelection,
} from '@/services/jobTaxonomyService'
import { formatGhsAmount } from '@/lib/currency'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { ActivityTab } from './members/ActivityTab'
import { IdentityTab } from './members/IdentityTab'
import { DonationsTab } from './members/DonationsTab'
import { PollsTab } from './members/PollsTab'
import { SessionsTab } from './members/SessionsTab'
import { NotesTab } from './members/NotesTab'
import { CardTab } from './members/CardTab'
import { EditModal } from './members/EditModal'
import { VerifyModal } from './members/VerifyModal'
import { AuditModal } from './members/AuditModal'

type DetailTab = 'activity' | 'identity' | 'donations' | 'polls' | 'sessions' | 'notes' | 'card'

export default function AdminMemberDetail() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { chapters } = useChapters()
  const cardRef = useRef<HTMLDivElement>(null)

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<DetailTab>('activity')
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [donations, setDonations] = useState<MemberDonation[]>([])
  const [pollVotes, setPollVotes] = useState<MemberPollVote[]>([])
  const [sessions, setSessions] = useState<MemberSession[]>([])
  const [notes, setNotes] = useState<MemberNote[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Member>>({})
  const [jobSelection, setJobSelection] = useState<JobSelection>(emptyJobSelection)
  const [jobDirty, setJobDirty] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [isVerifyOpen, setIsVerifyOpen] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const [isAuditOpen, setIsAuditOpen] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[] | null>(null)

  const [showMessageModal, setShowMessageModal] = useState(false)
  const [msgTitle, setMsgTitle] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [isSendingMsg, setIsSendingMsg] = useState(false)

  useEffect(() => {
    if (!memberId) return
    adminService.getMemberProfile(memberId).then((m) => {
      setMember(m)
      setLoading(false)
      if (!m) return
      const targetId = m.authId || m.id
      adminService
        .getAuditLogsForResource(`MEMBERS/${m.id}`)
        .then(setLogs)
        .catch(() => {})
      Promise.allSettled([
        adminService.getMemberDonations(targetId).then(setDonations),
        adminService.getMemberPollVotes(targetId).then(setPollVotes),
        adminService.getMemberSessions(targetId).then(setSessions),
        adminService.getMemberNotes(targetId).then(setNotes),
      ])
    })
  }, [memberId])

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !member) return
    setIsSubmittingNote(true)
    try {
      const admin = adminService.getCurrentUser()
      const targetId = member.authId || member.id
      const newNote = await adminService.addMemberNote(
        targetId,
        admin?.name || 'Admin',
        admin?.role || 'Staff',
        newNoteContent
      )
      if (newNote) {
        setNotes((prev) => [newNote, ...prev])
        setNewNoteContent('')
        toast.success('Note recorded in member history.')
      }
    } catch {
      toast.error('Failed to persist administrative note.')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const openEditModal = () => {
    if (!member) return
    setEditForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      gender: member.gender,
      region: member.region,
      constituency: member.constituency,
      country: member.country,
      chapter: member.chapter,
      profession: member.profession,
      city: member.city,
      residentialAddress: member.residentialAddress,
    })
    setJobSelection(
      jobTaxonomyService.toSelection({
        job_industry_id: member.jobIndustryId,
        job_sub_category_id: member.jobSubCategoryId,
        job_role_id: member.jobRoleId,
        job_custom_title: member.jobCustomTitle,
      })
    )
    setJobDirty(false)
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!member) return
    setIsSavingEdit(true)
    try {
      // Only send `job` when the admin actually changed it, so an untouched edit
      // never wipes an existing selection.
      const payload = jobDirty ? { ...editForm, job: jobSelection } : editForm
      await adminService.updateMemberProfile(member.id, payload)
      toast.success('Member profile updated.')
      setIsEditOpen(false)
      const jobPatch: Partial<Member> = jobDirty
        ? {
            jobIndustryId: jobSelection.industryId,
            jobSubCategoryId: jobSelection.subCategoryId,
            jobRoleId: jobSelection.isOther ? null : jobSelection.roleId,
            jobCustomTitle: jobSelection.isOther ? jobSelection.customTitle.trim() || null : null,
          }
        : {}
      setMember({ ...member, ...editForm, ...jobPatch } as Member)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleVerify = async () => {
    if (!member) return
    setIsVerifying(true)
    const success = await adminService.verifyMember(member.id, true, 'Administrative Approval')
    setIsVerifying(false)
    setIsVerifyOpen(false)
    if (success) {
      toast.success('Member verified and admitted into the movement.')
      setMember((prev) => (prev ? { ...prev, status: 'Active' } : prev))
    }
  }

  const handleViewAudit = async () => {
    if (!member) return
    const al = await adminService.getAuditLogsForResource(`MEMBERS/${member.id}`)
    setAuditLogs(al)
    setIsAuditOpen(true)
  }

  const handlePrint = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 4,
        useCORS: true,
        backgroundColor: 'hsl(var(--surface))',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
      })
      const imgData = canvas.toDataURL('image/png')
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) return
      iframeDoc.write(
        `<html><head><title>THE BASE - Official Membership Card</title><style>@page{size:85.6mm 54mm;margin:0}body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;width:85.6mm;height:54mm;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;color-adjust:exact}img{width:85.6mm;height:54mm;display:block;object-fit:contain}</style></head><body><img src="${imgData}" onload="setTimeout(()=>{window.print();},200);"/></body></html>`
      )
      iframeDoc.close()
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
      }, 60000)
    } catch (err) {
      console.error('Error printing card:', err)
    }
  }

  const handleDownload = async () => {
    if (!cardRef.current || !member) return
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'hsl(var(--surface))',
      })
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54)
      pdf.save(`THE-BASE-CARD-${member.id}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
    }
  }

  const handleSendMessage = async () => {
    if (!msgTitle.trim() || !msgBody.trim() || !member) return
    setIsSendingMsg(true)
    const { error } = await supabase.from('notifications').insert({
      user_id: member.authId,
      title: msgTitle.trim(),
      message: msgBody.trim(),
      type: 'Direct Message',
    })
    setIsSendingMsg(false)
    if (error) {
      toast.error('Failed to send message.')
    } else {
      toast.success('Message delivered to member.')
      setShowMessageModal(false)
      setMsgTitle('')
      setMsgBody('')
    }
  }

  // Lifetime contribution = sum of this member's cleared (confirmed) donations.
  const clearedDonations = donations.filter((d) => d.cleared)
  const lifetimeContribution = clearedDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

  const tabs = [
    { id: 'activity' as const, label: 'Activity', count: logs.length },
    { id: 'identity' as const, label: 'Identity', count: 0 },
    { id: 'donations' as const, label: 'Donations', count: donations.length },
    { id: 'polls' as const, label: 'Polls', count: pollVotes.length },
    { id: 'sessions' as const, label: 'Sessions', count: sessions.length },
    { id: 'notes' as const, label: 'Notes', count: notes.length },
    { id: 'card' as const, label: 'ID Card', count: 0 },
  ]

  if (loading) {
    return (
      <div
        className="main"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 12,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 36,
            color: 'hsl(var(--primary))',
            animation: 'spin 1.2s linear infinite',
          }}
        >
          sync
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Loading member record…
        </p>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="main">
        <p
          style={{ fontFamily: "'Public Sans', sans-serif", color: 'hsl(var(--on-surface-muted))' }}
        >
          Member not found.
        </p>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/members')}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            arrow_back
          </span>
          Back to Members
        </button>
      </div>
    )
  }

  return (
    <div className="main">
      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 12,
        }}
      >
        <button
          onClick={() => navigate('/admin/members')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'hsl(var(--primary))',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            group
          </span>
          Members
        </button>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
        >
          chevron_right
        </span>
        <span
          style={{
            color: 'hsl(var(--on-surface))',
            fontWeight: 'var(--font-weight-medium, 500)',
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
          }}
        >
          {member.name}
        </span>
      </div>

      {/* Dark hero header */}
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
          borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
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

        <div
          className="member-detail-identity-row"
          style={{ display: 'flex', gap: 20, alignItems: 'flex-start', position: 'relative' }}
        >
          {/* Avatar */}
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

          {/* Name + badges */}
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

          {/* Action buttons */}
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
              onClick={openEditModal}
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
              onClick={() => setShowMessageModal(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                mail
              </span>
              Message
            </button>
            <button
              className="btn btn-sm"
              style={{
                background: 'rgba(255,255,255,.08)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.18)',
              }}
              onClick={handleViewAudit}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                history
              </span>
              Audit
            </button>
            {member.status === 'Pending' && adminService.can('VERIFY_MEMBER', 'MEMBERS') && (
              <button className="btn btn-sm btn-primary" onClick={() => setIsVerifyOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  verified
                </span>
                Verify
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="member-quick-stats">
          {[
            {
              label: 'Lifetime contribution',
              val: formatGhsAmount(lifetimeContribution),
              sub: clearedDonations.length
                ? `${clearedDonations.length} cleared donation${clearedDonations.length === 1 ? '' : 's'}`
                : 'No donations yet',
            },
            { label: 'Polls voted', val: pollVotes.length || '—', sub: 'Poll activity' },
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

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--surface))',
          padding: '0 14px',
          overflowX: 'auto',
        }}
      >
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
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
      <div style={{ padding: '22px 0' }}>
        {activeTab === 'activity' && (
          <ActivityTab member={member} logs={logs} donations={donations} />
        )}
        {activeTab === 'identity' && (
          <IdentityTab
            member={member}
            onEdit={(_m) => openEditModal()}
            onVerify={(_id, _name) => setIsVerifyOpen(true)}
          />
        )}
        {activeTab === 'donations' && <DonationsTab donations={donations} />}
        {activeTab === 'polls' && <PollsTab votes={pollVotes} />}
        {activeTab === 'sessions' && <SessionsTab sessions={sessions} />}
        {activeTab === 'notes' && (
          <NotesTab
            member={member}
            notes={notes}
            noteContent={newNoteContent}
            onNoteChange={setNewNoteContent}
            onAddNote={handleAddNote}
            isSubmitting={isSubmittingNote}
          />
        )}
        {activeTab === 'card' && (
          <CardTab
            member={member}
            cardRef={cardRef}
            onPrint={handlePrint}
            onDownload={handleDownload}
          />
        )}
      </div>

      <EditModal
        isOpen={isEditOpen}
        member={member}
        form={editForm}
        onChange={(field, value) => setEditForm((f) => ({ ...f, [field]: value }))}
        onSave={handleSaveEdit}
        onClose={() => setIsEditOpen(false)}
        isSaving={isSavingEdit}
        chapters={chapters.map((c) => c.name)}
        jobSelection={jobSelection}
        onJobChange={(next) => {
          setJobSelection(next)
          setJobDirty(true)
        }}
        onJobLabelChange={(label) => {
          // Keep the denormalised profession in sync, but never clear it on the
          // selector's initial empty fire.
          if (label) setEditForm((f) => ({ ...f, profession: label }))
        }}
      />

      <VerifyModal
        isOpen={isVerifyOpen}
        members={[member]}
        isVerifying={isVerifying}
        onConfirm={handleVerify}
        onClose={() => setIsVerifyOpen(false)}
      />

      <AuditModal
        isOpen={isAuditOpen}
        memberName={member.name}
        logs={auditLogs}
        onClose={() => setIsAuditOpen(false)}
      />

      {showMessageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowMessageModal(false)}
        >
          <div
            style={{
              background: 'hsl(var(--surface))',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 28px 24px',
              width: '100%',
              maxWidth: 480,
              margin: '0 16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 4px',
                fontSize: 16,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Message {member.name}
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Delivered as a notification in their dashboard.
            </p>
            <div style={{ marginBottom: 12 }}>
              <label
                htmlFor="msg-subject"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Subject
              </label>
              <input
                id="msg-subject"
                name="msg-subject"
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                placeholder="e.g. Important update"
                style={{
                  width: '100%',
                  height: 38,
                  padding: '0 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--on-surface))',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="msg-body"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                }}
              >
                Message
              </label>
              <textarea
                id="msg-body"
                name="msg-body"
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Write your message..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--on-surface))',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setShowMessageModal(false)}
                disabled={isSendingMsg}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleSendMessage}
                disabled={isSendingMsg || !msgTitle.trim() || !msgBody.trim()}
              >
                {isSendingMsg ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
