import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import YouthMembershipCard from '@/components/YouthMembershipCard'
import { YouthMembershipCardActions } from '@/components/YouthMembershipCardActions'
import { youthWingService, type YouthWingLookup } from '@/services/youthWingService'
import type { BlogPost } from '@/types/admin'
import { YW_SCOPE, YW_ACCENT, YW_ACCENT_SOFT } from './theme'

/**
 * The Youth Wing portal: a separate, limited surface, not the member dashboard.
 * Youth Wing records have no auth account and no access to polls, leadership,
 * constituency tools or any internal party process. Sign-in is a membership
 * number plus date of birth, and the only content shown is youth programme
 * material and Youth Wing articles (audience = 'YOUTH'), never adult articles.
 *
 * Staff route in with ?member=TBM-YW-xxxxxx, which reads the record through an
 * admin-gated RPC rather than the youth's date of birth. Authorization lives in
 * the database: a non-admin following the same link just gets the sign-in form.
 */

const STATUS_COPY: Record<string, { label: string; pill: string; note: string }> = {
  PENDING_CONSENT: {
    label: 'Pending guardian consent',
    pill: 'pill-warn',
    note: 'Our team is confirming consent with the parent or guardian you listed. Your membership activates once that call is complete.',
  },
  ACTIVE: {
    label: 'Active',
    pill: 'pill-ok',
    note: 'Guardian consent has been confirmed. You are a full Youth Wing member.',
  },
  REJECTED: {
    label: 'Not activated',
    pill: 'pill-err',
    note: 'We could not confirm guardian consent for this registration. Please contact the Movement if you believe this is a mistake.',
  },
  GRADUATED: {
    label: 'Graduated at 18',
    pill: 'pill-mute',
    note: 'You have turned 18, so your Youth Wing membership has closed. You can now register as a full member of the Movement.',
  },
}

const MODULES = [
  {
    icon: 'gavel',
    title: 'How Ghana is governed',
    body: 'The Constitution, the three arms of government, and where power actually sits.',
  },
  {
    icon: 'campaign',
    title: 'Civic voice',
    body: 'How to raise an issue in your community, write to an assembly member and be heard.',
  },
  {
    icon: 'record_voice_over',
    title: 'Debate and public speaking',
    body: 'Structuring an argument, listening well, and disagreeing without contempt.',
  },
  {
    icon: 'handshake',
    title: 'Community service',
    body: 'Youth-led clean-ups, literacy support and mentorship projects in your region.',
  },
]

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 46,
  boxSizing: 'border-box',
  background: 'transparent',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-xs)',
  padding: '0 14px',
  fontSize: 14,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface))',
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 6,
}

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif",
  fontSize: 20,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface))',
  margin: '34px 0 0',
}

export default function YouthWingPortal() {
  const [searchParams] = useSearchParams()
  const adminMemberParam = searchParams.get('member')
  const [membershipNumber, setMembershipNumber] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [member, setMember] = useState<YouthWingLookup | null>(null)
  const [viewingAsStaff, setViewingAsStaff] = useState(false)
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [tab, setTab] = useState<'card' | 'programme' | 'articles'>('card')

  // Staff deep link. The RPC is admin-gated, so a member (or a logged-out
  // visitor) who tries the same URL simply falls through to the sign-in form.
  useEffect(() => {
    if (!adminMemberParam) return
    let cancelled = false
    youthWingService.adminLookup(adminMemberParam).then((found) => {
      if (cancelled || !found) return
      setMember(found)
      setViewingAsStaff(true)
    })
    return () => {
      cancelled = true
    }
  }, [adminMemberParam])

  useEffect(() => {
    if (!member) return
    youthWingService
      .getArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
  }, [member])

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!membershipNumber.trim() || !dateOfBirth) {
      toast.error('Enter your membership number and date of birth.')
      return
    }
    setIsLoading(true)
    try {
      const found = await youthWingService.lookup(membershipNumber, dateOfBirth)
      if (!found) {
        toast.error('No Youth Wing member matches that number and date of birth.')
        return
      }
      setMember(found)
    } catch (error) {
      toast.error((error as Error)?.message || 'Lookup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const status = member ? (STATUS_COPY[member.status] ?? STATUS_COPY.PENDING_CONSENT) : null
  const initials = member
    ? member.full_name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
    : ''

  return (
    <div className={YW_SCOPE}>
      <SEO title="Youth Wing portal | The Base Movement" noindex />

      <div className="max-w-[980px] mx-auto px-5 lg:px-8 py-12">
        <h1
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 'clamp(26px, 4vw, 34px)',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          Youth Wing portal
        </h1>
        <BrandLine />

        {!member ? (
          <form
            onSubmit={handleLookup}
            className="panel"
            style={{ padding: '26px 28px', marginTop: 24, maxWidth: 520 }}
          >
            <p
              style={{
                fontSize: 14,
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 20px',
                lineHeight: 1.6,
              }}
            >
              Enter the membership number you were given when you registered, and your date of
              birth.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="yw-portal-number" style={labelStyle}>
                Membership number
              </label>
              <input
                id="yw-portal-number"
                value={membershipNumber}
                onChange={(e) => setMembershipNumber(e.target.value)}
                style={fieldStyle}
                placeholder="TBM-YW-000123"
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label htmlFor="yw-portal-dob" style={labelStyle}>
                Date of birth
              </label>
              <input
                id="yw-portal-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={fieldStyle}
              />
            </div>
            <button
              type="submit"
              className="btn"
              disabled={isLoading}
              style={{
                background: YW_ACCENT,
                color: 'hsl(var(--card))',
                border: '1px solid ' + YW_ACCENT,
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Checking…' : 'View my membership'}
            </button>
          </form>
        ) : (
          <>
            {viewingAsStaff && (
              <div
                className="panel"
                style={{
                  padding: '14px 18px',
                  marginTop: 24,
                  borderColor: 'hsl(var(--accent))',
                  background: 'hsla(var(--accent), 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: 'hsl(var(--accent))' }}
                >
                  visibility
                </span>
                <p style={{ fontSize: 13, color: 'hsl(var(--on-surface))', margin: 0, flex: 1 }}>
                  Staff view. You are looking at this member&apos;s own portal, read only. They did
                  not sign in and are not notified.
                </p>
                <Link to="/admin/youth-wing/directory" className="btn btn-outline btn-sm">
                  Back to directory
                </Link>
              </div>
            )}

            <div
              className="panel"
              style={{
                padding: '24px 26px',
                marginTop: viewingAsStaff ? 12 : 24,
                borderColor: 'hsla(var(--yw-accent), 0.35)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
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
                    {member.full_name}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: YW_ACCENT,
                      margin: '4px 0 0',
                      letterSpacing: '0.04em',
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {member.membership_number} &middot; age {member.age}
                  </p>
                </div>
                <span className={`pill ${status?.pill}`}>{status?.label}</span>
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '16px 0 0',
                  lineHeight: 1.6,
                }}
              >
                {status?.note}
              </p>
              {member.status === 'GRADUATED' && (
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 14, display: 'inline-flex' }}
                >
                  Register as a full member
                </Link>
              )}
            </div>

            <div
              className="panel"
              style={{ padding: '18px 22px', marginTop: 16, background: YW_ACCENT_SOFT }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                The Youth Wing is a civic and mobilization programme. It does not include voting in
                Movement processes, leadership positions, or party membership. Those open to you at
                18.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-7">
              {(
                [
                  ['card', 'My card'],
                  ['programme', 'Programme'],
                  ['articles', 'Youth articles'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn btn-sm ${tab === key ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'card' && (
              <div style={{ marginTop: 22 }}>
                <YouthMembershipCard
                  userName={member.full_name}
                  membershipNumber={member.membership_number}
                  initials={initials}
                  gender={member.gender || undefined}
                  age={member.age}
                  region={member.region || undefined}
                  country={member.country || undefined}
                  educationLevel={member.education_level || undefined}
                  joinedDate={new Date(member.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                  status={status?.label}
                />
                <div style={{ maxWidth: 520, margin: '16px auto 0' }}>
                  <YouthMembershipCardActions
                    cardProps={{
                      userName: member.full_name,
                      membershipNumber: member.membership_number,
                      initials,
                      gender: member.gender || undefined,
                      age: member.age,
                      region: member.region || undefined,
                      country: member.country || undefined,
                      educationLevel: member.education_level || undefined,
                      joinedDate: new Date(member.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }),
                      status: status?.label,
                    }}
                  />
                </div>
              </div>
            )}

            {tab === 'programme' && (
              <>
                <h2 style={sectionTitle}>Your programme</h2>
                <BrandLine />
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  {MODULES.map((m) => (
                    <div key={m.title} className="panel" style={{ padding: '20px 22px' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 26, color: YW_ACCENT }}
                      >
                        {m.icon}
                      </span>
                      <h3
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 16,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: 'hsl(var(--on-surface))',
                          margin: '10px 0 6px',
                        }}
                      >
                        {m.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 13.5,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: 0,
                          lineHeight: 1.6,
                        }}
                      >
                        {m.body}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-8">
                  <Link to="/events" className="btn btn-outline">
                    Upcoming events
                  </Link>
                </div>
              </>
            )}

            {tab === 'articles' && (
              <>
                <h2 style={sectionTitle}>Youth Wing articles</h2>
                <BrandLine />
                {articles.length === 0 ? (
                  <p
                    style={{
                      fontSize: 14,
                      color: 'hsl(var(--on-surface-muted))',
                      marginTop: 18,
                    }}
                  >
                    No Youth Wing articles have been published yet.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    {articles.map((a) => (
                      <Link
                        key={a.id}
                        to={`/youth-wing/articles/${a.slug}`}
                        className="panel"
                        style={{ padding: '20px 22px', textDecoration: 'none', display: 'block' }}
                      >
                        <p
                          style={{
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: YW_ACCENT,
                            margin: '0 0 6px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                          }}
                        >
                          {a.category || 'Youth Wing'}
                        </p>
                        <h3
                          style={{
                            fontFamily: "'Public Sans', sans-serif",
                            fontSize: 16,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                            margin: '0 0 6px',
                          }}
                        >
                          {a.title}
                        </h3>
                        <p
                          style={{
                            fontSize: 13.5,
                            color: 'hsl(var(--on-surface-muted))',
                            margin: 0,
                            lineHeight: 1.6,
                          }}
                        >
                          {a.excerpt}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex flex-wrap gap-3 mt-8">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setMember(null)
                  setViewingAsStaff(false)
                }}
              >
                {viewingAsStaff ? 'Close staff view' : 'Sign out'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
