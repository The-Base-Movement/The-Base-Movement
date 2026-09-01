import { CheckboxGroup, FieldLine, SectionHeader } from '../registrationformpreview/formPrimitives'

/**
 * Printable Youth Wing enrolment form (ages 14-17), for offline sign-up drives
 * where a phone is not practical.
 *
 * Reuses the adult form's print geometry but never its identity: teal instead of
 * brand green, no Ghana Card or Voter ID field anywhere, a mandatory guardian
 * consent block with a signature line, and the not-party-membership declaration
 * printed on the sheet so nobody can claim they signed up for something else.
 */

const TEAL = 'hsl(187 72% 26%)'
const TEAL_BADGE = 'hsl(187 55% 72%)'

interface YouthFormBodyProps {
  logoUrl: string
  regions?: string[]
  watermarkOpacity?: number
}

const FALLBACK_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        color: '#334155',
        margin: '0 0 5px',
        lineHeight: 1.3,
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {children}
    </p>
  )
}

export function YouthFormBody({ logoUrl, regions, watermarkOpacity = 0.03 }: YouthFormBodyProps) {
  const regionList = regions && regions.length > 0 ? regions : FALLBACK_REGIONS

  return (
    <div
      id="youth-form-body"
      style={{
        position: 'relative',
        maxWidth: '210mm',
        margin: '0 auto',
        background: '#ffffff',
        padding: '12mm 18px',
        boxSizing: 'border-box',
        color: '#0f172a',
        fontFamily: "'Public Sans', sans-serif",
        lineHeight: 1.35,
        overflow: 'hidden',
      }}
      className="shadow-2xl print:shadow-none print:p-0 border border-stone-200 print:border-none"
    >
      {watermarkOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
          }}
        >
          <img
            src="/branding/patterns/eagle-in-flight.webp"
            alt=""
            style={{
              width: '72%',
              height: 'auto',
              maxHeight: '60%',
              objectFit: 'contain',
              opacity: watermarkOpacity,
              filter: 'grayscale(100%)',
            }}
          />
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: `2.5px solid ${TEAL}`,
          paddingBottom: 12,
          marginBottom: 14,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={logoUrl || '/branding/logo.png'}
            alt="The Base"
            style={{ height: 68, width: 68, objectFit: 'contain' }}
          />
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#0f172a',
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              THE BASE MOVEMENT
            </h1>
            <h2
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: TEAL,
                margin: '2px 0 3px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              Youth Wing Enrolment Form
            </h2>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#64748b',
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              Ages 14 to 17 &middot; Civic Education &middot; Mentorship &middot; Community Service
            </p>
          </div>
        </div>
        <div
          style={{
            border: `1.5px solid ${TEAL}`,
            borderRadius: 3,
            padding: '6px 10px',
            textAlign: 'center',
            minWidth: 120,
          }}
        >
          <p
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: TEAL,
              margin: '0 0 3px',
            }}
          >
            Membership number
          </p>
          {/* No write-in line on purpose. Numbers are issued by the system when
              the record is entered; an officer cannot allocate or promise one. */}
          <p style={{ fontSize: 9, color: '#64748b', margin: 0, lineHeight: 1.35 }}>
            Issued by HQ as
            <br />
            <strong style={{ color: TEAL }}>TBM-YW-######</strong>
            <br />
            once entered
          </p>
        </div>
      </div>

      {/* Not-party-membership declaration, printed on the sheet itself. */}
      <div
        style={{
          border: `1.5px solid ${TEAL}`,
          background: '#f2fafb',
          borderRadius: 3,
          padding: '9px 12px',
          marginBottom: 14,
          position: 'relative',
          zIndex: 1,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <p style={{ fontSize: 10.5, color: '#0f172a', margin: 0, lineHeight: 1.45 }}>
          <strong>Read before signing.</strong> Under the Constitution of Ghana, political party
          membership is tied to the voting age of 18. The Youth Wing is a civic and mobilization
          programme, <strong>not political party membership</strong>. It carries no voting rights,
          no leadership eligibility and no part in any internal decision of the Movement. We do not
          collect a Ghana Card number or a Voter ID number on this form.{' '}
          <strong>No officer can issue or promise a membership number.</strong> Your TBM-YW- number
          is generated by the system only when this form is entered into our database, and is then
          given to you.
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <SectionHeader
          number={1}
          label="About the young person"
          accent={TEAL}
          badgeColor={TEAL_BADGE}
        />
        <FieldLine label="Full Name (first and last)" required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldLine label="Date of Birth (DD / MM / YYYY)" required />
          <div style={{ marginBottom: 9 }}>
            <Label>
              Age on today&apos;s date <span style={{ color: '#dc2626' }}>*</span>
            </Label>
            <CheckboxGroup items={['14', '15', '16', '17']} />
            <p style={{ fontSize: '10px', fontWeight: 500, color: '#64748b', margin: '5px 0 0' }}>
              18 or older? Use the adult membership form instead.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 4 }}>
          <div style={{ marginBottom: 9 }}>
            <Label>
              Gender <span style={{ color: '#dc2626' }}>*</span>
            </Label>
            <CheckboxGroup items={['Male', 'Female']} />
          </div>
          <div style={{ marginBottom: 9 }}>
            <Label>Religion (optional)</Label>
            <CheckboxGroup items={['Christian', 'Muslim', 'Traditionalist', 'Other']} columns={2} />
          </div>
        </div>

        <SectionHeader number={2} label="Where you live" accent={TEAL} badgeColor={TEAL_BADGE} />
        <div style={{ marginBottom: 9 }}>
          <Label>
            Region (tick one, if you live in Ghana) <span style={{ color: '#dc2626' }}>*</span>
          </Label>
          <CheckboxGroup items={regionList} columns={4} />
        </div>
        <FieldLine
          label="If you live outside Ghana, country of residence"
          hint="e.g. United Kingdom"
        />
        <FieldLine label="Town / Community" />

        <SectionHeader number={3} label="School" accent={TEAL} badgeColor={TEAL_BADGE} />
        <div style={{ marginBottom: 9 }}>
          <Label>
            Education level <span style={{ color: '#dc2626' }}>*</span>
          </Label>
          <CheckboxGroup
            items={[
              'Junior High School',
              'Senior High School',
              'Technical / Vocational',
              'Out of school',
              'Other',
            ]}
            columns={3}
          />
        </div>
        <FieldLine label="Name of school" hint="optional" />

        <SectionHeader
          number={4}
          label="Parent or guardian consent (required)"
          accent={TEAL}
          badgeColor={TEAL_BADGE}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldLine label="Guardian Full Name" required />
          <div style={{ marginBottom: 9 }}>
            <Label>
              Relationship to the young person <span style={{ color: '#dc2626' }}>*</span>
            </Label>
            <CheckboxGroup
              items={['Mother', 'Father', 'Legal guardian', 'Grandparent', 'Aunt / Uncle', 'Other']}
              columns={3}
            />
          </div>
        </div>
        <FieldLine
          label="Guardian Phone Number"
          required
          hint="we call this number to confirm consent before activation"
        />

        <div
          style={{
            border: '1.5px solid #cbd5e1',
            borderRadius: 3,
            padding: '10px 12px',
            marginTop: 4,
          }}
        >
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 13,
                height: 13,
                border: '1.5px solid #64748b',
                borderRadius: 2,
                background: '#fff',
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <p style={{ fontSize: 10.5, color: '#0f172a', margin: 0, lineHeight: 1.5 }}>
              I am the parent or legal guardian named above. I consent to this young person joining
              The Base Movement Youth Wing as a civic and mobilization member. I understand this is
              not political party membership and carries no voting or leadership rights in the
              Movement, and I agree to be contacted on the number above to confirm this consent.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginTop: 14 }}>
            <div>
              <div style={{ height: 28, borderBottom: '1.5px solid #64748b' }} />
              <p style={{ fontSize: 9.5, color: '#64748b', margin: '3px 0 0' }}>
                Guardian signature or thumbprint
              </p>
            </div>
            <div>
              <div style={{ height: 28, borderBottom: '1.5px solid #64748b' }} />
              <p style={{ fontSize: 9.5, color: '#64748b', margin: '3px 0 0' }}>Date</p>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 18,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1.5px dashed #cbd5e1',
          }}
        >
          <div>
            <div style={{ height: 26, borderBottom: '1.5px solid #64748b' }} />
            <p style={{ fontSize: 9.5, color: '#64748b', margin: '3px 0 0' }}>
              Enrolling officer name
            </p>
          </div>
          <div>
            <div style={{ height: 26, borderBottom: '1.5px solid #64748b' }} />
            <p style={{ fontSize: 9.5, color: '#64748b', margin: '3px 0 0' }}>Officer signature</p>
          </div>
          <div>
            <div style={{ height: 26, borderBottom: '1.5px solid #64748b' }} />
            <p style={{ fontSize: 9.5, color: '#64748b', margin: '3px 0 0' }}>
              Entered &amp; consent confirmed by (HQ)
            </p>
          </div>
        </div>

        <p
          style={{
            fontSize: 9.5,
            color: '#64748b',
            margin: '14px 0 0',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Return completed forms to the nearest Base office. Your membership number is issued after
          entry, and can be checked at thebasemovement.org.gh/youth-wing/portal. Enrol online
          instead at thebasemovement.org.gh/youth-wing/register
        </p>
      </div>
    </div>
  )
}
