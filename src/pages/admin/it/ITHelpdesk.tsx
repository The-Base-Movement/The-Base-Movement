import { useEffect } from 'react'
import { Helpdesk } from '@/components/admin/Helpdesk'
import { useITLayout } from './ITLayoutContext'
import { usePageLabel } from '@/contexts/PageLabelContext'

export default function ITHelpdesk() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('IT Helpdesk')
  }, [setCurrentLabel])

  useITLayout('IT Helpdesk', 'confirmation_number', 'Manage IT support tickets from the team.')
  return <Helpdesk departmentId="it" />
}
