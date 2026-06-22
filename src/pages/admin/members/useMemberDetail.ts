/**
 * Member Detail Hook
 * -------------------------------------------------------------
 * Reusable hook for loading and managing detail views of a selected member record.
 * Handles fetching activity logs, donation logs, poll votes, session data, and notes.
 */

import { useState, useEffect } from 'react'
import {
  adminService,
  type Member,
  type AuditLogEntry,
  type MemberDonation,
  type MemberPollVote,
  type MemberSession,
  type MemberNote,
} from '@/services/adminService'
import { toast } from 'sonner'

// Custom React hook managing member metadata and tabs state
export function useMemberDetail() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState<
    'activity' | 'identity' | 'donations' | 'polls' | 'sessions' | 'notes' | 'card'
  >('activity')
  const [detailLogs, setDetailLogs] = useState<AuditLogEntry[]>([])
  const [memberDonations, setMemberDonations] = useState<MemberDonation[]>([])
  const [memberPollVotes, setMemberPollVotes] = useState<MemberPollVote[]>([])
  const [memberSessions, setMemberSessions] = useState<MemberSession[]>([])
  const [memberNotes, setMemberNotes] = useState<MemberNote[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!selectedMember) {
        setDetailLogs([])
        setMemberDonations([])
        setMemberPollVotes([])
        setMemberSessions([])
        setMemberNotes([])
        return
      }
      setActiveDetailTab('activity')

      adminService
        .getAuditLogsForResource(`MEMBERS/${selectedMember.id}`)
        .then(setDetailLogs)
        .catch(() => {})

      const targetId = selectedMember.authId || selectedMember.id

      Promise.allSettled([
        adminService.getMemberDonations(targetId).then(setMemberDonations),
        adminService.getMemberPollVotes(targetId).then(setMemberPollVotes),
        adminService.getMemberSessions(targetId).then(setMemberSessions),
        adminService.getMemberNotes(targetId).then(setMemberNotes),
      ])
    }, 0)
    return () => clearTimeout(timer)
  }, [selectedMember])

  // Append new administrative note to target member's audit record history log
  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !selectedMember) return
    setIsSubmittingNote(true)
    try {
      const admin = adminService.getCurrentUser()
      const targetId = selectedMember.authId || selectedMember.id
      const newNote = await adminService.addMemberNote(
        targetId,
        admin?.name || 'Admin',
        admin?.role || 'Staff',
        newNoteContent
      )
      if (newNote) {
        setMemberNotes((prev) => [newNote, ...prev])
        setNewNoteContent('')
        toast.success('Note recorded in member history.')
      }
    } catch (error) {
      console.error('[ADMIN] Note submission failed:', error)
      toast.error('Failed to persist administrative note.')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  return {
    selectedMember,
    setSelectedMember,
    activeDetailTab,
    setActiveDetailTab,
    detailLogs,
    memberDonations,
    memberPollVotes,
    memberSessions,
    memberNotes,
    newNoteContent,
    setNewNoteContent,
    isSubmittingNote,
    handleAddNote,
  }
}
