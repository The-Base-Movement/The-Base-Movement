import { Helpdesk } from '@/components/admin/Helpdesk'
import { useITLayout } from './ITLayoutContext'

export default function ITHelpdesk() {
  useITLayout('IT Helpdesk', 'confirmation_number', 'Manage IT support tickets from the team.')
  return <Helpdesk departmentId="it" />
}
