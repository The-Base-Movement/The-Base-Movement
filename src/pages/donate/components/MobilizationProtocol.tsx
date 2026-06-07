import type { FormEvent, Dispatch, SetStateAction } from 'react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
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
  campaigns: DonationCampaign[]
  onSubmit: (e: FormEvent) => void
  onOpenAudit: () => void
}

function SelIcon() {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        position: 'absolute',
        right: 0,
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
  campaigns,
  onSubmit,
  onOpenAudit,
}: MobilizationProtocolProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [donationReference, setDonationReference] = useState('')

  useEffect(() => {
    const inp = fileInputRef.current
    if (!inp) return
    const handle = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files && target.files[0]
      if (!file) return
      if (!donationReference.trim()) {
        toast.error('Enter the donation reference or ID before attaching a receipt.')
        target.value = ''
        return
      }
      // show preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
      setUploading(true)
      try {
        const ok = await adminService.uploadDonationReceipt(file, donationReference.trim())
        if (ok) {
          toast.success('Receipt attached to donation reference.')
          onOpenAudit()
        } else {
          toast.error('Failed to link receipt. Check the reference and try again.')
        }
      } catch (err) {
        console.error('Receipt upload failed', err)
        toast.error('Receipt upload failed. Please try again.')
      } finally {
        setUploading(false)
        // clear input
        target.value = ''
        if (previewUrl) URL.revokeObjectURL(previewUrl)
      }
    }
    inp.addEventListener('change', handle)
    return () => inp.removeEventListener('change', handle)
  }, [donationReference, onOpenAudit, previewUrl])
  const steps = [
    { step: 1, label: 'Capital transfer', id: 'payment-section', color: 'hsl(var(--destructive))' },
    { step: 2, label: 'Contributor profile', id: 'donor-section', color: 'hsl(var(--accent))' },
    { step: 3, label: 'Member link', id: 'link-section', color: 'hsl(var(--primary))' },
    { step: 4, label: 'Verification', id: 'receipt-section', color: 'hsl(var(--primary))' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 64,
        alignItems: 'flex-start',
        paddingTop: 80,
      }}
      className="lg:flex-row flex-col"
    >
      {/* sidebar navigation */}
      <aside
        className="desktop-only"
        style={{ width: 280, flexShrink: 0, position: 'sticky', top: 96 }}
      >
        <div
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            padding: 32,
          }}
        >
          <h4
            style={{
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 32,
              letterSpacing: '0.02em',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Deployment protocol
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {steps.map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  const el = document.getElementById(s.id)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  setActiveStep(s.step)
                }}
                className={activeStep === s.step ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  width: '100%',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    transition: 'all 0.3s ease',
                    background: activeStep === s.step ? s.color : 'hsl(var(--container-low))',
                    color: activeStep === s.step ? '#fff' : 'hsl(var(--on-surface-muted))',
                    borderRadius: 'var(--radius-sm)',
                    transform: activeStep === s.step ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      letterSpacing: '-0.01em',
                      display: 'block',
                      transition: 'colors 0.3s ease',
                      color:
                        activeStep === s.step
                          ? 'hsl(var(--on-surface))'
                          : 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {s.label}
                  </span>
                  {activeStep === s.step && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 500,
                        color: 'hsl(var(--primary))',
                        letterSpacing: '0.02em',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      In Progress
                    </span>
                  )}
                </div>
              </button>
            ))}
            <div
              style={{ marginTop: 18, borderTop: '1px solid hsl(var(--border))', paddingTop: 18 }}
            >
              <h5
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 8,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Audit trail
              </h5>

              {/* Preview row: sits above the description */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label
                    htmlFor="donationReference"
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Donation reference or ID
                  </label>
                  <input
                    id="donationReference"
                    value={donationReference}
                    onChange={(e) => setDonationReference(e.target.value)}
                    placeholder="Enter reference or id"
                    style={{
                      width: '100%',
                      height: 44,
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                      fontFamily: "'Public Sans', sans-serif",
                      padding: '0 12px',
                      outline: 'none',
                    }}
                  />
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      lineHeight: 1.4,
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    Use the contribution reference shown after submission or the donation ID from
                    your payment record.
                  </p>
                </div>
                <div
                  id="sidebar-receipt-preview"
                  style={{
                    minHeight: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="receipt preview"
                      style={{
                        width: 96,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid hsl(var(--border))',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 96,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'hsl(var(--container-low))',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px dashed hsl(var(--border))',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                        No preview
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginBottom: 12 }}>
                Optional: attach external receipts or view the deployment ledger.
              </p>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                <button
                  onClick={onOpenAudit}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  View ledger
                </button>

                <input
                  id="sidebar-receipt-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="sidebar-receipt-input"
                  className="btn btn-sm btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                    justifyContent: 'center',
                  }}
                >
                  {uploading ? 'Uploading...' : 'Attach'}
                </label>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 48, width: '100%' }}>
        {/* step 1: capital transfer */}
        <div
          id="payment-section"
          style={{
            background: 'hsl(var(--container-low))',
            color: 'hsl(var(--on-surface))',
            padding: 'clamp(24px, 5vw, 40px)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            scrollMarginTop: 180,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              padding: 16,
              opacity: 0.05,
              pointerEvents: 'none',
              transform: 'translateX(16px) translateY(-16px)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 128, color: 'hsl(var(--primary))' }}
            >
              call
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: 'hsl(var(--destructive))',
                color: 'hsl(var(--on-surface))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              01
            </span>
            <h3
              style={{
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.02em',
                fontSize: 20,
              }}
            >
              Capital transfer
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, flex: 1 }}>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: "'Public Sans', sans-serif",
                  marginBottom: 8,
                }}
              >
                account holder
              </p>
              <p
                style={{
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--primary))',
                  fontSize: 24,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Paul Kofi Agyekum
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: "'Public Sans', sans-serif",
                  marginBottom: 8,
                }}
              >
                momo identifier
              </p>
              <p
                style={{
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  fontSize: 24,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                +233 538 873 569
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 32,
                paddingTop: 40,
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
              className="md:grid-cols-2"
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: "'Public Sans', sans-serif",
                    marginBottom: 8,
                  }}
                >
                  network hub
                </p>
                <p
                  style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 16,
                  }}
                >
                  MTN Mobile Money
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: "'Public Sans', sans-serif",
                    marginBottom: 8,
                  }}
                >
                  deployment reference
                </p>
                <p
                  style={{
                    color: 'hsl(var(--accent))',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 16,
                    fontStyle: 'italic',
                    borderBottom: '1px solid rgba(218,165,32,0.3)',
                    paddingBottom: 4,
                  }}
                >
                  "the base"
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 48,
              padding: 24,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))', marginTop: 2 }}
            >
              check
            </span>
            <p
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.5,
                fontWeight: 400,
                letterSpacing: '-0.01em',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Complete transfer protocol first, then capture receipt for verification.
            </p>
          </div>
        </div>

        {/* step 2: contributor profile */}
        <div
          id="donor-section"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            padding: 'clamp(24px, 5vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            scrollMarginTop: 180,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: 'hsl(var(--accent))',
                color: 'hsl(var(--on-surface))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              02
            </span>
            <h3
              style={{
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.02em',
                fontSize: 20,
              }}
            >
              Contributor profile
            </h3>
          </div>

          <form
            onSubmit={onSubmit}
            id="donationForm"
            style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                htmlFor="fullName"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Identification <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <input
                aria-label="Legal full name"
                name="name-01ce78"
                id="fullName"
                placeholder="Legal full name"
                required
                autoComplete="name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                onFocus={() => setActiveStep(2)}
                style={{
                  width: '100%',
                  height: 48,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--on-surface))',
                  fontSize: 14,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontFamily: "'Public Sans', sans-serif",
                  outline: 'none',
                  padding: 0,
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                htmlFor="phone"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Contact line <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <input
                aria-label="+233 xx xxx xxxx"
                name="name-ff548e"
                id="phone"
                placeholder="+233 xx xxx xxxx"
                required
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                onFocus={() => setActiveStep(2)}
                style={{
                  width: '100%',
                  height: 48,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--on-surface))',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: "'Public Sans', sans-serif",
                  outline: 'none',
                  padding: 0,
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="amount"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Amount (₵) <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <input
                  aria-label="0.00"
                  name="name-6790e5"
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  required
                  autoComplete="off"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  onFocus={() => setActiveStep(2)}
                  style={{
                    width: '100%',
                    height: 48,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--on-surface))',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "'Public Sans', sans-serif",
                    outline: 'none',
                    padding: 0,
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="country"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Jurisdiction <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    name="name-4a0eac"
                    id="country"
                    required
                    autoComplete="country-name"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    onFocus={() => setActiveStep(2)}
                    disabled={countriesLoading}
                    style={{
                      width: '100%',
                      height: 48,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 14,
                      fontWeight: 500,
                      fontFamily: "'Public Sans', sans-serif",
                      outline: 'none',
                      appearance: 'none',
                      paddingRight: 32,
                      paddingLeft: 0,
                      borderRadius: 0,
                    }}
                  >
                    {countriesLoading ? (
                      <option>synchronizing...</option>
                    ) : countries.length > 0 ? (
                      countries.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <option value="ghana">ghana</option>
                    )}
                  </select>
                  <SelIcon />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                htmlFor="campaign"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                Target cell <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  name="name-348cbe"
                  id="campaign"
                  required
                  autoComplete="off"
                  value={formData.campaignId}
                  onChange={(e) => setFormData({ ...formData, campaignId: e.target.value })}
                  onFocus={() => setActiveStep(2)}
                  style={{
                    width: '100%',
                    height: 48,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--on-surface))',
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontFamily: "'Public Sans', sans-serif",
                    outline: 'none',
                    appearance: 'none',
                    paddingRight: 32,
                    paddingLeft: 0,
                    borderRadius: 0,
                  }}
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <SelIcon />
              </div>
            </div>
          </form>
        </div>

        {/* step 3: link patriot */}
        <div
          id="link-section"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            padding: 'clamp(24px, 5vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            scrollMarginTop: 180,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: 'hsl(var(--container-low))',
                color: 'hsl(var(--on-surface))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              03
            </span>
            <h3
              style={{
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.02em',
                fontSize: 20,
              }}
            >
              {isLoggedIn ? 'Member profile' : 'Link member'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>
            <div
              style={{
                background: 'hsl(var(--container-low))',
                border: '1px solid hsl(var(--border))',
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 32,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
                >
                  vital_signs
                </span>
                <h4
                  style={{
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                    letterSpacing: '-0.01em',
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  {isLoggedIn ? 'Active session' : 'Movement ID'}
                </h4>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  letterSpacing: '-0.01em',
                  fontFamily: "'Public Sans', sans-serif",
                  margin: 0,
                }}
              >
                {isLoggedIn
                  ? 'Automatic recognition active. This deployment will be linked to your patriot profile.'
                  : 'Enter your movement identification number to synchronize this capital with your profile.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="membershipNumber"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Movement ID
                </label>
                <input
                  aria-label="gh-2028-xxxxxx"
                  name="name-915196"
                  id="membershipNumber"
                  placeholder="gh-2028-xxxxxx"
                  autoComplete="off"
                  value={formData.membershipNumber}
                  onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                  onFocus={() => setActiveStep(3)}
                  style={{
                    width: '100%',
                    height: 48,
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--on-surface))',
                    fontSize: 14,
                    fontWeight: 500,
                    fontFamily: "'Public Sans', sans-serif",
                    outline: 'none',
                    padding: '0 16px',
                  }}
                />
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  paddingTop: 8,
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    name="name-97e307"
                    id="input-97e307"
                    type="checkbox"
                    checked={formData.showOnDashboard}
                    onChange={(e) =>
                      setFormData({ ...formData, showOnDashboard: e.target.checked })
                    }
                    onFocus={() => setActiveStep(3)}
                    style={{
                      height: 20,
                      width: 20,
                      cursor: 'pointer',
                      appearance: 'none',
                      border: '1px solid hsl(var(--on-surface-muted))',
                      borderRadius: 0,
                      background: formData.showOnDashboard ? 'hsl(var(--primary))' : 'transparent',
                      borderColor: formData.showOnDashboard
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--on-surface-muted))',
                    }}
                  />
                  {formData.showOnDashboard && (
                    <span
                      className="material-symbols-outlined"
                      style={{
                        position: 'absolute',
                        color: 'hsl(var(--on-surface))',
                        fontSize: 16,
                        left: 2,
                        pointerEvents: 'none',
                      }}
                    >
                      check
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                    fontWeight: 500,
                    letterSpacing: '-0.01em',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  Publish to personal dossier
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* step 4: audit trail */}
        <div
          id="receipt-section"
          style={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            padding: 'clamp(24px, 5vw, 40px)',
            display: 'flex',
            flexDirection: 'column',
            scrollMarginTop: 180,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <span
              style={{
                width: 32,
                height: 32,
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--on-surface))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              04
            </span>
            <h3
              style={{
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.02em',
                fontSize: 20,
              }}
            >
              Audit trail
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>
            <div style={{ padding: 16, textAlign: 'left' }}>
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  fontWeight: 500,
                  marginBottom: 6,
                }}
              >
                Receipts (optional)
              </p>
              <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
                If you paid outside the site, attach your receipt via the Audit trail panel in the
                Deployment protocol sidebar. Receipts are optional and not required to submit the
                form.
              </p>
            </div>

            <div
              style={{
                background: 'hsl(var(--container-low))',
                padding: 24,
                border: '1px solid hsl(var(--border))',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
                >
                  language
                </span>
                <h4
                  style={{
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                    letterSpacing: '-0.01em',
                    fontSize: 11,
                    margin: 0,
                  }}
                >
                  Global diaspora hub
                </h4>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                  lineHeight: 1.6,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  fontFamily: "'Public Sans', sans-serif",
                  margin: 0,
                }}
              >
                Use deployment code{' '}
                <span
                  style={{
                    color: 'hsl(var(--primary))',
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  thebasem
                </span>{' '}
                on taptap for resource scaling bonus.
              </p>
            </div>

            <button
              type="submit"
              form="donationForm"
              className="btn btn-primary"
              style={{
                width: '100%',
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '0 32px',
                textTransform: 'lowercase',
                boxShadow: '0 12px 32px -12px rgba(0,107,63,0.3)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                favorite
              </span>
              Authorize contribution
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
