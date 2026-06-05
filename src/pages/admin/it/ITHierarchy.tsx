import { useEffect } from 'react'
import { OrgChart } from './components/OrgChart'
import { useITLayout } from './ITLayoutContext'
import { usePageLabel } from '@/contexts/PageLabelContext'

export default function ITHierarchy() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('Team Hierarchy')
  }, [setCurrentLabel])

  useITLayout('Team Hierarchy', 'account_tree', 'IT department org chart and reporting structure.')
  return <OrgChart />
}
