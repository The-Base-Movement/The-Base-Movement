import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import HubtelButton from './HubtelButton'
import { useAuth } from '@/context/AuthContext'
import { openHubtelCheckout } from './hubtelCheckout'

interface DonateModalProps {
  isOpen: boolean
  onClose: () => void
  context?: {
    type: 'chapter' | 'constituency'
    name: string
    id: string
  }
}

interface ModalForm {
  amount: string
  fullName: string
  phone: string
  email: string
}

const EMPTY: ModalForm = { amount: '', fullName: '', phone: '', email: '' }

export default function DonateModal({ isOpen, onClose, context }: DonateModalProps) {
  const { session } = useAuth()
  const [form, setForm] = useState<ModalForm>(EMPTY)
  const [pendingDonationId, setPendingDonationId] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [paymentState, setPaymentState] = useState<'idle' | 'starting' | 'checkout' | 'failed'>(
    'idle'
  )
  const [succeeded, setSucceeded] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY)
      setPendingDonationId(null)
      setCheckoutUrl(null)
      setPaymentState('idle')
      setSucceeded(false)
      setSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!pendingDonationId || succeeded) return

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('status')
        .eq('id', pendingDonationId)
        .maybeSingle()

      if (error || !data) return
      if (data.status === 'Verified') {
        setSucceeded(true)
        setPaymentState('idle')
        toast.success('Donation confirmed.')
      }
      if (data.status === 'Rejected') {
        setPaymentState('failed')
        toast.error('The payment could not be confirmed.')
      }
    }

    void checkStatus()
    const timer = window.setInterval(() => void checkStatus(), 3000)
    return () => window.clearInterval(timer)
  }, [pendingDonationId, succeeded])

  if (!isOpen) return null

  const reset = () => {
    setForm(EMPTY)
    setPendingDonationId(null)
    setCheckoutUrl(null)
    setPaymentState('idle')
    setSucceeded(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount.')
      return
    }
    if (!form.fullName.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required.')
      return
    }
    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('donations')
        .insert({
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          amount: parseFloat(form.amount),
          country: 'Ghana',
          payment_method: 'Hubtel',
          status: 'Pending',
          member_id: session?.user?.id || null,
          chapter: context?.type === 'chapter' ? context.name : null,
          constituency: context?.type === 'constituency' ? context.name : null,
          show_on_dashboard: true,
        })
        .select('id')
        .single()
      if (error) throw error
      setPendingDonationId(data.id)
      setPaymentState('starting')
    } catch (err) {
      console.error('[DonateModal] insert failed:', err)
      toast.error('Could not start payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHubtelStarted = () => {
    setPaymentState('checkout')
    toast.success('Secure checkout opened. Complete payment to confirm your donation.')
  }

  const handleHubtelError = async () => {
    if (pendingDonationId) {
      await supabase.from('donations').delete().eq('id', pendingDonationId).eq('status', 'Pending')
    }
    setPendingDonationId(null)
    setCheckoutUrl(null)
    setPaymentState('failed')
  }

  const contextLabel = context
    ? `${context.type === 'chapter' ? 'Chapter' : 'Constituency'}: ${context.name}`
    : 'The Base Movement'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 440,
          padding: 32,
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'hsl(var(--on-surface-muted))',
            display: 'flex',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            close
          </span>
        </button>

        {succeeded ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 48,
                color: 'hsl(var(--primary))',
                display: 'block',
                marginBottom: 16,
              }}
            >
              check_circle
            </span>
            <h2
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 20,
                color: 'hsl(var(--on-surface))',
                marginBottom: 8,
              }}
            >
              Donation confirmed!
            </h2>
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginBottom: 24 }}>
              Thank you for supporting {contextLabel}.
            </p>
            <button type="button" className="btn btn-outline" onClick={handleClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 18,
                  color: 'hsl(var(--on-surface))',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--destructive))' }}
                >
                  favorite
                </span>
                Support the Movement
              </h2>
              {context && (
                <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                  {contextLabel}
                </p>
              )}
            </div>

            <form
              onSubmit={handleInitiatePayment}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {(['amount', 'fullName', 'phone', 'email'] as const).map((field) => {
                const meta: Record<
                  string,
                  { label: string; type: string; placeholder: string; required: boolean }
                > = {
                  amount: {
                    label: 'Amount (GHS)',
                    type: 'number',
                    placeholder: '0.00',
                    required: true,
                  },
                  fullName: {
                    label: 'Full name',
                    type: 'text',
                    placeholder: 'Your full name',
                    required: true,
                  },
                  phone: {
                    label: 'Phone',
                    type: 'tel',
                    placeholder: '+233 xx xxx xxxx',
                    required: true,
                  },
                  email: {
                    label: 'Email (optional — receipt)',
                    type: 'email',
                    placeholder: 'you@example.com',
                    required: false,
                  },
                }
                const m = meta[field]
                return (
                  <div key={field}>
                    <label
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'hsl(var(--on-surface-muted))',
                        display: 'block',
                        marginBottom: 6,
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {m.label}
                      {m.required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
                    </label>
                    <input
                      name={`modal-${field}`}
                      type={m.type}
                      required={m.required}
                      placeholder={m.placeholder}
                      min={field === 'amount' ? '1' : undefined}
                      step={field === 'amount' ? '0.01' : undefined}
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      style={{
                        width: '100%',
                        height: 44,
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0 12px',
                        fontSize: 14,
                        fontFamily: "'Public Sans', sans-serif",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )
              })}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !!pendingDonationId}
                style={{ height: 48, width: '100%', justifyContent: 'center' }}
              >
                {submitting ? (
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      lock
                    </span>
                    Pay securely
                  </>
                )}
              </button>
            </form>

            {pendingDonationId && (
              <HubtelButton
                autoOpen
                reference={pendingDonationId}
                amount={parseFloat(form.amount)}
                name={form.fullName}
                phone={form.phone}
                email={form.email || undefined}
                metadata={{
                  donationId: pendingDonationId,
                  memberId: session?.user?.id,
                  context: context ?? undefined,
                }}
                onStarted={handleHubtelStarted}
                onError={handleHubtelError}
                onCheckoutReady={setCheckoutUrl}
              />
            )}

            {pendingDonationId && (
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, color: 'hsl(var(--primary))', marginTop: 1 }}
                  >
                    {paymentState === 'failed' ? 'error' : 'payments'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {paymentState === 'failed'
                        ? 'Payment not confirmed'
                        : paymentState === 'starting'
                          ? 'Opening secure checkout'
                          : 'Complete payment in the secure checkout window'}
                    </p>
                    <p
                      style={{
                        margin: '5px 0 0',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                        lineHeight: 1.5,
                      }}
                    >
                      Keep this page open. Your donation will confirm automatically after payment is
                      completed.
                    </p>
                  </div>
                </div>
                {checkoutUrl && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}
                    onClick={() => openHubtelCheckout(checkoutUrl)}
                  >
                    Reopen secure checkout
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
