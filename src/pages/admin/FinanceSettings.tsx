import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { DonationControlsPanel } from '@/components/admin/finance/DonationControlsPanel'
import { BankDetailsEditor } from '@/components/admin/BankDetailsEditor'
import { MomoDetailsEditor } from '@/components/admin/MomoDetailsEditor'
import { FinanceApprovalsTab } from './settings/components/FinanceApprovalsTab'

/**
 * Finance Officer's single home for everything they set/update:
 * donation controls, offline payment details (bank + MoMo), and the
 * fund-request approval thresholds. The Finance Dashboard stays analytics-only.
 */
export default function FinanceSettings() {
  return (
    <div className="main">
      <AdminPageHeader
        title="Finance Settings"
        description="Donation controls, payment details, and approval thresholds"
      />

      <DonationControlsPanel />

      <div style={{ marginTop: 24 }}>
        <BankDetailsEditor />
      </div>

      <div style={{ marginTop: 24 }}>
        <MomoDetailsEditor />
      </div>

      <div style={{ marginTop: 24 }}>
        <FinanceApprovalsTab />
      </div>
    </div>
  )
}
