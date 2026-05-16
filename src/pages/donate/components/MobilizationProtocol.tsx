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
  setFormData: (data: FormData) => void
  isLoggedIn: boolean
  countriesLoading: boolean
  countries: Country[]
  campaigns: DonationCampaign[]
  onSubmit: (e: FormEvent) => void
}

function SelIcon() {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        position: 'absolute', right: 0, top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 18, color: 'hsl(var(--on-surface-muted))',
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
  onSubmit
}: MobilizationProtocolProps) {
  const steps = [
    { step: 1, label: 'Capital transfer', id: 'payment-section', color: 'hsl(var(--destructive))' },
    { step: 2, label: 'Profile details', id: 'donor-section', color: 'hsl(var(--accent))' },
    { step: 3, label: 'Patriot link', id: 'link-section', color: 'hsl(var(--primary))' },
    { step: 4, label: 'Verification', id: 'receipt-section', color: 'hsl(var(--primary))' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 64, alignItems: 'flex-start', paddingTop: 80 }} className="lg:flex-row flex-col">
      {/* sidebar navigation */}
      <aside className="desktop-only" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 96 }}>
        <div style={{ background: '#fff', border: '1px solid hsl(var(--border))', padding: 32 }}>
          <h4 style={{ 
            fontSize: 10, 
            fontWeight: 800, 
            color: 'hsl(var(--on-surface-muted))', 
            marginBottom: 32, 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em',
            fontFamily: "'Public Sans', sans-serif"
          }}>Deployment Protocol</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {steps.map((s) => (
              <button 
                key={s.step}
                onClick={() => {
                  const el = document.getElementById(s.id)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  setActiveStep(s.step)
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16, 
                  width: '100%', 
                  textAlign: 'left', 
                  background: 'none', 
                  border: 'none', 
                  padding: 0, 
                  cursor: 'pointer' 
                }}
              >
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 12, 
                  fontWeight: 900, 
                  transition: 'all 0.3s ease',
                  background: activeStep === s.step ? s.color : 'hsl(var(--container-low))',
                  color: activeStep === s.step ? '#fff' : 'hsl(var(--on-surface-muted))',
                  borderRadius: 4,
                  transform: activeStep === s.step ? 'scale(1.1)' : 'scale(1)'
                }}>
                  {s.step}
                </div>
                <div>
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 800, 
                    letterSpacing: '-0.01em', 
                    display: 'block', 
                    transition: 'colors 0.3s ease',
                    color: activeStep === s.step ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif"
                  }}>
                    {s.label}
                  </span>
                  {activeStep === s.step && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Public Sans', sans-serif" }}>In Progress</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 48, width: '100%' }}>
        {/* step 1: capital transfer */}
        <div id="payment-section" style={{ 
          background: 'hsl(var(--on-surface))', 
          color: '#fff', 
          padding: 'clamp(24px, 5vw, 40px)', 
          position: 'relative', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column', 
          scrollMarginTop: 180 
        }}>
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            right: 0, 
            padding: 16, 
            opacity: 0.05, 
            pointerEvents: 'none', 
            transform: 'translateX(16px) translateY(-16px)' 
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 128, color: 'hsl(var(--primary))' }}>call</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <span style={{ 
              width: 32, 
              height: 32, 
              background: 'hsl(var(--destructive))', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 900, 
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif"
            }}>01</span>
            <h3 style={{ fontWeight: 900, color: '#fff', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.02em', fontSize: 20 }}>Capital transfer</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, flex: 1 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Public Sans', sans-serif", marginBottom: 8 }}>account holder</p>
              <p style={{ fontWeight: 900, color: 'hsl(var(--primary))', fontSize: 24, letterSpacing: '-0.02em', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>Paul Kofi Agyekum</p>
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Public Sans', sans-serif", marginBottom: 8 }}>momo identifier</p>
              <p style={{ fontWeight: 900, color: '#fff', fontSize: 24, letterSpacing: '-0.02em', margin: 0, fontFamily: "'Public Sans', sans-serif" }}>+233 538 873 569</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.1)' }} className="md:grid-cols-2">
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Public Sans', sans-serif", marginBottom: 8 }}>network hub</p>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 800, fontFamily: "'Public Sans', sans-serif", fontSize: 16 }}>MTN Mobile Money</p>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Public Sans', sans-serif", marginBottom: 8 }}>deployment reference</p>
                <p style={{ color: 'hsl(var(--accent))', fontWeight: 800, fontFamily: "'Public Sans', sans-serif", fontSize: 16, fontStyle: 'italic', borderBottom: '1px solid rgba(218,165,32,0.3)', paddingBottom: 4 }}>"the base"</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 48, padding: 24, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))', marginTop: 2 }}>check</span>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontWeight: 800, letterSpacing: '-0.01em', fontFamily: "'Public Sans', sans-serif" }}>
              Complete transfer protocol first, then capture receipt for verification.
            </p>
          </div>
        </div>

        {/* step 2: contributor profile */}
        <div id="donor-section" style={{ 
          background: '#fff', 
          border: '1px solid hsl(var(--border))', 
          padding: 'clamp(24px, 5vw, 40px)', 
          display: 'flex', 
          flexDirection: 'column', 
          scrollMarginTop: 180 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <span style={{ 
              width: 32, 
              height: 32, 
              background: 'hsl(var(--accent))', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 900, 
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif"
            }}>02</span>
            <h3 style={{ fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.02em', fontSize: 20 }}>Contributor profile</h3>
          </div>

          <form onSubmit={onSubmit} id="donationForm" style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="fullName" style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Public Sans', sans-serif" }}>
                identification <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <input aria-label="Legal full name" name="name-01ce78" 
                id="fullName" 
                placeholder="Legal full name" 
                required 
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
                  fontWeight: 700, 
                  fontFamily: "'Public Sans', sans-serif",
                  outline: 'none',
                  padding: 0
                }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="phone" style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Public Sans', sans-serif" }}>
                contact line <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <input aria-label="+233 xx xxx xxxx" name="name-ff548e" 
                id="phone" 
                placeholder="+233 xx xxx xxxx" 
                required 
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
                  fontWeight: 700, 
                  fontFamily: "'Public Sans', sans-serif",
                  outline: 'none',
                  padding: 0
                }} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="amount" style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Public Sans', sans-serif" }}>
                  Amount (₵) <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <input aria-label="0.00" name="name-6790e5" 
                  id="amount" 
                  type="number" 
                  placeholder="0.00" 
                  required 
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
                    fontWeight: 700, 
                    fontFamily: "'Public Sans', sans-serif",
                    outline: 'none',
                    padding: 0
                  }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label htmlFor="country" style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Public Sans', sans-serif" }}>
                  jurisdiction <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select name="name-4a0eac" 
                    id="country" 
                    required 
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
                      fontWeight: 700, 
                      fontFamily: "'Public Sans', sans-serif",
                      outline: 'none',
                      appearance: 'none',
                      paddingRight: 32,
                      paddingLeft: 0,
                      borderRadius: 0
                    }}
                  >
                    {countriesLoading ? (
                      <option>synchronizing...</option>
                    ) : countries.length > 0 ? (
                      countries.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
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
              <label htmlFor="campaign" style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Public Sans', sans-serif" }}>
                target cell <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select name="name-348cbe" 
                  id="campaign" 
                  required 
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
                    fontWeight: 700, 
                    fontFamily: "'Public Sans', sans-serif",
                    outline: 'none',
                    appearance: 'none',
                    paddingRight: 32,
                    paddingLeft: 0,
                    borderRadius: 0
                  }}
                >
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <SelIcon />
              </div>
            </div>
          </form>
        </div>

        {/* step 3: link patriot */}
        <div id="link-section" style={{ 
          background: '#fff', 
          border: '1px solid hsl(var(--border))', 
          padding: 'clamp(24px, 5vw, 40px)', 
          display: 'flex', 
          flexDirection: 'column', 
          scrollMarginTop: 180 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <span style={{ 
              width: 32, 
              height: 32, 
              background: 'hsl(var(--on-surface))', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 900, 
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif"
            }}>03</span>
            <h3 style={{ fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.02em', fontSize: 20 }}>
              {isLoggedIn ? 'Patriot profile' : 'Link patriot'}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>
              <div style={{ background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--primary))' }}>vital_signs</span>
                  <h4 style={{ fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.01em', fontSize: 14, margin: 0 }}>
                    {isLoggedIn ? 'active session' : 'movement id'}
                  </h4>
                </div>
                <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontWeight: 700, lineHeight: 1.6, letterSpacing: '-0.01em', fontFamily: "'Public Sans', sans-serif", margin: 0 }}>
                  {isLoggedIn 
                    ? 'Automatic recognition active. This deployment will be linked to your patriot profile.'
                    : 'Enter your movement identification number to synchronize this capital with your profile.'
                  }
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label htmlFor="membershipNumber" style={{ fontSize: 10.5, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Public Sans', sans-serif" }}>
                    movement id
                  </label>
                  <input aria-label="gh-2028-xxxxxx" name="name-915196" 
                    id="membershipNumber" 
                    placeholder="gh-2028-xxxxxx" 
                    value={formData.membershipNumber}
                    onChange={(e) => setFormData({ ...formData, membershipNumber: e.target.value })}
                    onFocus={() => setActiveStep(3)}
                    style={{ 
                      width: '100%', 
                      height: 48, 
                      background: '#fff', 
                      border: '1px solid hsl(var(--border))', 
                      color: 'hsl(var(--on-surface))', 
                      fontSize: 14, 
                      fontWeight: 700, 
                      fontFamily: "'Public Sans', sans-serif",
                      outline: 'none',
                      padding: '0 16px'
                    }} 
                  />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', paddingTop: 8 }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input name="name-97e307" id="input-97e307" 
                      type="checkbox" 
                      checked={formData.showOnDashboard}
                      onChange={(e) => setFormData({ ...formData, showOnDashboard: e.target.checked })}
                      onFocus={() => setActiveStep(3)}
                      style={{ 
                        height: 20, 
                        width: 20, 
                        cursor: 'pointer', 
                        appearance: 'none', 
                        border: '1px solid hsl(var(--on-surface-muted))', 
                        borderRadius: 0,
                        background: formData.showOnDashboard ? 'hsl(var(--primary))' : 'transparent',
                        borderColor: formData.showOnDashboard ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))'
                      }} 
                    />
                    {formData.showOnDashboard && (
                      <span className="material-symbols-outlined" style={{ position: 'absolute', color: '#fff', fontSize: 16, left: 2, pointerEvents: 'none' }}>check</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: 'hsl(var(--on-surface))', fontWeight: 800, letterSpacing: '-0.01em', fontFamily: "'Public Sans', sans-serif" }}>Publish to personal dossier</span>
                </label>
              </div>
          </div>
        </div>

        {/* step 4: audit trail */}
        <div id="receipt-section" style={{ 
          background: '#fff', 
          border: '1px solid hsl(var(--border))', 
          padding: 'clamp(24px, 5vw, 40px)', 
          display: 'flex', 
          flexDirection: 'column', 
          scrollMarginTop: 180 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
            <span style={{ 
              width: 32, 
              height: 32, 
              background: 'hsl(var(--primary))', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 900, 
              fontSize: 12,
              fontFamily: "'Public Sans', sans-serif"
            }}>04</span>
            <h3 style={{ fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.02em', fontSize: 20 }}>Audit trail</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>
              <div style={{ 
                border: '2px dashed hsl(var(--border))', 
                background: 'hsl(var(--container-low))', 
                padding: 48, 
                textAlign: 'center', 
                transition: 'all 0.3s ease', 
                position: 'relative', 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center' 
              }}>
                <input 
                  type="file" 
                  form="donationForm" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  onFocus={() => setActiveStep(4)}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                  id="receipt" 
                  required 
                />
                <div style={{ 
                  width: 64, 
                  height: 64, 
                  background: '#fff', 
                  border: '1px solid hsl(var(--border))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 24px', 
                  transition: 'transform 0.5s ease' 
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'hsl(var(--on-surface-muted))' }}>download</span>
                </div>
                <p style={{ fontSize: 13, color: 'hsl(var(--on-surface))', fontWeight: 900, letterSpacing: '-0.01em', marginBottom: 4, fontFamily: "'Public Sans', sans-serif" }}>synchronize receipt</p>
                <p style={{ fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', fontWeight: 900, letterSpacing: '0.05em', margin: 0, textTransform: 'uppercase' }}>jpg, png, or pdf</p>
              </div>

              <div style={{ background: 'hsl(var(--container-low))', padding: 24, border: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--primary))' }}>language</span>
                  <h4 style={{ fontWeight: 900, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", letterSpacing: '-0.01em', fontSize: 10.5, margin: 0, textTransform: 'uppercase' }}>global diaspora hub</h4>
                </div>
                <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, fontWeight: 700, letterSpacing: '-0.01em', fontFamily: "'Public Sans', sans-serif", margin: 0 }}>
                  Use deployment code <span style={{ color: 'hsl(var(--primary))', fontWeight: 900 }}>thebasem</span> on taptap for resource scaling bonus.
                </p>
              </div>

              <button
                type="submit"
                form="donationForm"
                style={{
                  width: '100%',
                  height: 56,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  padding: '0 32px',
                  background: 'hsl(var(--primary))',
                  color: '#fff',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 900, fontSize: 13,
                  borderRadius: 4, border: 'none',
                  cursor: 'pointer',
                  textTransform: 'lowercase',
                  boxShadow: '0 12px 32px -12px rgba(0,107,63,0.3)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>favorite</span>
                Authorize contribution
              </button>
          </div>
        </div>
      </div>
    </div>
  )
}
