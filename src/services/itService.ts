import { supabase } from '@/lib/supabase'

export const itService = {
  // ── System ──
  async getDbStats() {
    const { data } = await supabase.rpc('get_db_stats')
    return data
  },

  async getAuditLogs(dateFrom: string, dateTo: string, sortDir: 'asc' | 'desc') {
    const { data } = await supabase
      .from('system_audit_logs')
      .select('*, user:users!user_id(full_name)')
      .gte('created_at', dateFrom + 'T00:00:00Z')
      .lte('created_at', dateTo + 'T23:59:59Z')
      .order('created_at', { ascending: sortDir === 'asc' })
    return data ?? []
  },

  // ── Dashboard ──
  async getDashboardCounts() {
    const [
      { count: total },
      { count: completed },
      { count: activeTodos },
      { count: pendingTickets },
      { count: totalAssets },
      { count: assignedAssets },
      { count: damagedAssets },
      { count: unresolvedAlerts },
    ] = await Promise.all([
      supabase.from('it_projects').select('*', { count: 'exact', head: true }),
      supabase
        .from('it_projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
      supabase.from('it_todos').select('*', { count: 'exact', head: true }).neq('status', 'done'),
      supabase
        .from('it_tickets')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'in-progress']),
      supabase.from('assets').select('*', { count: 'exact', head: true }).eq('department_id', 'it'),
      supabase
        .from('asset_assignments')
        .select('assets!inner(department_id)', { count: 'exact', head: true })
        .eq('assets.department_id', 'it')
        .is('checked_in_at', null),
      supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', 'it')
        .eq('condition', 'damaged'),
      supabase
        .from('asset_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('resolved', false),
    ])
    return {
      totalProjects: total ?? 0,
      completedProjects: completed ?? 0,
      activeTodos: activeTodos ?? 0,
      pendingTickets: pendingTickets ?? 0,
      totalAssets: totalAssets ?? 0,
      assignedAssets: assignedAssets ?? 0,
      damagedAssets: damagedAssets ?? 0,
      unresolvedAlerts: unresolvedAlerts ?? 0,
    }
  },

  // ── Projects ──
  async getProjects() {
    const { data, error } = await supabase
      .from('it_projects')
      .select('id, title, description, status, start_date, end_date, created_at, created_by')
      .order('created_at', { ascending: false })
    if (error) throw error
    const creatorIds = [
      ...new Set((data ?? []).map((p) => p.created_by).filter(Boolean)),
    ] as string[]
    let nameMap: Record<string, string> = {}
    if (creatorIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', creatorIds)
      nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
    }
    return (data ?? []).map((p) => ({
      id: p.id as string,
      title: p.title as string,
      description: p.description as string | null,
      status: p.status as string,
      start_date: p.start_date as string | null,
      end_date: p.end_date as string | null,
      created_at: p.created_at as string,
      author_name: nameMap[p.created_by] ?? 'Unknown',
    }))
  },

  async updateProjectStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from('it_projects').update({ status }).eq('id', id)
    if (error) throw error
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from('it_projects').delete().eq('id', id)
    if (error) throw error
  },

  async upsertProject(id: string | null, payload: Record<string, unknown>): Promise<void> {
    if (id) {
      const { error } = await supabase.from('it_projects').update(payload).eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('it_projects').insert(payload)
      if (error) throw error
    }
  },

  // ── Licenses ──
  async getLicenses() {
    const { data, error } = await supabase
      .from('it_licenses')
      .select('*')
      .order('renewal_date', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async upsertLicense(id: string | null, payload: Record<string, unknown>): Promise<void> {
    const { error } = id
      ? await supabase.from('it_licenses').update(payload).eq('id', id)
      : await supabase.from('it_licenses').insert(payload)
    if (error) throw error
  },

  async deleteLicense(id: string): Promise<void> {
    const { error } = await supabase.from('it_licenses').delete().eq('id', id)
    if (error) throw error
  },

  // ── Todos ──
  async getTodos() {
    const { data, error } = await supabase
      .from('it_todos')
      .select('id, task, status, assignee_id, due_date, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    const assigneeIds = [
      ...new Set((data ?? []).map((t) => t.assignee_id).filter(Boolean)),
    ] as string[]
    let nameMap: Record<string, string> = {}
    if (assigneeIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', assigneeIds)
      nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
    }
    return (data ?? []).map((t) => ({
      id: t.id as string,
      task: t.task as string,
      status: t.status as string,
      assignee_id: t.assignee_id as string | null,
      due_date: t.due_date as string | null,
      created_at: t.created_at as string,
      assignee_name: t.assignee_id ? (nameMap[t.assignee_id] ?? null) : null,
    }))
  },

  async updateTodoStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase.from('it_todos').update({ status }).eq('id', id)
    if (error) throw error
  },

  async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase.from('it_todos').delete().eq('id', id)
    if (error) throw error
  },

  async createTodo(payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('it_todos').insert(payload)
    if (error) throw error
  },

  // ── Notes ──
  async getNotes() {
    const { data, error } = await supabase
      .from('it_notes')
      .select(
        'id, title, content, color_theme, author_id, created_at, archived_at, it_note_comments(count)'
      )
      .order('created_at', { ascending: false })
    if (error) throw error
    const authorIds = [...new Set((data ?? []).map((n) => n.author_id).filter(Boolean))] as string[]
    let nameMap: Record<string, string> = {}
    if (authorIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', authorIds)
      nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
    }
    return (data ?? []).map((n) => ({
      id: n.id as string,
      title: n.title as string,
      content: n.content as string,
      color_theme: n.color_theme as string,
      author_id: n.author_id as string,
      author_name: nameMap[n.author_id as string] ?? 'Unknown',
      created_at: n.created_at as string,
      archived_at: (n.archived_at as string | null) ?? null,
      comment_count: Array.isArray(n.it_note_comments)
        ? ((n.it_note_comments[0] as { count?: number })?.count ?? 0)
        : 0,
    }))
  },

  async createNote(payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('it_notes').insert(payload)
    if (error) throw error
  },

  async createNoteComment(payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('it_note_comments').insert(payload)
    if (error) throw error
  },

  // ── Tickets ──
  async getTickets() {
    const { data, error } = await supabase
      .from('it_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getTicketAdmins() {
    const { data } = await supabase.from('admins').select('id, users(full_name)')
    return data ?? []
  },

  async updateTicket(id: string, payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('it_tickets').update(payload).eq('id', id)
    if (error) throw error
  },

  async deleteTicket(id: string): Promise<void> {
    const { error } = await supabase.from('it_tickets').delete().eq('id', id)
    if (error) throw error
  },

  async getTicketById(id: string) {
    const { data } = await supabase.from('it_tickets').select('*').eq('id', id).maybeSingle()
    return data
  },

  async getTicketComments(ticketId: string) {
    const { data } = await supabase
      .from('it_ticket_comments')
      .select('*, user:users!user_id(full_name, avatar_url)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    return data ?? []
  },

  async addTicketComment(payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('it_ticket_comments').insert(payload)
    if (error) throw error
  },

  // ── Security ──
  async uploadSecurityProtocol(file: File, path: string) {
    const { error } = await supabase.storage.from('it-security-protocols').upload(path, file)
    if (error) throw error
    return supabase.storage.from('it-security-protocols').getPublicUrl(path).data.publicUrl
  },

  async createSecurityProtocol(payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('it_security_protocols').insert(payload)
    if (error) throw error
  },

  async deleteSecurityProtocol(id: string, storagePath?: string): Promise<void> {
    if (storagePath) {
      await supabase.storage.from('it-security-protocols').remove([storagePath])
    }
    const { error } = await supabase.from('it_security_protocols').delete().eq('id', id)
    if (error) throw error
  },

  // ── Hierarchy ──
  async searchAdmins(query: string) {
    const { data } = await supabase
      .from('admins')
      .select('id, role, users!inner(full_name, avatar_url)')
      .ilike('users.full_name', `%${query}%`)
      .limit(8)
    return data ?? []
  },

  async insertHierarchyNode(payload: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from('it_hierarchy').insert(payload)
    if (error) throw error
  },

  async getHierarchy() {
    const { data, error } = await supabase
      .from('it_hierarchy')
      .select('id, user_id, reports_to, role_title')
    if (error) throw error
    const allIds = [
      ...new Set((data ?? []).flatMap((r) => [r.user_id, r.reports_to].filter(Boolean))),
    ] as string[]
    let nameMap: Record<string, string> = {}
    let avatarMap: Record<string, string | null> = {}
    if (allIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', allIds)
      nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
      avatarMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.avatar_url ?? null]))
    }
    return (data ?? []).map((r) => ({
      id: r.id as string,
      user_id: r.user_id as string,
      reports_to: r.reports_to as string | null,
      role_title: r.role_title as string,
      full_name: nameMap[r.user_id] ?? 'Unknown',
      avatar_url: avatarMap[r.user_id] ?? null,
    }))
  },

  async relinkHierarchyChildren(userId: string, newParentId: string | null): Promise<void> {
    const { error } = await supabase
      .from('it_hierarchy')
      .update({ reports_to: newParentId })
      .eq('reports_to', userId)
    if (error) throw error
  },

  async deleteHierarchyNode(userId: string): Promise<void> {
    const { error } = await supabase.from('it_hierarchy').delete().eq('user_id', userId)
    if (error) throw error
  },

  // ── Auth helper ──
  async getCurrentUserId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  },
}
