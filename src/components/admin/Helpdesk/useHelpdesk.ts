/**
 * IT Helpdesk Custom React Hooks
 * -------------------------------------------------------------
 * Custom hooks managing helpdesk operations, queries, and mutations
 * for both administrative handlers and individual submitting members.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { discordService } from '@/services/discordService'
import type {
  HelpdeskDepartment,
  HelpdeskTicket,
  HelpdeskComment,
  HelpdeskAttachment,
  TicketFiltersState,
  TicketPriority,
  TicketStatus,
} from './types'

/**
 * buildTicketFromRow
 * -------------------------------------------------------------
 * Helper utility to map a raw database ticket response to a typed HelpdeskTicket structure.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTicketFromRow(row: any): HelpdeskTicket {
  return {
    id: row.id,
    department_id: row.department_id,
    department_name: row.helpdesk_departments?.name ?? row.department_id,
    department_icon: row.helpdesk_departments?.icon ?? 'help',
    subject: row.subject,
    description: row.description,
    priority: row.priority,
    status: row.status,
    submitted_by: row.submitted_by,
    submitter_name: row.submitter?.full_name ?? 'Unknown',
    assigned_to: row.assigned_to ?? null,
    assignee_name: row.assignee?.full_name ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/**
 * useHelpdesk
 * -------------------------------------------------------------
 * Hook managing the administrative queue workspace, comment/status/priority updates, and handler assignment.
 */
export function useHelpdesk(departmentId: string) {
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([])
  const [departments, setDepartments] = useState<HelpdeskDepartment[]>([])
  const [handlers, setHandlers] = useState<{ id: string; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TicketFiltersState>({ status: 'all', priority: 'all' })
  const [detail, setDetail] = useState<{
    ticket: HelpdeskTicket
    comments: HelpdeskComment[]
    attachments: HelpdeskAttachment[]
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('helpdesk_tickets')
      .select(
        `
        id, department_id, subject, description, priority, status,
        submitted_by, assigned_to, created_at, updated_at,
        submitter:users!submitted_by(full_name),
        assignee:users!assigned_to(full_name),
        helpdesk_departments(name, icon)
      `
      )
      .eq('department_id', departmentId)
      .order('updated_at', { ascending: false })

    if (filters.status !== 'all') query = query.eq('status', filters.status)
    if (filters.priority !== 'all') query = query.eq('priority', filters.priority)

    const { data, error } = await query
    if (error) {
      toast.error('Failed to load tickets')
      setLoading(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTickets((data ?? []).map((r: any) => buildTicketFromRow(r)))
    setLoading(false)
  }, [departmentId, filters])

  const fetchDepartments = useCallback(async () => {
    const { data } = await supabase
      .from('helpdesk_departments')
      .select('id, name, handler_roles, restricted_submitter_roles, icon, sort_order, active')
      .eq('active', true)
      .order('sort_order')
    setDepartments(data ?? [])
  }, [])

  const fetchHandlers = useCallback(async () => {
    const dept = await supabase
      .from('helpdesk_departments')
      .select('handler_roles')
      .eq('id', departmentId)
      .single()
    if (!dept.data?.handler_roles?.length) return
    const { data } = await supabase.from('users').select('id, full_name').order('full_name')
    setHandlers(data ?? [])
  }, [departmentId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDepartments()
  }, [fetchDepartments])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHandlers()
  }, [fetchHandlers])

  const loadDetail = useCallback(async (ticketId: string) => {
    setDetailLoading(true)
    const [ticketRes, commentsRes, attachmentsRes] = await Promise.all([
      supabase
        .from('helpdesk_tickets')
        .select(
          `
          id, department_id, subject, description, priority, status,
          submitted_by, assigned_to, created_at, updated_at,
          submitter:users!submitted_by(full_name),
          assignee:users!assigned_to(full_name),
          helpdesk_departments(name, icon)
        `
        )
        .eq('id', ticketId)
        .single(),
      supabase
        .from('helpdesk_comments')
        .select(
          'id, ticket_id, author_id, body, is_internal, created_at, users!author_id(full_name)'
        )
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true }),
      supabase
        .from('helpdesk_attachments')
        .select('id, ticket_id, uploaded_by, file_url, file_name, file_size, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true }),
    ])
    if (ticketRes.error) {
      toast.error('Failed to load ticket')
      setDetailLoading(false)
      return
    }
    setDetail({
      ticket: buildTicketFromRow(ticketRes.data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      comments: (commentsRes.data ?? []).map((c: any) => ({
        id: c.id,
        ticket_id: c.ticket_id,
        author_id: c.author_id,
        author_name: c.users?.full_name ?? 'Unknown',
        body: c.body,
        is_internal: c.is_internal,
        created_at: c.created_at,
      })),
      attachments: attachmentsRes.data ?? [],
    })
    setDetailLoading(false)
  }, [])

  const closeDetail = useCallback(() => setDetail(null), [])

  const updateStatus = useCallback(
    async (ticketId: string, status: TicketStatus, submittedBy: string) => {
      const { error } = await supabase
        .from('helpdesk_tickets')
        .update({ status })
        .eq('id', ticketId)
      if (error) {
        toast.error('Failed to update status')
        return false
      }
      toast.success('Status updated')
      if (status === 'resolved' || status === 'closed') {
        const ticket = tickets.find((t) => t.id === ticketId)
        await supabase.from('notifications').insert({
          user_id: submittedBy,
          title: `Ticket ${status}`,
          message: `Your ticket "${ticket?.subject ?? ''}" has been marked as ${status}.`,
          type: 'Helpdesk',
        })
        discordService.helpdeskTicketResolved(ticket?.subject ?? '', status)
      }
      await fetchTickets()
      if (detail?.ticket.id === ticketId) await loadDetail(ticketId)
      return true
    },
    [fetchTickets, detail, loadDetail, tickets]
  )

  const updatePriority = useCallback(
    async (ticketId: string, priority: TicketPriority) => {
      const { error } = await supabase
        .from('helpdesk_tickets')
        .update({ priority })
        .eq('id', ticketId)
      if (error) {
        toast.error('Failed to update priority')
        return false
      }
      toast.success('Priority updated')
      await fetchTickets()
      if (detail?.ticket.id === ticketId) await loadDetail(ticketId)
      return true
    },
    [fetchTickets, detail, loadDetail]
  )

  const assignTicket = useCallback(
    async (ticketId: string, userId: string | null) => {
      const { error } = await supabase
        .from('helpdesk_tickets')
        .update({ assigned_to: userId })
        .eq('id', ticketId)
      if (error) {
        toast.error('Failed to assign ticket')
        return false
      }
      toast.success(userId ? 'Ticket assigned' : 'Ticket unassigned')
      if (userId) {
        const subject = tickets.find((t) => t.id === ticketId)?.subject ?? ''
        const assignee = handlers.find((h) => h.id === userId)?.full_name ?? 'a handler'
        discordService.helpdeskTicketAssigned(subject, assignee)
      }
      await fetchTickets()
      if (detail?.ticket.id === ticketId) await loadDetail(ticketId)
      return true
    },
    [fetchTickets, detail, loadDetail, tickets, handlers]
  )

  const postComment = useCallback(
    async (
      ticketId: string,
      authorId: string,
      body: string,
      isInternal: boolean,
      submittedBy: string
    ) => {
      const { error } = await supabase.from('helpdesk_comments').insert({
        ticket_id: ticketId,
        author_id: authorId,
        body: body.trim(),
        is_internal: isInternal,
      })
      if (error) {
        toast.error('Failed to post comment')
        return false
      }
      if (!isInternal) {
        await supabase.from('notifications').insert({
          user_id: submittedBy,
          title: 'New reply on your ticket',
          message: body.trim().slice(0, 120),
          type: 'Helpdesk',
        })
      }
      await loadDetail(ticketId)
      return true
    },
    [loadDetail]
  )

  const closeTicket = useCallback(
    async (ticketId: string, submittedBy: string) => {
      return updateStatus(ticketId, 'closed', submittedBy)
    },
    [updateStatus]
  )

  const deleteTicket = useCallback(
    async (ticketId: string) => {
      const { error } = await supabase.from('helpdesk_tickets').delete().eq('id', ticketId)
      if (error) {
        toast.error('Failed to delete ticket')
        return false
      }
      toast.success('Ticket deleted')
      if (detail?.ticket.id === ticketId) closeDetail()
      await fetchTickets()
      return true
    },
    [fetchTickets, detail, closeDetail]
  )

  return {
    tickets,
    departments,
    handlers,
    loading,
    filters,
    setFilters,
    detail,
    detailLoading,
    loadDetail,
    closeDetail,
    updateStatus,
    updatePriority,
    assignTicket,
    postComment,
    closeTicket,
    deleteTicket,
  }
}

/**
 * useMemberHelpdesk
 * -------------------------------------------------------------
 * Hook managing member-facing ticket actions (loading, submitting new tickets with files, posting replies).
 */
export function useMemberHelpdesk(userId: string | null) {
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([])
  const [departments, setDepartments] = useState<HelpdeskDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<{
    ticket: HelpdeskTicket
    comments: HelpdeskComment[]
    attachments: HelpdeskAttachment[]
  } | null>(null)

  const fetchMyTickets = useCallback(async () => {
    if (!userId) {
      setTickets([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('helpdesk_tickets')
      .select(
        `
        id, department_id, subject, description, priority, status,
        submitted_by, assigned_to, created_at, updated_at,
        submitter:users!submitted_by(full_name),
        assignee:users!assigned_to(full_name),
        helpdesk_departments(name, icon)
      `
      )
      .eq('submitted_by', userId)
      .order('updated_at', { ascending: false })
    if (error) {
      toast.error('Failed to load tickets')
      setLoading(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTickets((data ?? []).map((r: any) => buildTicketFromRow(r)))
    setLoading(false)
  }, [userId])

  const fetchDepartments = useCallback(async () => {
    const { data } = await supabase
      .from('helpdesk_departments')
      .select('id, name, handler_roles, restricted_submitter_roles, icon, sort_order, active')
      .eq('active', true)
      .order('sort_order')
    setDepartments(data ?? [])
  }, [])

  useEffect(() => {
    if (!userId) {
      const clearTickets = async () => {
        setTickets([])
        setLoading(false)
      }
      void clearTickets()
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyTickets()
  }, [fetchMyTickets, userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDepartments()
  }, [fetchDepartments])

  const loadDetail = useCallback(async (ticketId: string) => {
    const [ticketRes, commentsRes, attachmentsRes] = await Promise.all([
      supabase
        .from('helpdesk_tickets')
        .select(
          `
          id, department_id, subject, description, priority, status,
          submitted_by, assigned_to, created_at, updated_at,
          submitter:users!submitted_by(full_name),
          assignee:users!assigned_to(full_name),
          helpdesk_departments(name, icon)
        `
        )
        .eq('id', ticketId)
        .single(),
      supabase
        .from('helpdesk_comments')
        .select(
          'id, ticket_id, author_id, body, is_internal, created_at, users!author_id(full_name)'
        )
        .eq('ticket_id', ticketId)
        .eq('is_internal', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('helpdesk_attachments')
        .select('id, ticket_id, uploaded_by, file_url, file_name, file_size, created_at')
        .eq('ticket_id', ticketId),
    ])
    if (ticketRes.error) {
      toast.error('Failed to load ticket')
      return
    }
    setDetail({
      ticket: buildTicketFromRow(ticketRes.data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      comments: (commentsRes.data ?? []).map((c: any) => ({
        id: c.id,
        ticket_id: c.ticket_id,
        author_id: c.author_id,
        author_name: c.users?.full_name ?? 'Unknown',
        body: c.body,
        is_internal: false,
        created_at: c.created_at,
      })),
      attachments: attachmentsRes.data ?? [],
    })
  }, [])

  const closeDetail = useCallback(() => setDetail(null), [])

  const submitTicket = useCallback(
    async (payload: {
      department_id: string
      subject: string
      description: string
      priority: 'low' | 'medium' | 'high'
      files: File[]
    }) => {
      if (!userId) {
        toast.error('Unable to submit ticket. User not signed in.')
        return false
      }
      const { data: ticket, error } = await supabase
        .from('helpdesk_tickets')
        .insert({
          department_id: payload.department_id,
          subject: payload.subject.trim(),
          description: payload.description.trim(),
          priority: payload.priority,
          submitted_by: userId,
        })
        .select('id')
        .single()
      if (error || !ticket) {
        toast.error('Failed to submit ticket')
        return false
      }

      for (const file of payload.files) {
        const path = `${ticket.id}/${Date.now()}-${file.name}`
        const { data: upload, error: uploadErr } = await supabase.storage
          .from('helpdesk-attachments')
          .upload(path, file, { upsert: false })
        if (uploadErr) {
          console.error('Attachment upload failed', uploadErr)
          continue
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from('helpdesk-attachments').getPublicUrl(upload.path)
        await supabase.from('helpdesk_attachments').insert({
          ticket_id: ticket.id,
          uploaded_by: userId,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
        })
      }

      toast.success('Ticket submitted')
      discordService.helpdeskTicketSubmitted(payload.subject.trim(), payload.priority)
      await fetchMyTickets()
      return true
    },
    [userId, fetchMyTickets]
  )

  const postComment = useCallback(
    async (ticketId: string, body: string) => {
      if (!userId) {
        toast.error('Unable to post comment. User not signed in.')
        return false
      }
      const { error } = await supabase.from('helpdesk_comments').insert({
        ticket_id: ticketId,
        author_id: userId,
        body: body.trim(),
        is_internal: false,
      })
      if (error) {
        toast.error('Failed to post comment')
        return false
      }
      await loadDetail(ticketId)
      return true
    },
    [userId, loadDetail]
  )

  return {
    tickets,
    departments,
    loading,
    detail,
    loadDetail,
    closeDetail,
    submitTicket,
    postComment,
  }
}
