/**
 * BankDetailsEditor Component
 * -------------------------------------------------------------
 * Provides a management panel for editing movement bank details.
 * Visible and editable only by eligible roles (like SUPER_ADMIN or FINANCE_OFFICER).
 * Audits updates into system logs.
 */

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import { PanelHeaderBar } from '@/components/admin/finance/PanelHeaderBar'
import {
  bankDetailsService,
  BANK_DETAILS_EDITOR_ROLES,
  type BankTransferDetails,
} from '@/services/bankDetailsService'

const FIELDS: {
  key: keyof Omit<BankTransferDetails, 'updatedAt'>
  label: string
  placeholder: string
  full?: boolean
}[] = [
  { key: 'bankName', label: 'Bank Name', placeholder: 'CBG' },
  { key: 'accountName', label: 'Account Name', placeholder: 'THE BASE MOVEMENT LBG' },
  { key: 'accountNumber', label: 'Account Number', placeholder: '2497625640001' },
  { key: 'swiftCode', label: 'Swift Code', placeholder: 'CBGHGHAC' },
  { key: 'branch', label: 'Branch', placeholder: 'Kwabenya' },
  { key: 'address', label: 'Address', placeholder: 'Street, City, Region, Country' },
]

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-semibold, 600)',
  fontSize: 11,
  color: 'hsl(var(--on-surface-muted))',
  display: 'block',
  marginBottom: 6,
}

const inputSt: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 12,
  borderRadius: 'var(--radius-sm)',
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

const EMPTY: Omit<BankTransferDetails, 'updatedAt'> = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  swiftCode: '',
  branch: '',
  address: '',
}

/**
 * Editor for the movement's bank-transfer details shown on the public donate
 * page. Renders only for the roles allowed to edit (DB RLS is the real gate).
 */
export function BankDetailsEditor() {
  const [form, setForm] = useState<Omit<BankTransferDetails, 'updatedAt'>>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const role = adminService.getCurrentUser()?.role
  const canEdit = !!role && (BANK_DETAILS_EDITOR_ROLES as readonly string[]).includes(role)

  useEffect(() => {
    bankDetailsService
      .getBankDetails()
      .then(({ updatedAt: _updatedAt, ...rest }) => setForm(rest))
      .catch(() => setForm(EMPTY))
      .finally(() => setLoading(false))
  }, [])

  if (!canEdit) return null

  /**
   * save
   * -------------------------------------------------------------
   * Submits form bank credentials, invokes audit-logging, and displays success toast.
   */
  const save = async () => {
    setSaving(true)
    try {
      const res = await bankDetailsService.updateBankDetails(form)
      if (res.success) {
        await adminService.logAction('UPDATE_BANK_DETAILS', 'FINANCE/BANK_DETAILS', 'Success')
        toast.success('Bank details saved')
      } else {
        toast.error(res.error ?? 'Failed to save bank details')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save bank details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel">
      <PanelHeaderBar
        flush
        icon="account_balance"
        title="Bank transfer details"
        subtitle="Shown on the public donate page for offline contributions."
      />

      <div style={{ padding: 20 }}>
        <div
          className="settings-form-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}
        >
          {FIELDS.map((f) => (
            <div key={f.key} style={f.full ? { gridColumn: '1 / -1' } : undefined}>
              <label htmlFor={`bank-${f.key}`} style={labelSt}>
                {f.label}
              </label>
              <input
                id={`bank-${f.key}`}
                style={inputSt}
                value={form[f.key]}
                placeholder={f.placeholder}
                disabled={loading || saving}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            className="btn btn-primary"
            style={{ minWidth: 180, justifyContent: 'center' }}
            disabled={loading || saving}
            onClick={save}
          >
            {saving ? 'Saving…' : 'Save bank details'}
          </button>
        </div>
      </div>
    </div>
  )
}
