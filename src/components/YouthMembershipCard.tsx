/**
 * YouthMembershipCard
 * -------------------------------------------------------------
 * The Youth Wing credential (ages 14-17). Adapted from MembershipCard, kept as
 * a separate component on purpose: a youth card must never be mistakable for an
 * adult party membership card.
 *
 * What is deliberately different from the adult card:
 * - Teal identity band instead of the red party header.
 * - "YOUTH WING · CIVIC MEMBER" plate, plus a printed line stating the card
 *   carries no voting or leadership rights.
 * - No constituency, no diaspora chapter, no party fields. Age and education
 *   level instead, since those are what a youth programme officer needs.
 * - QR points at /youth-wing/verify/<number>, not the adult /verify page.
 *
 * Same 520 x 325 geometry and ResizeObserver scaling as the adult card, so the
 * existing download/print actions work unchanged.
 */

import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

const TEAL = '#1a6e7d'
const TEAL_DEEP = '#124e59'
const GOLD = '#DAA520'
const GREEN = '#006B3F'

interface YouthMembershipCardProps {
  userName?: string
  membershipNumber?: string
  avatarUrl?: string | null
  initials?: string
  gender?: string
  age?: number
  region?: string
  country?: string
  educationLevel?: string
  joinedDate?: string
  status?: string
  isForDownload?: boolean
}

const YouthMembershipCardInner: React.FC<YouthMembershipCardProps> = ({
  userName,
  membershipNumber,
  avatarUrl,
  initials,
  gender,
  age,
  region,
  country,
  educationLevel,
  joinedDate,
  status,
  isForDownload = false,
}) => {
  const cardStyle: React.CSSProperties = {
    background: '#fff',
    aspectRatio: '1.6 / 1',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `3px solid ${TEAL}`,
    borderRight: `3px solid ${TEAL}`,
    borderTop: `3px solid ${TEAL_DEEP}`,
    borderBottom: `3px solid ${GOLD}`,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    boxShadow: isForDownload ? 'none' : '0 24px 48px -12px rgba(0,0,0,.18)',
    position: 'relative',
    width: '100%',
    fontFamily: "'Public Sans', sans-serif",
    minWidth: isForDownload ? 520 : 'auto',
  }

  const headStyle: React.CSSProperties = {
    background: TEAL,
    padding: '12px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  }

  const bodyStyle: React.CSSProperties = {
    flex: 1,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  }

  const photoStyle: React.CSSProperties = {
    width: '120px',
    height: '155px',
    padding: '2px',
    background: `linear-gradient(to bottom, ${TEAL_DEEP}, ${TEAL}, ${GOLD})`,
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  }

  const infoStyle: React.CSSProperties = { flex: 1, minWidth: 0, paddingRight: '88px' }

  const nameStyle: React.CSSProperties = {
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: '18px',
    lineHeight: '28px',
    letterSpacing: '-.015em',
    paddingBottom: '3px',
    color: '#181d19',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textTransform: 'capitalize',
  }

  const dlStyle: React.CSSProperties = {
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '3px 12px',
  }

  const dtStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 'var(--font-weight-medium, 500)',
    color: '#616b63',
    textTransform: 'uppercase',
    lineHeight: '16px',
    paddingBottom: '4px',
  }

  const ddStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '11px',
    fontWeight: 'var(--font-weight-medium, 500)',
    color: '#181d19',
    letterSpacing: '-.005em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: '16px',
    paddingBottom: '4px',
  }

  const qrStyle: React.CSSProperties = {
    position: 'absolute',
    right: '18px',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    zIndex: 20,
  }

  const footStyle: React.CSSProperties = {
    background: '#eef6f7',
    borderTop: '1px solid #d3e3e6',
    padding: '5px 14px',
    fontSize: '8px',
    fontWeight: 'var(--font-weight-medium, 500)',
    color: '#4a5d61',
    textAlign: 'center',
    flexShrink: 0,
  }

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.thebasemovement.org.gh'

  return (
    <div style={cardStyle}>
      <div style={headStyle}>
        <div>
          <h3
            style={{
              margin: 0,
              color: '#fff',
              fontSize: 11,
              fontWeight: 'var(--font-weight-medium, 500)',
              lineHeight: 1,
            }}
          >
            The Base Movement
          </h3>
          <p style={{ margin: '2px 0 0', color: '#fff', fontSize: 8, fontWeight: 500 }}>
            Youth Wing &middot; civic education &amp; mentorship
          </p>
        </div>
        <div
          style={{
            padding: '4px 10px',
            background: 'rgba(255,255,255,.12)',
            border: '1px solid rgba(255,255,255,.25)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 'var(--font-weight-medium, 500)',
            letterSpacing: '-.005em',
          }}
        >
          YOUTH WING &middot; 14-17
        </div>
      </div>

      <div style={bodyStyle}>
        <div style={photoStyle}>
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '2px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 'var(--radius-xs)',
              overflow: 'hidden',
            }}
          >
            {avatarUrl ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${avatarUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  borderRadius: 'var(--radius-xs)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: TEAL,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                {initials || 'Y'}
              </div>
            )}
          </div>
        </div>

        <div style={infoStyle}>
          <div style={nameStyle}>{userName || 'Youth Member'}</div>
          <div style={{ height: 2, width: 36, background: TEAL, marginBottom: 8 }} />

          <dl style={dlStyle}>
            <dt style={dtStyle}>Member no.</dt>
            <dd style={{ ...ddStyle, color: TEAL }}>{membershipNumber || 'TBM-YW-XXXXXX'}</dd>

            <dt style={dtStyle}>Age</dt>
            <dd style={ddStyle}>{typeof age === 'number' ? `${age} years` : 'Not Specified'}</dd>

            <dt style={dtStyle}>Gender</dt>
            <dd style={ddStyle}>{gender || 'Not Specified'}</dd>

            <dt style={dtStyle}>{!country || country === 'Ghana' ? 'Region' : 'Country'}</dt>
            <dd style={ddStyle}>
              {(!country || country === 'Ghana' ? region : country) || 'Not Specified'}
            </dd>

            <dt style={dtStyle}>Level</dt>
            <dd style={ddStyle}>{educationLevel || 'Not Specified'}</dd>

            <dt style={dtStyle}>Joined</dt>
            <dd style={ddStyle}>{joinedDate || '—'}</dd>

            <dt style={dtStyle}>Status</dt>
            <dd style={{ ...ddStyle, color: TEAL }}>● {status || 'Pending'}</dd>
          </dl>
        </div>

        <div style={qrStyle}>
          <div style={{ background: '#fff', border: '1px solid #d3e3e6', padding: 4 }}>
            <QRCodeSVG
              value={`${origin}/youth-wing/verify/${membershipNumber || 'TBM-YW-XXXXXX'}`}
              size={64}
              level="H"
              fgColor={TEAL_DEEP}
            />
          </div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: '#4a5d61',
              textTransform: 'uppercase',
            }}
          >
            Verify
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.05,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <img
            src="/branding/patterns/eagle-in-flight.webp"
            alt=""
            style={{ width: '90%', maxWidth: 300, objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* The legal line is printed on the card itself: this is not a party card. */}
      <div style={footStyle}>
        Civic and mobilization member. Not political party membership. No voting or leadership
        rights in the Movement. Valid until the holder turns 18.
      </div>

      <div style={{ height: 3, display: 'flex', flexShrink: 0 }} aria-hidden="true">
        <div style={{ flex: 1, background: TEAL }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>
    </div>
  )
}

const YouthMembershipCard: React.FC<YouthMembershipCardProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        if (width < 520 && width > 0) setScale(width / 520)
        else setScale(1)
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (props.isForDownload) return <YouthMembershipCardInner {...props} />

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 520,
        height: (520 / 1.6) * scale,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: 520,
          height: 520 / 1.6,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <YouthMembershipCardInner {...props} />
      </div>
    </div>
  )
}

export default YouthMembershipCard
