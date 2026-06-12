export type TicketPriority = 'low' | 'medium' | 'high'
export type TicketStatus = 'open' | 'in-progress' | 'resolved'

export interface ITTicket {
  id: string
  title: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  submitted_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  submitter_name: string
  assignee_name: string | null
}

export interface AdminStub {
  id: string
  name: string
}
