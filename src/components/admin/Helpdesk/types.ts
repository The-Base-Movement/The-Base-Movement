export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed'

export interface HelpdeskDepartment {
  id: string
  name: string
  handler_roles: string[]
  restricted_submitter_roles: string[] | null
  icon: string
  sort_order: number
  active: boolean
  lead_id?: string | null
}

export interface HelpdeskTicket {
  id: string
  department_id: string
  department_name: string
  department_icon: string
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  submitted_by: string
  submitter_name: string
  assigned_to: string | null
  assignee_name: string | null
  created_at: string
  updated_at: string
}

export interface HelpdeskComment {
  id: string
  ticket_id: string
  author_id: string
  author_name: string
  body: string
  is_internal: boolean
  created_at: string
}

export interface HelpdeskAttachment {
  id: string
  ticket_id: string
  uploaded_by: string
  file_url: string
  file_name: string
  file_size: number | null
  created_at: string
}

export interface HelpdeskProps {
  departmentId: string
}

export interface TicketFiltersState {
  status: TicketStatus | 'all'
  priority: TicketPriority | 'all'
}
