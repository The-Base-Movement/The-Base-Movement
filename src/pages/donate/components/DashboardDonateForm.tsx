import type { FormEvent } from 'react'
import type { DonationCampaign } from '@/types/admin'

interface FormData {
  fullName: string
  phone: string
  amount: string
  country: string
  membershipNumber: string
  showOnDashboard: boolean
  campaignId: string
  memberId: string
}

interface DashboardDonateFormProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  campaigns: DonationCampaign[]
  onSubmit: (e: FormEvent) => void
}

export function DashboardDonateForm({
  formData,
  setFormData,
  campaigns,
  onSubmit,
}: DashboardDonateFormProps) {
  return (
    <div className="panel">
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div>
          <p
            style={{
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Make a Contribution
          </p>
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
              fontWeight: 500,
            }}
          >
            Support an active campaign
          </p>
        </div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
        >
          volunteer_activism
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: '18px 18px 20px',
        }}
      >
        <div>
          <label
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Campaign
          </label>
          <select
            name="name-badabb"
            id="select-badabb"
            autoComplete="off"
            value={formData.campaignId}
            onChange={(e) => setFormData((prev) => ({ ...prev, campaignId: e.target.value }))}
            style={{
              width: '100%',
              height: 40,
              padding: '0 10px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--on-surface))',
              boxSizing: 'border-box',
            }}
          >
            {campaigns.length === 0 && <option value="">No active campaigns</option>}
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Amount (GHS)
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 13,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              ₵
            </span>
            <input
              aria-label="0.00"
              name="name-ded56b"
              id="input-ded56b"
              type="number"
              placeholder="0.00"
              autoComplete="off"
              value={formData.amount}
              onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
              required
              style={{
                width: '100%',
                height: 40,
                paddingLeft: 24,
                paddingRight: 10,
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {['50', '100', '200', '500'].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, amount: amt }))}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: formData.amount === amt ? 'hsl(var(--primary))' : '#fff',
                  color: formData.amount === amt ? '#fff' : 'hsl(var(--on-surface-muted))',
                  transition: 'all 0.15s',
                }}
              >
                ₵{amt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Full Name
          </label>
          <input
            name="name-46ec53"
            id="input-46ec53"
            type="text"
            autoComplete="name"
            value={formData.fullName}
            onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
            required
            style={{
              width: '100%',
              height: 40,
              padding: '0 10px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            MoMo Number
          </label>
          <input
            aria-label="024XXXXXXX"
            name="name-4a990b"
            id="input-4a990b"
            type="tel"
            placeholder="024XXXXXXX"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            required
            style={{
              width: '100%',
              height: 40,
              padding: '0 10px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            background: 'hsl(var(--container-low))',
            borderRadius: 4,
            border: '1px solid hsl(var(--border))',
          }}
        >
          <input
            name="name-cc8da6"
            type="checkbox"
            id="showOnDashboard"
            checked={formData.showOnDashboard}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, showOnDashboard: e.target.checked }))
            }
            style={{
              width: 16,
              height: 16,
              accentColor: 'hsl(var(--primary))',
              cursor: 'pointer',
            }}
          />
          <label
            htmlFor="showOnDashboard"
            style={{
              fontSize: 12,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              cursor: 'pointer',
            }}
          >
            Show my name in public ledger
          </label>
        </div>

        <button type="submit" className="btn btn-primary" style={{ height: 44, marginTop: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            favorite
          </span>
          Submit Contribution
        </button>
      </form>
    </div>
  )
}
