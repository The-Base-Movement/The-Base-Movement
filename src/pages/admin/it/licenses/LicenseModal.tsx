import { useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import type { Category, LicenseStatus, BillingCycle, LicenseFormData } from './types'
import { CATEGORIES, inputSt, labelSt } from './types'

interface LicenseModalProps {
  isOpen: boolean
  mode: 'add' | 'edit'
  initialData: LicenseFormData
  saving: boolean
  onClose: () => void
  onSave: (data: LicenseFormData) => void
}

export function LicenseModal({
  isOpen,
  mode,
  initialData,
  saving,
  onClose,
  onSave,
}: LicenseModalProps) {
  const [formData, setFormData] = useState<LicenseFormData>(initialData)

  if (!isOpen) return null

  const patchData = (patch: Partial<LicenseFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }

  const handleSubmit = () => {
    if (!formData.software_name.trim()) {
      toast.error('Software name is required')
      return
    }
    if (!formData.vendor.trim()) {
      toast.error('Vendor is required')
      return
    }
    if (!formData.renewal_date) {
      toast.error('Renewal date is required')
      return
    }
    if (formData.cost <= 0) {
      toast.error('Cost must be greater than 0')
      return
    }
    onSave(formData)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'relative',
          background: 'hsl(var(--background))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          fontFamily: "'Public Sans', sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {mode === 'add' ? 'Add License' : 'Edit License'}
          </h3>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt} htmlFor="lic-name">
                Software Name *
              </label>
              <input
                id="lic-name"
                name="licName"
                type="text"
                autoComplete="off"
                value={formData.software_name}
                onChange={(e) => patchData({ software_name: e.target.value })}
                placeholder="e.g. Vercel"
                style={inputSt}
              />
            </div>
            <div>
              <label style={labelSt} htmlFor="lic-vendor">
                Vendor *
              </label>
              <input
                id="lic-vendor"
                name="licVendor"
                type="text"
                autoComplete="off"
                value={formData.vendor}
                onChange={(e) => patchData({ vendor: e.target.value })}
                placeholder="e.g. Vercel Inc."
                style={inputSt}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt} htmlFor="lic-category">
                Category *
              </label>
              <select
                id="lic-category"
                name="licCategory"
                value={formData.category}
                onChange={(e) => patchData({ category: e.target.value as Category })}
                style={inputSt}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelSt} htmlFor="lic-status">
                Status *
              </label>
              <select
                id="lic-status"
                name="licStatus"
                value={formData.status}
                onChange={(e) => patchData({ status: e.target.value as LicenseStatus })}
                style={inputSt}
              >
                {(['Active', 'Inactive', 'Cancelled'] as LicenseStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelSt} htmlFor="lic-cost">
                Cost (GH₵) *
              </label>
              <input
                id="lic-cost"
                name="licCost"
                type="number"
                min="0"
                step="0.01"
                autoComplete="off"
                value={formData.cost || ''}
                onChange={(e) => patchData({ cost: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                style={inputSt}
              />
            </div>
            <div>
              <label style={labelSt} htmlFor="lic-cycle">
                Billing Cycle *
              </label>
              <select
                id="lic-cycle"
                name="licCycle"
                value={formData.billing_cycle}
                onChange={(e) => patchData({ billing_cycle: e.target.value as BillingCycle })}
                style={inputSt}
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <div>
              <label style={labelSt} htmlFor="lic-renewal">
                Renewal Date *
              </label>
              <input
                id="lic-renewal"
                name="licRenewal"
                type="date"
                autoComplete="off"
                value={formData.renewal_date}
                onChange={(e) => patchData({ renewal_date: e.target.value })}
                style={inputSt}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 2 }}>
              <input
                id="lic-autorenew"
                name="licAutoRenew"
                type="checkbox"
                checked={formData.auto_renew}
                onChange={(e) => patchData({ auto_renew: e.target.checked })}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: 'hsl(var(--primary))',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="lic-autorenew"
                style={{ fontSize: 13, color: 'hsl(var(--on-surface))', cursor: 'pointer' }}
              >
                Auto-renew
              </label>
            </div>
          </div>
          <div>
            <label style={labelSt} htmlFor="lic-url">
              URL (billing portal)
            </label>
            <input
              id="lic-url"
              name="licUrl"
              type="url"
              autoComplete="off"
              value={formData.url ?? ''}
              onChange={(e) => patchData({ url: e.target.value })}
              placeholder="https://billing.example.com"
              style={inputSt}
            />
          </div>
          <div>
            <label style={labelSt} htmlFor="lic-notes">
              Notes
            </label>
            <textarea
              id="lic-notes"
              name="licNotes"
              autoComplete="off"
              value={formData.notes ?? ''}
              onChange={(e) => patchData({ notes: e.target.value })}
              rows={3}
              placeholder="Account email, seat count, login details…"
              style={{ ...inputSt, padding: '8px 12px', resize: 'vertical' }}
            />
          </div>
        </div>
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : mode === 'add' ? 'Add License' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
