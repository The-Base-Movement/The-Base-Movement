import { OrgChart } from './components/OrgChart'
import { useITLayout } from './ITLayoutContext'

export default function ITHierarchy() {
  useITLayout('Team Hierarchy', 'account_tree', 'IT department org chart and reporting structure.')
  return <OrgChart />
}
