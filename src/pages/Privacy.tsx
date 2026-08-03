import { Breadcrumbs } from '@/components/Breadcrumbs'
import SEO from '@/components/SEO'

const SECTIONS = [
  {
    icon: 'person',
    iconColor: 'var(--primary)',
    title: '1. Who we are (Data Controller)',
    content: (
      <>
        <p>
          The Base Movement (<strong>"we", "us", "The Base"</strong>) is a Ghanaian political
          movement registered in Ghana. We act as the <em>data controller</em> for all personal data
          collected through this website and our membership platform.
        </p>
        <p>
          <strong>Contact for data protection matters:</strong>
          <br />
          The Base Movement — Data Protection Desk
          <br />
          Email:{' '}
          <a
            href="mailto:privacy@thebasemovement.org.gh"
            className="text-brand-green hover:underline"
          >
            privacy@thebasemovement.org.gh
          </a>
          <br />
          Postal: Accra, Ghana
        </p>
        <p>
          We are committed to complying with Ghana's{' '}
          <strong>Data Protection Act, 2012 (Act 843)</strong> and the regulations of the Data
          Protection Commission (DPC).
        </p>
      </>
    ),
  },
  {
    icon: 'database',
    iconColor: 'var(--accent)',
    title: '2. What data we collect and why',
    content: (
      <>
        <p>We collect the following categories of personal data:</p>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'hsl(var(--muted))' }}>
                {['Data category', 'Examples', 'Purpose', 'Legal basis'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  'Identity & contact',
                  'Full name, email, phone',
                  'Membership registration & communication',
                  'Consent',
                ],
                [
                  'Location',
                  'Region, constituency, country (diaspora)',
                  'Chapter assignment & mobilisation',
                  'Consent',
                ],
                [
                  'Political affiliation',
                  'Membership in The Base Movement',
                  'Core movement activity',
                  'Explicit consent (sensitive data — Act 843 s.16)',
                ],
                [
                  'National ID',
                  'Ghana Card / Passport number (encrypted)',
                  'Identity verification',
                  'Consent',
                ],
                [
                  'Payment data',
                  'Transaction reference via Hubtel',
                  'Dues & donations processing',
                  'Contract / Consent',
                ],
                [
                  'Usage data',
                  'Pages visited (anonymised)',
                  'Site improvement via Vercel Analytics',
                  'Legitimate interest',
                ],
                [
                  'Error logs',
                  'Stack traces, browser type via Sentry',
                  'Bug detection & platform stability',
                  'Legitimate interest',
                ],
                [
                  'Email engagement',
                  'Subscription status, open events',
                  'Newsletter delivery',
                  'Consent',
                ],
              ].map(([cat, ex, pur, basis]) => (
                <tr key={cat} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {[cat, ex, pur, basis].map((cell, i) => (
                    <td key={i} style={{ padding: '8px 12px', fontSize: 13 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          <strong>Political affiliation is sensitive data</strong> under Act 843 s.16. We process it
          only with your explicit consent and only for the core purposes of movement membership and
          coordination.
        </p>
      </>
    ),
  },
  {
    icon: 'business',
    iconColor: 'var(--on-surface)',
    title: '3. Third-party data processors',
    content: (
      <>
        <p>
          We share your data with the following processors, each bound by their own privacy and
          security commitments:
        </p>
        <ul className="space-y-2 text-sm" style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
          {[
            [
              'Vercel Inc. (USA)',
              'Hosting & content delivery. Data may transit US servers. Standard Contractual Clauses apply.',
            ],
            [
              'Supabase Inc. (EU/USA)',
              'Database, authentication, and file storage. Member data is stored in their managed Postgres cluster.',
            ],
            [
              'Hubtel Ghana Ltd.',
              'Payment processing for donations and dues. Hubtel handles card/mobile-money data under their own PCI-DSS compliance.',
            ],
            [
              'Vercel Analytics',
              'Privacy-first, cookie-free web analytics. Only anonymised page-view data is captured.',
            ],
            [
              'Sentry (sentry.io)',
              'Error monitoring. Stack traces and browser metadata may be captured. No deliberate PII is sent.',
            ],
            [
              'Mapbox Inc.',
              'Interactive maps, map tiles and geolocation visualisation. Requests may disclose IP address, device information and approximate location to Mapbox.',
            ],
            ['Resend / Mail provider', 'Transactional and newsletter email delivery.'],
          ].map(([name, desc]) => (
            <li key={name}>
              <strong>{name}</strong> — {desc}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          We do not sell, rent, or trade your personal data to any third party for marketing
          purposes.
        </p>
      </>
    ),
  },
  {
    icon: 'schedule',
    iconColor: 'var(--destructive)',
    title: '4. Retention and deletion',
    content: (
      <>
        <ul className="space-y-2 text-sm" style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
          <li>
            <strong>Active member profiles</strong> — retained for the duration of membership.
          </li>
          <li>
            <strong>Donation records</strong> — retained for 7 years for financial audit compliance.
          </li>
          <li>
            <strong>Error logs (Sentry)</strong> — auto-deleted after 90 days.
          </li>
          <li>
            <strong>Analytics data (Vercel Analytics)</strong> — anonymised, retained indefinitely
            in aggregate.
          </li>
          <li>
            <strong>Deactivated accounts</strong> — soft-deleted; a 90-day retention window applies
            before permanent erasure.
          </li>
          <li>
            <strong>Newsletter subscriptions</strong> — removed within 7 days of unsubscribe
            request.
          </li>
        </ul>
        <p className="mt-4">
          You may request deletion of your account at any time by contacting{' '}
          <a
            href="mailto:privacy@thebasemovement.org.gh"
            className="text-brand-green hover:underline"
          >
            privacy@thebasemovement.org.gh
          </a>
          . Financial records required by law will be retained for their statutory period.
        </p>
      </>
    ),
  },
  {
    icon: 'verified_user',
    iconColor: 'var(--primary)',
    title: '5. Your rights under Act 843',
    content: (
      <>
        <p>Under Ghana's Data Protection Act 843 you have the following rights:</p>
        <ul className="space-y-2 text-sm" style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
          {[
            ['Right of access', 'Request a copy of the personal data we hold about you.'],
            ['Right to correction', 'Request correction of inaccurate or incomplete data.'],
            [
              'Right to deletion',
              'Request erasure of your data (subject to legal retention obligations).',
            ],
            ['Right to object', 'Object to processing based on legitimate interest.'],
            [
              'Right to withdraw consent',
              'Withdraw consent at any time without affecting prior processing.',
            ],
            [
              'Right to lodge a complaint',
              'File a complaint with the Data Protection Commission of Ghana (dataprotection.org.gh).',
            ],
          ].map(([right, desc]) => (
            <li key={right}>
              <strong>{right}</strong> — {desc}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          To exercise any right, email{' '}
          <a
            href="mailto:privacy@thebasemovement.org.gh"
            className="text-brand-green hover:underline"
          >
            privacy@thebasemovement.org.gh
          </a>
          . We will respond within 21 days as required by Act 843.
        </p>
      </>
    ),
  },
  {
    icon: 'cookie',
    iconColor: 'var(--accent)',
    title: '6. Cookies and session data',
    content: (
      <>
        <p>This site uses minimal cookies. Here is what we set:</p>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'hsl(var(--muted))' }}>
                {['Name / prefix', 'Provider', 'Purpose', 'Type', 'Expiry'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                [
                  'sb-* (session)',
                  'Supabase',
                  'Keeps you logged in',
                  'Strictly necessary',
                  'Session',
                ],
              ].map((row) => (
                <tr key={row[0]} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  {row.map((cell, i) => (
                    <td key={i} style={{ padding: '8px 12px', fontSize: 13 }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          No third-party advertising cookies are set. Supabase session tokens are stored in{' '}
          <code>sessionStorage</code> (not a persistent cookie) and are cleared when you close the
          browser tab.
        </p>
      </>
    ),
  },
  {
    icon: 'analytics',
    iconColor: 'var(--primary)',
    title: '7. Analytics',
    content: (
      <>
        <p>
          We use <strong>Vercel Analytics</strong> to understand how visitors use this site and
          monitor performance. It does not use cookies and does not collect personally identifiable
          information — all data is aggregated and anonymous.
        </p>
      </>
    ),
  },
  {
    icon: 'public',
    iconColor: 'var(--on-surface)',
    title: '8. International data transfers',
    content: (
      <>
        <p>
          Our data processors (Vercel, Supabase) may store data outside Ghana, including in the
          United States and European Union. Where applicable, we rely on:
        </p>
        <ul className="space-y-1 text-sm" style={{ paddingLeft: '1.25rem', listStyleType: 'disc' }}>
          <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
          <li>Processors' own adequacy and security certifications (SOC 2, ISO 27001)</li>
        </ul>
        <p className="mt-4">
          <em>
            Note: This policy has been drafted for review by a qualified Ghanaian data-protection
            lawyer before final publication. It reflects our current understanding and practices as
            of the date below.
          </em>
        </p>
      </>
    ),
  },
]

export default function Privacy() {
  return (
    <main className="bg-surface-warm font-body-md min-h-screen pb-24">
      <SEO
        title="Privacy Policy"
        description="Our commitment to your data rights under Ghana's Data Protection Act 843. Learn how The Base Movement collects, uses, and protects your personal information."
        canonical="/privacy"
      />

      {/* Hero */}
      <div className="bg-charcoal-dark text-white pt-24 pb-16 border-b-4 border-brand-green relative overflow-hidden">
        <div className="page-container relative z-10">
          <Breadcrumbs />
          <p className="font-meta text-warm-gold tracking-tight text-xs mb-3 mt-6">
            Data Protection — Act 843
          </p>
          <h1 className="font-meta font-medium text-4xl md:text-5xl tracking-tight leading-tight mb-4">
            Privacy <span className="text-brand-green">Policy</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl font-body-md">
            Our commitment to your data rights under Ghana's Data Protection Act 843. We collect
            only what we need, protect what you share, and tell you exactly how we use it.
          </p>
          <p className="text-xs text-slate-400 mt-6">
            Last updated: July 2026. Draft for legal review — final version pending approval by a
            qualified Ghanaian data-protection lawyer.
          </p>
        </div>
      </div>

      <div className="page-container py-16">
        <div className="max-w-4xl">
          <div className="flow" style={{ '--flow-space': '2rem' } as React.CSSProperties}>
            {SECTIONS.map(({ icon, iconColor, title, content }) => (
              <section
                key={title}
                className="bg-white p-8 md:p-10 border border-slate-200 shadow-sm"
              >
                <div className="flex gap-5 mb-5">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-sm)',
                      background: `hsl(${iconColor} / 0.08)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 20, color: `hsl(${iconColor})` }}
                    >
                      {icon}
                    </span>
                  </div>
                  <h2 className="text-lg font-medium text-charcoal-dark font-meta tracking-tight self-center">
                    {title}
                  </h2>
                </div>
                <div className="prose-standard text-slate-600 leading-relaxed text-sm md:text-base space-y-3">
                  {content}
                </div>
              </section>
            ))}

            {/* Rights callout */}
            <div className="bg-charcoal-dark p-8 md:p-12 border-l-4 border-warm-gold text-white">
              <h3 className="font-meta font-medium text-xl tracking-tight mb-4">
                Exercise your rights
              </h3>
              <p className="text-slate-300 text-sm mb-6">
                To access, correct, or delete your data — or to withdraw consent — contact our Data
                Protection Desk:
              </p>
              <a
                href="mailto:privacy@thebasemovement.org.gh"
                className="inline-flex items-center gap-2 text-warm-gold hover:underline font-medium text-sm"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  mail
                </span>
                privacy@thebasemovement.org.gh
              </a>
              <p className="text-xs text-slate-500 mt-6">
                Complaints may also be directed to the{' '}
                <a
                  href="https://www.dataprotection.org.gh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:underline"
                >
                  Data Protection Commission of Ghana
                </a>
                .
              </p>
            </div>

            <p className="text-xs text-slate-400 pt-4 border-t border-slate-200">
              If you have questions about this privacy policy, please{' '}
              <a href="/contact" className="text-brand-green hover:underline">
                contact our communications desk
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
