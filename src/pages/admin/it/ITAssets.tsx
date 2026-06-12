import { AssetInventory } from '@/components/admin/AssetInventory'
import { useITLayout } from './ITLayoutContext'

const DEPT_ID = 'it'

export default function ITAssets() {
  useITLayout('Asset Inventory', 'inventory_2', 'Track, assign, and maintain IT department assets')

  return <AssetInventory departmentId={DEPT_ID} viewMode="department" />
}
