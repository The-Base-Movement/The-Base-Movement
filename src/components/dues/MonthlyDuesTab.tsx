import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { adminService } from '@/services/adminService'
import {
  monthlyDuesService,
  type MonthlyDuesEnrollment,
  type MonthlyDuesPayment,
  type MonthlyDuesSettings,
} from '@/services/monthlyDuesService'
import { getDuesMonth } from '@/lib/monthlyDues'
import { getCurrencyForCountry } from '@/lib/currency'
import { initiateHubtelCheckout } from '@/components/payment/hubtelCheckout'
import { HubtelPaymentModal } from '@/components/payment/HubtelPaymentModal'
import DuesPaymentHistory from '@/components/dues/DuesPaymentHistory'
import { monthlyDuesExportService } from '@/services/monthlyDuesExportService'

const FONT = "'Public Sans', sans-serif"

interface MemberProfileLite {
  name?: string
  phone?: string
  country?: string
}

export default function MonthlyDuesTab() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<MonthlyDuesSettings | null>(null)
  const [enrollment, setEnrollment] = useState<MonthlyDuesEnrollment | null>(null)
  const [payments, setPayments] = useState<MonthlyDuesPayment[]>([])
  const [profile, setProfile] = useState<MemberProfileLite | null>(null)
  const [consentEmail, setConsentEmail] = useState(true)
  const [consentSms, setConsentSms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [checkoutRef, setCheckoutRef] = useState<string | null>(null)

  const currentMonth = getDuesMonth(new Date())

  const load = useCallback(async () => {
    if (!session?.user) return
    try {
      const [duesSettings, myEnrollment, memberProfile, latestConsent] = await Promise.all([
        monthlyDuesService.getCurrentSettings(),
        monthlyDuesService.getMyEnrollment(),
        adminService.getMemberProfileByAuthId(session.user.id).catch(() => null),
        monthlyDuesService.getMyLatestConsent().catch(() => null),
      ])
      setSettings(duesSettings)
      setEnrollment(myEnrollment)
      setProfile(memberProfile)
      if (latestConsent) {
        setConsentEmail(latestConsent.email_enabled)
        setConsentSms(latestConsent.sms_enabled)
      }

      const isEnrolled =
        myEnrollment && ['active', 'pending_activation'].includes(myEnrollment.status)
      if (duesSettings && isEnrolled) {
        const currency = getCurrencyForCountry(memberProfile?.country)
        await monthlyDuesService
          .ensureMyObligation(currentMonth, currency.code, currency.ghsRate)
          .catch(() => null)
      }
      setPayments(await monthlyDuesService.getMyPayments())
    } catch {
      toast.error('Could not load your monthly dues.')
    } finally {
      setLoading(false)
    }
  }, [session, currentMonth])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Surface the current calendar month when it exists, otherwise the oldest
  // outstanding month, otherwise the most recent record (e.g. just paid).
  const outstanding = payments.filter((p) =>
    ['due', 'pending', 'failed', 'overdue'].includes(p.status)
  )
  const currentPayment =
    payments.find((p) => p.dues_month.slice(0, 10) === currentMonth) ??
    (outstanding.length > 0 ? outstanding[outstanding.length - 1] : (payments[0] ?? null))
  const isEnrolled = enrollment && ['active', 'pending_activation'].includes(enrollment.status)

  const startCheckout = async (payment: MonthlyDuesPayment) => {
    if (!profile?.phone) {
      toast.error('Add a phone number to your profile before paying dues.')
      return
    }
    setBusy(true)
    try {
      // The server reloads the obligation and validates amount, member, and
      // status — the browser only supplies the obligation reference.
      const url = await initiateHubtelCheckout({
        amount: payment.display_amount,
        currency: payment.display_currency,
        name: profile.name || 'Member',
        phone: profile.phone,
        email: session?.user?.email ?? undefined,
        reference: payment.id,
        metadata: { monthlyDuesPaymentId: payment.id },
      })
      setCheckoutRef(payment.id)
      setCheckoutUrl(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start the payment.')
    } finally {
      setBusy(false)
    }
  }

  const handleEnroll = async () => {
    if (!settings) return
    setBusy(true)
    try {
      await monthlyDuesService.enroll('manual', consentEmail, consentSms, settings.policy_version)
      toast.success('You are enrolled in monthly dues.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Enrollment failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleOptOut = async () => {
    if (!window.confirm('Stop monthly dues? Your payment history is kept.')) return
    setBusy(true)
    try {
      await monthlyDuesService.optOut()
      if (enrollment?.hubtel_invoice_id) {
        // Cancellation completes only when Hubtel confirms; until then the
        // enrollment stays cancellation_pending with a retry action.
        await monthlyDuesService.manageRecurring('cancel').catch(() => null)
      }
      toast.success('You have opted out of monthly dues.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Opt-out failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleEnableRecurring = async () => {
    if (!settings) return
    if (
      !window.confirm(
        `Enable automatic monthly payments of ₵${settings.amount_ghs.toFixed(2)} via Hubtel? You can cancel at any time.`
      )
    )
      return
    setBusy(true)
    try {
      await monthlyDuesService.enroll(
        'recurring',
        consentEmail,
        consentSms,
        settings.policy_version
      )
      await monthlyDuesService.manageRecurring('create')
      toast.success('Recurring payments requested. Activation is confirmed by Hubtel.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enable recurring payments.')
    } finally {
      setBusy(false)
    }
  }

  const handleRecurringAction = async (action: 'verify' | 'cancel') => {
    setBusy(true)
    try {
      const result = await monthlyDuesService.manageRecurring(action)
      if (action === 'verify') {
        toast[result.status === 'active' ? 'success' : 'info'](
          result.status === 'active'
            ? 'Recurring payments are active.'
            : 'Hubtel has not confirmed activation yet.'
        )
      } else {
        toast[result.retryable ? 'error' : 'success'](
          result.retryable
            ? 'Hubtel could not confirm the cancellation yet — try again shortly.'
            : 'Recurring payments cancelled.'
        )
      }
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The recurring action failed.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="panel" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: FONT,
          }}
        >
          Loading monthly dues…
        </p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.3 }}
        >
          calendar_month
        </span>
        <p
          style={{
            margin: '12px 0 0',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            fontFamily: FONT,
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          Monthly dues are not available yet
        </p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: FONT,
          }}
        >
          The finance team has not configured the dues policy. Check back soon.
        </p>
      </div>
    )
  }

  const currency = getCurrencyForCountry(profile?.country)
  const localAmount = Math.round((settings.amount_ghs / currency.ghsRate) * 100) / 100

  if (enrollment?.status === 'cancellation_pending') {
    return (
      <div className="panel" style={{ padding: 24 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontFamily: FONT, color: 'hsl(var(--on-surface))' }}>
          Cancellation pending
        </h3>
        <p
          style={{
            margin: '6px 0 16px',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: FONT,
            lineHeight: 1.6,
            maxWidth: 480,
          }}
        >
          We asked Hubtel to cancel your recurring dues invoice but have not received confirmation
          yet. Your enrollment stays paused until Hubtel confirms — nothing further will be charged
          once cancellation completes.
        </p>
        <button
          className="btn btn-outline-dest btn-sm"
          disabled={busy}
          onClick={() => handleRecurringAction('cancel')}
        >
          Retry cancellation
        </button>
      </div>
    )
  }

  if (!isEnrolled) {
    return (
      <div className="panel" style={{ padding: 24 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontFamily: FONT, color: 'hsl(var(--on-surface))' }}>
          Support the movement every month
        </h3>
        <p
          style={{
            margin: '6px 0 16px',
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: FONT,
            lineHeight: 1.6,
            maxWidth: 480,
          }}
        >
          Voluntary monthly dues of{' '}
          <strong>
            {currency.code} {localAmount.toFixed(2)}
          </strong>{' '}
          (₵{settings.amount_ghs.toFixed(2)}) due on day {settings.due_day} of each month. You can
          opt out at any time; your history is always preserved.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontFamily: FONT,
              color: 'hsl(var(--on-surface))',
            }}
          >
            <input
              type="checkbox"
              checked={consentEmail}
              onChange={(e) => setConsentEmail(e.target.checked)}
              style={{ boxSizing: 'border-box' }}
            />
            Email me dues reminders
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontFamily: FONT,
              color: 'hsl(var(--on-surface))',
            }}
          >
            <input
              type="checkbox"
              checked={consentSms}
              onChange={(e) => setConsentSms(e.target.checked)}
              style={{ boxSizing: 'border-box' }}
            />
            Send me SMS dues reminders
          </label>
        </div>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={handleEnroll}>
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            how_to_reg
          </span>
          Enroll in Monthly Dues
        </button>
        {enrollment?.status === 'opted_out' && (
          <p
            style={{
              margin: '10px 0 0',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: FONT,
            }}
          >
            You previously opted out. Re-enrolling keeps your existing history.
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Current month obligation */}
      <div className="panel" style={{ padding: 24, marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: FONT,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              This Month&apos;s Dues
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                fontFamily: FONT,
              }}
            >
              {currentPayment
                ? `${currentPayment.display_currency} ${currentPayment.display_amount.toFixed(2)}`
                : `${currency.code} ${localAmount.toFixed(2)}`}
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: FONT,
              }}
            >
              ₵{(currentPayment?.amount_ghs ?? settings.amount_ghs).toFixed(2)} GHS
              {currentPayment ? ` · due ${currentPayment.due_date.slice(0, 10)}` : ''}
            </p>
          </div>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}
          >
            {currentPayment?.status === 'paid' ? (
              <>
                <span className="pill pill-ok">Paid</span>
                {currentPayment.receipt_number && (
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {currentPayment.receipt_number}
                  </span>
                )}
              </>
            ) : currentPayment?.status === 'failed' ? (
              <>
                <span className="pill pill-err">Failed</span>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={() => startCheckout(currentPayment)}
                >
                  Retry payment
                </button>
              </>
            ) : currentPayment ? (
              <>
                <span
                  className={`pill ${currentPayment.status === 'overdue' ? 'pill-err' : 'pill-warn'}`}
                >
                  {currentPayment.status}
                </span>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={busy}
                  onClick={() => startCheckout(currentPayment)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    payments
                  </span>
                  Pay this month
                </button>
              </>
            ) : (
              <span className="pill pill-mute">No obligation</span>
            )}
          </div>
        </div>
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: FONT,
            }}
          >
            Reminders:{' '}
            <Link to="/dashboard/settings" style={{ color: 'hsl(var(--primary))' }}>
              manage in notification settings
            </Link>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {settings.recurring_enrollment_enabled &&
              enrollment?.payment_mode === 'manual' &&
              enrollment.status === 'active' && (
                <button
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={handleEnableRecurring}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    autorenew
                  </span>
                  Enable recurring payments
                </button>
              )}
            {enrollment?.payment_mode === 'recurring' &&
              enrollment.status === 'pending_activation' && (
                <button
                  className="btn btn-outline btn-sm"
                  disabled={busy}
                  onClick={() => handleRecurringAction('verify')}
                >
                  Verify activation
                </button>
              )}
            <button className="btn btn-outline-dest btn-sm" disabled={busy} onClick={handleOptOut}>
              {enrollment?.payment_mode === 'recurring'
                ? 'Stop recurring payments'
                : 'Stop monthly dues'}
            </button>
          </div>
        </div>
      </div>

      {payments.length > 0 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() =>
              monthlyDuesExportService
                .exportMemberCsv()
                .catch(() => toast.error('Could not export your dues history.'))
            }
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              download
            </span>
            Export CSV
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() =>
              monthlyDuesExportService
                .exportMemberPdf()
                .catch(() => toast.error('Could not export your dues statement.'))
            }
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              picture_as_pdf
            </span>
            Export PDF
          </button>
        </div>
      )}

      <DuesPaymentHistory payments={payments} onRetry={startCheckout} />

      <HubtelPaymentModal
        isOpen={!!checkoutUrl}
        checkoutUrl={checkoutUrl}
        referenceId={checkoutRef}
        type="monthly_dues"
        onClose={() => {
          setCheckoutUrl(null)
          void load()
        }}
        onSuccess={() => {
          setCheckoutUrl(null)
          toast.success('Monthly dues payment confirmed. Thank you!')
          void load()
        }}
      />
    </>
  )
}
