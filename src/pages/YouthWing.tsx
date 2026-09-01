import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { YW_SCOPE, YW_ACCENT, YW_ACCENT_SOFT } from './youth-wing/theme'

const PILLARS = [
  {
    icon: 'school',
    title: 'Civic education',
    body: 'Sessions on the Constitution, how Ghana is governed, how laws are made, and what citizenship asks of every one of us.',
  },
  {
    icon: 'diversity_3',
    title: 'Mentorship',
    body: 'Each member is paired with a vetted adult mentor from their region for study support, career guidance and character formation.',
  },
  {
    icon: 'trending_up',
    title: 'Leadership pipeline',
    body: 'Debate, public speaking and community service projects that prepare members to lead when they turn 18 and can join the Movement in full.',
  },
]

const NOT_ELIGIBLE = [
  'Voting in any internal Movement process',
  'Constituency or diaspora country leadership positions',
  'Party membership, party primaries or candidate selection',
  'Any internal decision-making body of the Movement',
]

const ELIGIBILITY = [
  'Aged 14 to 17 at the time of registration',
  'Resident in Ghana or abroad',
  'A parent or legal guardian who consents and can be contacted',
  'In school, or able to state your current education level',
]

const STEPS = [
  'You fill in the Youth Wing form, including your guardian details.',
  'Your guardian gives consent on the form. We record the exact time it was given.',
  'Our team contacts your guardian to confirm the consent is genuine.',
  'Once confirmed, your membership is activated and you receive a TBM-YW- number.',
]

export default function YouthWing() {
  return (
    <div className={YW_SCOPE}>
      <SEO
        title="Youth Wing (14 to 17) | The Base Movement"
        description="The Base Movement Youth Wing is a civic education, mentorship and leadership programme for young Ghanaians aged 14 to 17. It is not political party membership."
        canonical="/youth-wing"
      />

      <section
        style={{
          background: YW_ACCENT_SOFT,
          borderBottom: '1px solid hsl(var(--border))',
          padding: '28px 0 56px',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <Breadcrumbs currentLabel="Youth Wing" />
          <div className="grid lg:grid-cols-2 gap-10 items-center mt-6">
            <div>
              <span
                className="pill"
                style={{
                  background: 'hsla(var(--yw-accent), 0.12)',
                  color: YW_ACCENT,
                  border: '1px solid hsla(var(--yw-accent), 0.3)',
                }}
              >
                Ages 14 to 17
              </span>
              <h1
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 'clamp(30px, 5vw, 46px)',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: '14px 0 0',
                  lineHeight: 1.15,
                }}
              >
                The Base Youth Wing
              </h1>
              <BrandLine />
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 16,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '18px 0 0',
                  maxWidth: 560,
                  lineHeight: 1.65,
                }}
              >
                A civic and mobilization programme for young Ghanaians who are not yet of voting
                age. Members learn how their country works, serve their communities and build the
                habits of leadership, so that the day they turn 18 they are ready.
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <Link
                  to="/youth-wing/register"
                  className="btn"
                  style={{
                    background: YW_ACCENT,
                    color: 'hsl(var(--card))',
                    border: '1px solid ' + YW_ACCENT,
                  }}
                >
                  Join the Youth Wing
                </Link>
                <Link to="/youth-wing/articles" className="btn btn-outline">
                  Youth articles
                </Link>
                <Link to="/youth-wing/portal" className="btn btn-ghost">
                  Member portal
                </Link>
              </div>
            </div>

            <div
              className="panel"
              style={{ padding: '24px 26px', borderColor: 'hsla(var(--yw-accent), 0.35)' }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: YW_ACCENT,
                  margin: '0 0 10px',
                }}
              >
                Read this first
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14.5,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                  lineHeight: 1.65,
                }}
              >
                Under the Constitution of Ghana, political party membership is tied to the voting
                age of 18. The Youth Wing is therefore a{' '}
                <strong>civic and mobilization programme</strong>, not party membership. Youth Wing
                members are recorded separately from the Ghana Resident Network and the Diaspora
                Network.
              </p>
              <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none' }}>
                {NOT_ELIGIBLE.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      fontSize: 13.5,
                      color: 'hsl(var(--on-surface-muted))',
                      marginBottom: 8,
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16, color: 'hsl(var(--destructive))', marginTop: 1 }}
                    >
                      block
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-5 lg:px-8 py-14" data-fade-stagger>
        <h2
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 26,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: 0,
          }}
        >
          What the programme does
        </h2>
        <BrandLine />
        <div className="grid md:grid-cols-3 gap-5 mt-8">
          {PILLARS.map((p) => (
            <div key={p.title} className="panel" style={{ padding: '22px 24px' }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 30, color: YW_ACCENT }}
              >
                {p.icon}
              </span>
              <h3
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 17,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: '12px 0 8px',
                }}
              >
                {p.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: 0,
                  lineHeight: 1.65,
                }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          background: 'hsl(var(--container-low))',
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-14">
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <h2
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 24,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                }}
              >
                Who can join
              </h2>
              <BrandLine />
              <ul style={{ margin: '18px 0 0', padding: 0, listStyle: 'none' }}>
                {ELIGIBILITY.map((item) => (
                  <li
                    key={item}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-start',
                      fontSize: 14.5,
                      color: 'hsl(var(--on-surface))',
                      marginBottom: 10,
                      lineHeight: 1.55,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: YW_ACCENT, marginTop: 1 }}
                    >
                      check_circle
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel" style={{ padding: '24px 26px' }}>
              <h3
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 18,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  margin: '0 0 14px',
                }}
              >
                How registration works
              </h3>
              {STEPS.map((stepText, i) => (
                <div key={stepText} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--radius-pill)',
                      background: 'hsla(var(--yw-accent), 0.12)',
                      color: YW_ACCENT,
                      fontSize: 12,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 14,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    {stepText}
                  </p>
                </div>
              ))}
              <p
                style={{
                  fontSize: 12.5,
                  color: 'hsl(var(--on-surface-muted))',
                  margin: '4px 0 0',
                  lineHeight: 1.55,
                }}
              >
                We do not collect a Ghana Card number or a Voter ID number for the Youth Wing.
                Members are not eligible for either.
              </p>
              <Link
                to="/youth-wing/register"
                className="btn"
                style={{
                  marginTop: 18,
                  background: YW_ACCENT,
                  color: 'hsl(var(--card))',
                  border: '1px solid ' + YW_ACCENT,
                }}
              >
                Start Youth Wing registration
              </Link>
            </div>
          </div>

          <p
            style={{
              fontSize: 13.5,
              color: 'hsl(var(--on-surface-muted))',
              margin: '28px 0 0',
              lineHeight: 1.6,
            }}
          >
            Are you 18 or older?{' '}
            <Link to="/register" style={{ color: 'hsl(var(--primary))' }}>
              Register with the Ghana Resident or Diaspora Network instead
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  )
}
