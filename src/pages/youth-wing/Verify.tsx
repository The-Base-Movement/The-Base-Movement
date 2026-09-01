import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import { youthWingService, type YouthWingVerification } from '@/services/youthWingService'
import { YW_SCOPE, YW_ACCENT, YW_ACCENT_SOFT } from './theme'

/**
 * Target of the Youth Wing card QR code. Separate from the adult /verify page on
 * purpose: it confirms a youth card is genuine without ever exposing the
 * holder's date of birth, school or guardian details, and it states plainly that
 * the card is not party membership.
 */

const STATUS_PILL: Record<string, { label: string; pill: string }> = {
  ACTIVE: { label: 'Active Youth Wing member', pill: 'pill-ok' },
  PENDING_CONSENT: { label: 'Pending guardian consent', pill: 'pill-warn' },
  REJECTED: { label: 'Not activated', pill: 'pill-err' },
  GRADUATED: { label: 'Graduated at 18', pill: 'pill-mute' },
}

export default function YouthWingVerify() {
  const { membershipNumber } = useParams<{ membershipNumber: string }>()
  const [record, setRecord] = useState<YouthWingVerification | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!membershipNumber) return
    youthWingService
      .verify(membershipNumber)
      .then(setRecord)
      .catch(() => setRecord(null))
      .finally(() => setIsLoading(false))
  }, [membershipNumber])

  const status = record ? (STATUS_PILL[record.status] ?? STATUS_PILL.PENDING_CONSENT) : null

  return (
    <div className={YW_SCOPE}>
      <SEO title="Verify a Youth Wing card | The Base Movement" noindex />

      <div className="max-w-[620px] mx-auto px-5 py-16">
        <h1
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 26,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Youth Wing card check
        </h1>
        <BrandLine />

        <div
          className="panel"
          style={{
            padding: '26px 28px',
            marginTop: 24,
            borderColor: 'hsla(var(--yw-accent), 0.35)',
          }}
        >
          {isLoading ? (
            <p style={{ color: 'hsl(var(--on-surface-muted))', margin: 0 }}>Checking…</p>
          ) : !record ? (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 34, color: 'hsl(var(--destructive))' }}
              >
                error
              </span>
              <p
                style={{
                  fontSize: 15,
                  color: 'hsl(var(--on-surface))',
                  margin: '10px 0 0',
                  lineHeight: 1.6,
                }}
              >
                No Youth Wing member carries the number{' '}
                <strong>{membershipNumber || 'that was scanned'}</strong>. This card could not be
                verified.
              </p>
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '0 0 4px',
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                Youth Wing member
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 22,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                {record.full_name}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: YW_ACCENT,
                  margin: '4px 0 14px',
                  letterSpacing: '0.04em',
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                {record.membership_number}
              </p>
              <span className={`pill ${status?.pill}`}>{status?.label}</span>
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '14px 0 0',
                  lineHeight: 1.6,
                }}
              >
                {record.region || record.country} &middot; joined{' '}
                {new Date(record.created_at).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </>
          )}
        </div>

        <div
          className="panel"
          style={{ padding: '16px 20px', marginTop: 16, background: YW_ACCENT_SOFT }}
        >
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface))', margin: 0, lineHeight: 1.6 }}>
            A Youth Wing card is a civic and mobilization credential for 14 to 17 year olds. It is
            not political party membership and carries no voting or leadership rights in the
            Movement.
          </p>
        </div>

        <Link to="/youth-wing" className="btn btn-ghost" style={{ marginTop: 20 }}>
          About the Youth Wing
        </Link>
      </div>
    </div>
  )
}
