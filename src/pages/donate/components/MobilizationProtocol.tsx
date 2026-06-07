import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { DonationCampaign } from '@/types/admin'
import type { CurrencyInfo } from '@/lib/currency'
import { formatCurrencyAmount, formatGhsAmount } from '@/lib/currency'

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

interface Country {
  id: string | number
  name: string
  dialing_code: string
  is_diaspora: boolean
}

interface MobilizationProtocolProps {
  activeStep: number
  setActiveStep: (step: number) => void
  formData: FormData
  setFormData: Dispatch<SetStateAction<FormData>>
  isLoggedIn: boolean
  countriesLoading: boolean
  countries: Country[]
  currency: CurrencyInfo
  ghsAmount: number
  campaigns: DonationCampaign[]
  paymentState: 'idle' | 'starting' | 'checkout' | 'failed' | 'processing'
  checkoutUrl: string | null
  onSubmit: (e: FormEvent) => void
  onReopenCheckout: () => void
  onOpenAudit: () => void
}

const fieldLabelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  background: 'hsl(var(--background))',
  color: 'hsl(var(--on-surface))',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

function statusCopy(paymentState: MobilizationProtocolProps['paymentState']) {
  if (paymentState === 'failed') {
    return {
      icon: 'error',
      title: 'Payment not confirmed',
      body: 'The payment was not completed. You can retry with the secure checkout.',
      tone: 'hsl(var(--destructive))',
    }
  }
  if (paymentState === 'checkout') {
    return {
      icon: 'hourglass_empty',
      title: 'Waiting for confirmation',
      body: 'Complete payment in the secure checkout window. This page will update automatically.',
      tone: 'hsl(var(--accent))',
    }
  }
  if (paymentState === 'starting') {
    return {
      icon: 'lock_open',
      title: 'Opening secure checkout',
      body: 'Your payment session is being prepared. This should only take a moment.',
      tone: 'hsl(var(--primary))',
    }
  }
  return {
    icon: 'verified_user',
    title: 'Ready for secure payment',
    body: 'Submit your details to complete payment by mobile money or card.',
    tone: 'hsl(var(--primary))',
  }
}

function SelectIcon() {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 18,
        color: 'hsl(var(--on-surface-muted))',
        pointerEvents: 'none',
      }}
    >
      expand_more
    </span>
  )
}

export function MobilizationProtocol({
  activeStep,
  setActiveStep,
  formData,
  setFormData,
  isLoggedIn,
  countriesLoading,
  countries,
  currency,
  ghsAmount,
  campaigns,
  paymentState,
  checkoutUrl,
  onSubmit,
  onReopenCheckout,
  onOpenAudit,
}: MobilizationProtocolProps) {
  const status = statusCopy(paymentState)
  const quickAmounts = ['50', '100', '250', '500']
  const selectedCampaign = campaigns.find((campaign) => campaign.id === formData.campaignId)
  const steps = [
    { id: 1, label: 'Amount' },
    { id: 2, label: 'Profile' },
    { id: 3, label: 'Link' },
    { id: 4, label: 'Confirm' },
  ]

  return (
    <section
      id="donor-section"
      style={{
        paddingTop: 56,
        scrollMarginTop: 120,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 18,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'hsl(var(--primary))',
            }}
          >
            Contribution desk
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 26,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              letterSpacing: '0',
              lineHeight: 1.15,
            }}
          >
            Fund the work directly from this page.
          </h2>
          <p
            style={{
              margin: '10px 0 0',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 620,
            }}
          >
            Choose an amount, link it to a movement priority, and complete payment in a secure
            checkout window. No copied payment instructions are required.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onOpenAudit}
          style={{ flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            receipt_long
          </span>
          View ledger
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 8,
          marginBottom: 18,
        }}
      >
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={
              activeStep === step.id ? 'btn btn-active-tab btn-sm' : 'btn btn-inactive-tab btn-sm'
            }
            onClick={() => {
              setActiveStep(step.id)
              document
                .getElementById(step.id === 4 ? 'receipt-section' : 'donor-section')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            style={{ justifyContent: 'center', minWidth: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {activeStep > step.id ? 'check' : 'radio_button_unchecked'}
            </span>
            {step.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        <form
          onSubmit={onSubmit}
          id="donationForm"
          className="panel"
          style={{
            flex: '1 1 520px',
            minWidth: 0,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Contribution details
              </p>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Mobile money and card payments are supported.
              </p>
            </div>
            <span className="pill pill-ok">Secure</span>
          </div>

          <div
            style={{
              padding: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <div>
              <label htmlFor="country" style={fieldLabelStyle}>
                Country
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="donation-country"
                  id="country"
                  required
                  autoComplete="country-name"
                  value={formData.country}
                  onChange={(e) => {
                    setFormData({ ...formData, country: e.target.value })
                    setActiveStep(1)
                  }}
                  disabled={countriesLoading}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    padding: '0 40px 0 12px',
                    cursor: countriesLoading ? 'wait' : 'pointer',
                  }}
                >
                  {countriesLoading ? (
                    <option>Loading countries...</option>
                  ) : countries.length > 0 ? (
                    countries.map((country) => (
                      <option key={country.id} value={country.name}>
                        {country.name}
                      </option>
                    ))
                  ) : (
                    <option value="Ghana">Ghana</option>
                  )}
                </select>
                <SelectIcon />
              </div>
            </div>

            <div>
              <label htmlFor="campaign" style={fieldLabelStyle}>
                Priority
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="donation-campaign"
                  id="campaign"
                  required
                  autoComplete="off"
                  value={formData.campaignId}
                  onChange={(e) => {
                    setFormData({ ...formData, campaignId: e.target.value })
                    setActiveStep(1)
                  }}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    padding: '0 40px 0 12px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">General movement fund</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>
                <SelectIcon />
              </div>
            </div>

            <div>
              <label htmlFor="amount" style={fieldLabelStyle}>
                Amount ({currency.code})
              </label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    pointerEvents: 'none',
                  }}
                >
                  {currency.symbol}
                </span>
                <input
                  aria-label={`Amount in ${currency.code}`}
                  name="donation-amount"
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  required
                  autoComplete="off"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value })
                    setActiveStep(1)
                  }}
                  style={{
                    ...inputStyle,
                    padding: '0 12px 0 30px',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={
                      formData.amount === amount
                        ? 'btn btn-primary btn-sm'
                        : 'btn btn-outline btn-sm'
                    }
                    onClick={() => {
                      setFormData({ ...formData, amount })
                      setActiveStep(1)
                    }}
                  >
                    {currency.symbol}
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="phone" style={fieldLabelStyle}>
                Payment phone
              </label>
              <input
                aria-label="Payment phone"
                name="donation-phone"
                id="phone"
                placeholder="+233 xx xxx xxxx"
                required
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value })
                  setActiveStep(2)
                }}
                style={{
                  ...inputStyle,
                  padding: '0 12px',
                }}
              />
            </div>

            <div>
              <label htmlFor="fullName" style={fieldLabelStyle}>
                Full name
              </label>
              <input
                aria-label="Legal full name"
                name="donation-full-name"
                id="fullName"
                placeholder="Legal full name"
                required
                autoComplete="name"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value })
                  setActiveStep(2)
                }}
                style={{
                  ...inputStyle,
                  padding: '0 12px',
                }}
              />
            </div>

            <div>
              <label htmlFor="membershipNumber" style={fieldLabelStyle}>
                Movement ID
              </label>
              <input
                aria-label="Movement ID"
                name="donation-membership-number"
                id="membershipNumber"
                placeholder={isLoggedIn ? 'Linked automatically' : 'Optional'}
                autoComplete="off"
                value={formData.membershipNumber}
                onChange={(e) => {
                  setFormData({ ...formData, membershipNumber: e.target.value })
                  setActiveStep(3)
                }}
                style={{
                  ...inputStyle,
                  padding: '0 12px',
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '0 20px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <label
              htmlFor="showOnDashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                color: 'hsl(var(--on-surface))',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              <input
                name="donation-show-public"
                id="showOnDashboard"
                type="checkbox"
                checked={formData.showOnDashboard}
                onChange={(e) => {
                  setFormData({ ...formData, showOnDashboard: e.target.checked })
                  setActiveStep(3)
                }}
                style={{
                  width: 16,
                  height: 16,
                  accentColor: 'hsl(var(--primary))',
                  cursor: 'pointer',
                }}
              />
              Show my name in the public ledger
            </label>

            <span
              style={{
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Current entry: {formatCurrencyAmount(formData.amount || 0, currency)}
              {currency.code !== 'GHS' ? ` · Checkout settles ${formatGhsAmount(ghsAmount)}` : ''}
            </span>
          </div>
        </form>

        <aside
          id="receipt-section"
          className="panel"
          style={{
            flex: '1 1 340px',
            maxWidth: 430,
            minWidth: 0,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid hsl(var(--border))',
              background: 'hsl(var(--container-low))',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'hsl(var(--on-surface))',
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              Payment summary
            </p>
            <p
              style={{
                margin: '3px 0 0',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 12,
              }}
            >
              Review before opening secure checkout.
            </p>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                borderLeft: '3px solid hsl(var(--primary))',
                paddingLeft: 14,
              }}
            >
              <p style={{ margin: '0 0 4px', color: 'hsl(var(--on-surface-muted))', fontSize: 11 }}>
                Amount
              </p>
              <p
                style={{
                  margin: 0,
                  color: 'hsl(var(--on-surface))',
                  fontSize: 30,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  letterSpacing: '0',
                }}
              >
                {formatCurrencyAmount(formData.amount || 0, currency)}
              </p>
              {currency.code !== 'GHS' && (
                <p
                  style={{
                    margin: '6px 0 0',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 12,
                    lineHeight: 1.45,
                  }}
                >
                  Hubtel checkout will charge {formatGhsAmount(ghsAmount)} in Ghana cedis.
                </p>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gap: 10,
                padding: 14,
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
                  Priority
                </span>
                <span
                  style={{
                    color: 'hsl(var(--on-surface))',
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textAlign: 'right',
                  }}
                >
                  {selectedCampaign?.title || 'General fund'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>Country</span>
                <span
                  style={{
                    color: 'hsl(var(--on-surface))',
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {formData.country}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
                  Settlement
                </span>
                <span
                  style={{
                    color: 'hsl(var(--on-surface))',
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textAlign: 'right',
                  }}
                >
                  {formatGhsAmount(ghsAmount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
                  Visibility
                </span>
                <span
                  style={{
                    color: 'hsl(var(--on-surface))',
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {formData.showOnDashboard ? 'Public ledger' : 'Private'}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                background: 'hsl(var(--background))',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: status.tone, marginTop: 1 }}
              >
                {status.icon}
              </span>
              <div>
                <p
                  style={{
                    margin: 0,
                    color: 'hsl(var(--on-surface))',
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {status.title}
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {status.body}
                </p>
              </div>
            </div>

            {checkoutUrl && paymentState !== 'failed' && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onReopenCheckout}
                style={{ width: '100%', justifyContent: 'center', height: 42 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  open_in_new
                </span>
                Reopen secure checkout
              </button>
            )}

            <button
              type="submit"
              form="donationForm"
              className="btn btn-primary"
              disabled={paymentState === 'starting' || paymentState === 'checkout'}
              onClick={() => setActiveStep(4)}
              style={{
                width: '100%',
                height: 48,
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {paymentState === 'starting' || paymentState === 'checkout'
                  ? 'hourglass_empty'
                  : 'lock'}
              </span>
              {paymentState === 'failed'
                ? 'Try secure payment again'
                : paymentState === 'starting'
                  ? 'Opening secure checkout'
                  : paymentState === 'checkout'
                    ? 'Waiting for confirmation'
                    : 'Pay securely'}
            </button>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                borderTop: '1px solid hsl(var(--border))',
                paddingTop: 14,
              }}
            >
              {[
                ['encrypted', 'Encrypted'],
                ['smartphone', 'MoMo'],
                ['credit_card', 'Card'],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    color: 'hsl(var(--on-surface-muted))',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {icon}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
