/**
 * MomoDetailsEditor Component
 * -----------------------------------------------------------
 * Finance dashboard panel for managing the MTN MoMo merchant
 * number shown on the public donate page. Editable only by
 * roles with finance authority (same gate as bank details).
 */

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import { momoService, MOMO_EDITOR_ROLES, type MomoDetails } from '@/services/momoService'

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

const EMPTY: Omit<MomoDetails, 'updatedAt'> = {
  merchantNumber: '',
  merchantName: 'The Base Movement',
  network: 'MTN',
  isActive: true,
}

export function MomoDetailsEditor() {
  const [form, setForm] = useState<Omit<MomoDetails, 'updatedAt'>>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const role = adminService.getCurrentUser()?.role
  const canEdit = !!role && (MOMO_EDITOR_ROLES as readonly string[]).includes(role)

  useEffect(() => {
    momoService
      .getMomoDetails()
      .then(({ updatedAt: _u, ...rest }) => setForm(rest))
      .catch(() => setForm(EMPTY))
      .finally(() => setLoading(false))
  }, [])

  if (!canEdit) return null

  const save = async () => {
    setSaving(true)
    try {
      const res = await momoService.updateMomoDetails(form)
      if (res.success) {
        await adminService.logAction('UPDATE_MOMO_DETAILS', 'FINANCE/MOMO_DETAILS', 'Success')
        toast.success('MoMo details saved')
      } else {
        toast.error(res.error ?? 'Failed to save MoMo details')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save MoMo details')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            MTN MoMo merchant details
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            Shown on the public donate page as an alternative payment method.
          </p>
        </div>
        <img
          src="/branding/mtn-momo-logo.png"
          alt="MTN Mobile Money"
          style={{ width: 32, height: 32, objectFit: 'contain', flex: '0 0 auto' }}
        />
      </div>

      <div style={{ padding: 20 }}>
        <div
          className="settings-form-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}
        >
          {/* Merchant Number */}
          <div>
            <label htmlFor="momo-merchant-number" style={labelSt}>
              Merchant Number
            </label>
            <input
              id="momo-merchant-number"
              style={{ ...inputSt, fontFamily: 'monospace', letterSpacing: '0.06em' }}
              value={form.merchantNumber}
              placeholder="e.g. 0597567336"
              disabled={loading || saving}
              onChange={(e) => setForm((prev) => ({ ...prev, merchantNumber: e.target.value }))}
            />
          </div>

          {/* Merchant Name */}
          <div>
            <label htmlFor="momo-merchant-name" style={labelSt}>
              Merchant Name
            </label>
            <input
              id="momo-merchant-name"
              style={inputSt}
              value={form.merchantName}
              placeholder="The Base Movement"
              disabled={loading || saving}
              onChange={(e) => setForm((prev) => ({ ...prev, merchantName: e.target.value }))}
            />
          </div>

          {/* Network */}
          <div>
            <label htmlFor="momo-network" style={labelSt}>
              Network
            </label>
            <select
              id="momo-network"
              style={{ ...inputSt, cursor: 'pointer', appearance: 'none' }}
              value={form.network}
              disabled={loading || saving}
              onChange={(e) => setForm((prev) => ({ ...prev, network: e.target.value }))}
            >
              <option value="MTN">MTN MoMo</option>
              <option value="Telecel">Telecel Cash</option>
              <option value="AirtelTigo">AirtelTigo Money</option>
            </select>
          </div>
        </div>

        {/* Active toggle */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <input
            id="momo-is-active"
            type="checkbox"
            checked={form.isActive}
            disabled={loading || saving}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label
            htmlFor="momo-is-active"
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              cursor: 'pointer',
            }}
          >
            Show MoMo option on the public donate page
          </label>
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
            {saving ? 'Saving…' : 'Save MoMo details'}
          </button>
        </div>
      </div>
    </div>
  )
}
