import { describe, it, expect } from 'vitest'
import { buildTicketFromRow } from '../components/admin/Helpdesk/useHelpdesk'

describe('buildTicketFromRow', () => {
  it('maps joined DB row to Ticket shape', () => {
    const row = {
      id: 't1',
      department_id: 'national-ict',
      subject: 'Printer broken',
      description: 'The printer on floor 3 is not working.',
      priority: 'high',
      status: 'open',
      submitted_by: 'u1',
      assigned_to: null,
      created_at: '2026-06-05T10:00:00Z',
      updated_at: '2026-06-05T10:00:00Z',
      submitter: { full_name: 'Kwame Asante' },
      assignee: null,
      helpdesk_departments: { name: 'National ICT', icon: 'computer' },
    }
    const ticket = buildTicketFromRow(row)
    expect(ticket.submitter_name).toBe('Kwame Asante')
    expect(ticket.assignee_name).toBeNull()
    expect(ticket.department_name).toBe('National ICT')
  })
})
