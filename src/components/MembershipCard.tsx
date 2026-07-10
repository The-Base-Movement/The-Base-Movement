/**
 * MembershipCard Component
 * -------------------------------------------------------------
 * Renders a physical-card-style digital membership credential for a member.
 *
 * Architecture:
 * - `MembershipCardInner` – the card content (header, photo, DL field list,
 *   QR code, footer). Has a fixed design size of 520 × 325 px at 1:1.6 ratio.
 * - `MembershipCard` (default export) – a responsive wrapper that uses a
 *   ResizeObserver to scale the inner card proportionally to its container
 *   width using CSS `transform: scale()`.
 *
 * The `isForDownload` prop bypasses the scaling wrapper so the card can be
 * captured at full resolution for PNG / PDF export.
 *
 * Ghana / Diaspora branching:
 * - Ghana members show Region + Constituency fields.
 * - Diaspora members show Country + optional City fields.
 *
 * The QR code deep-links to the public verification page at
 * `/verify/<reg_no>`, allowing chapter officers to validate a card offline.
 */

import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface MembershipCardProps {
  userName?: string
  avatarUrl?: string | null
  userRegNo?: string
  onPhotoClick?: () => void
  initials?: string
  gender?: string
  joinedDate?: string
  status?: string
  country?: string
  region?: string
  constituency?: string
  chapter?: string
  city?: string
  isForDownload?: boolean
}

const MembershipCardInner: React.FC<MembershipCardProps> = ({
  userName,
  avatarUrl,
  userRegNo,
  onPhotoClick,
  initials,
  gender,
  joinedDate,
  status,
  country,
  region,
  constituency,
  chapter,
  city,
  isForDownload = false,
}) => {
  // Base styles from design handoff
  const cardStyle: React.CSSProperties = {
    background: '#fff',
    aspectRatio: '1.6 / 1',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '3px solid #006B3F',
    borderRight: '3px solid #006B3F',
    borderTop: '3px solid #CE1126',
    borderBottom: '3px solid #DAA520',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    boxShadow: isForDownload ? 'none' : '0 24px 48px -12px rgba(0,0,0,.18)',
    position: 'relative',
    width: '100%',
    fontFamily: "'Public Sans', sans-serif",
    minWidth: isForDownload ? 520 : 'auto',
  }

  const headStyle: React.CSSProperties = {
    background: '#CE1126',
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
    background: 'linear-gradient(to bottom, #CE1126, #DAA520, #006B3F)',
    borderRadius: 'var(--radius-sm)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  }

  const infoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    paddingRight: '88px',
  }

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
    color: '#6f7a71',
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
    background: '#f1f5ee',
    borderTop: '1px solid #dfe4dd',
    padding: '5px 14px',
    fontSize: '8px',
    fontWeight: 'var(--font-weight-medium, 500)',
    color: '#6f7a71',
    textAlign: 'center',
    flexShrink: 0,
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={headStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <h4
              style={{
                margin: 0,
                color: '#fff',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                lineHeight: 1,
              }}
            >
              The Base Movement
            </h4>
            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,.8)',
                fontSize: 8,
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              Ghana First, jobs for the youth!
            </p>
          </div>
        </div>
        <div
          style={{
            padding: '4px 10px',
            background: 'rgba(255,255,255,.1)',
            border: '1px solid rgba(255,255,255,.2)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 'var(--font-weight-medium, 500)',
            letterSpacing: '-.005em',
          }}
        >
          {country && country !== 'Ghana' ? 'DIASPORA MEMBER' : 'GHANA MEMBER'}
        </div>
      </div>

      {/* Body */}
      <div style={bodyStyle}>
        <div style={photoStyle}>
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '2px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 'var(--radius-xs)',
              cursor: onPhotoClick ? 'pointer' : 'default',
              overflow: 'hidden',
              position: 'relative',
            }}
            onClick={onPhotoClick}
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
                  background: '#006B3F',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 'var(--font-weight-medium, 500)',
                }}
              >
                {initials || 'M'}
              </div>
            )}
            {onPhotoClick && !isForDownload && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="photo-hover"
              >
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>
                  photo_camera
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={infoStyle}>
          <div style={nameStyle}>{userName || 'Member Name'}</div>
          <div style={{ height: 2, width: 36, background: '#006B3F', marginBottom: 8 }} />

          <dl style={dlStyle}>
            <dt style={dtStyle}>Reg. no.</dt>
            <dd style={{ ...ddStyle, color: '#006B3F' }}>{userRegNo || 'GH-XXXXXX'}</dd>

            <dt style={dtStyle}>Gender</dt>
            <dd style={ddStyle}>{gender || 'Not Specified'}</dd>

            {!country || country === 'Ghana' ? (
              <>
                <dt style={dtStyle}>Region</dt>
                <dd style={ddStyle}>{region || 'Not Specified'}</dd>
                <dt style={dtStyle}>Const.</dt>
                <dd style={ddStyle}>{constituency || 'Not Specified'}</dd>
              </>
            ) : (
              <>
                <dt style={dtStyle}>Country</dt>
                <dd style={ddStyle}>{country || 'Not Specified'}</dd>
                {city && (
                  <>
                    <dt style={dtStyle}>City</dt>
                    <dd style={ddStyle}>{city}</dd>
                  </>
                )}
              </>
            )}

            {country && country !== 'Ghana' && (
              <>
                <dt style={dtStyle}>Chapter</dt>
                <dd style={ddStyle}>{chapter || 'Not Specified'}</dd>
              </>
            )}

            <dt style={dtStyle}>Joined</dt>
            <dd style={ddStyle}>{joinedDate || '30 Mar 2025'}</dd>

            <dt style={dtStyle}>Status</dt>
            <dd style={{ ...ddStyle, color: '#006B3F' }}>● {status || 'Verified'}</dd>
          </dl>
        </div>

        <div style={qrStyle}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #dfe4dd',
              padding: 4,
            }}
          >
            <QRCodeSVG
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.thebasemovement.org.gh'}/verify/${userRegNo || 'GH-XXXXXX'}`}
              size={64}
              level="H"
            />
          </div>
          <span
            style={{
              fontSize: 8,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: '#6f7a71',
              textTransform: 'uppercase',
            }}
          >
            Verify ID
          </span>
        </div>

        {/* Watermark */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.06,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <img
            src="/branding/patterns/eagle-in-flight.png"
            alt=""
            style={{ width: '90%', maxWidth: 300, objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={footStyle}>
        If found, please return to the nearest Base Movement Chapter or contact the National HQ.
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .photo-hover:hover { opacity: 1 !important; }
      `,
        }}
      />
    </div>
  )
}

const MembershipCard: React.FC<MembershipCardProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        // Standard dashboard card max-width is 520
        if (width < 520 && width > 0) {
          setScale(width / 520)
        } else {
          setScale(1)
        }
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (props.isForDownload) {
    return <MembershipCardInner {...props} />
  }

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
        <MembershipCardInner {...props} />
      </div>
    </div>
  )
}

export default MembershipCard
