interface MembershipFormBodyProps {
  platform: string
  formTitle: string
  logoUrl: string
  parties?: string[]
  regions?: string[]
  watermarkOpacity?: number
}

function SectionHeader({ number, label }: { number: number; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'hsl(156 100% 18%)',
        color: '#ffffff',
        padding: '6px 14px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        borderRadius: '2px',
        marginBottom: '14px',
        fontFamily: "'Public Sans', sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'hsl(45 80% 45%)',
          color: '#0f1310',
          fontSize: '10px',
          fontWeight: 800,
        }}
      >
        {number}
      </span>
      {label}
    </div>
  )
}

function FieldLine({ label, required = false, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p
        style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: '#334155',
          margin: '0 0 4px',
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}{' '}
        {hint && <span style={{ textTransform: 'none', fontWeight: 400, color: '#64748b' }}>({hint})</span>}
      </p>
      <div
        style={{
          height: 28,
          borderBottom: '1.5px solid #cbd5e1',
          width: '100%',
        }}
      />
    </div>
  )
}

function CheckboxGroup({ items, columns = 0 }: { items: string[]; columns?: number }) {
  const layoutStyle: React.CSSProperties =
    columns > 0
      ? { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '8px 16px' }
      : { display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }

  return (
    <div style={layoutStyle}>
      {items.map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 13,
              height: 13,
              border: '1.5px solid #64748b',
              borderRadius: 2,
              background: '#fff',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#1e293b',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {item}
          </span>
        </div>
      ))}
    </div>
  )
}

export function MembershipFormBody({
  platform,
  formTitle,
  logoUrl,
  parties,
  regions,
  watermarkOpacity = 0.03,
}: MembershipFormBodyProps) {
  const isGhana = platform === 'GHANA'

  const regionList =
    regions && regions.length > 0
      ? regions
      : [
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

  const partyList = parties && parties.length > 0 ? parties : [
    'NPP — New Patriotic Party',
    'NDC — National Democratic Congress',
    'CPP — Convention People\'s Party',
    'GUM — Ghana Union Movement',
    'The New Force',
    'Civil Society Organisation (CSO)',
  ]

  const partyChecklist = [
    ...partyList,
    'Independent / Unaffiliated',
    'Other: _______________________',
  ]

  return (
    <div
      id="membership-form-body"
      style={{
        position: 'relative',
        maxWidth: '210mm',
        margin: '0 auto',
        background: '#ffffff',
        minHeight: '297mm',
        padding: '16mm 18px',
        boxSizing: 'border-box',
        color: '#0f172a',
        fontFamily: "'Public Sans', sans-serif",
        lineHeight: 1.4,
        overflow: 'hidden',
      }}
      className="shadow-2xl print:shadow-none print:p-0 border border-stone-200 print:border-none"
    >
      {/* Eagle in Flight Watermark */}
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
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '3px solid hsl(156 100% 18%)',
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={logoUrl || '/branding/logo.png'}
            alt="The Base"
            style={{ height: 72, width: 72, objectFit: 'contain' }}
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
              }}
            >
              THE BASE MOVEMENT
            </h1>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'hsl(156 100% 18%)',
                margin: '2px 0 4px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              {formTitle}
            </h2>
            <p
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: '#64748b',
                margin: 0,
              }}
            >
              {isGhana
                ? 'Ghana First · Youth Empowerment · Community Mobilization'
                : 'Global Ghanaian Network · Diaspora Contribution · Youth & Economic Development'}
            </p>
          </div>
        </div>

        {/* Passport Photo Box */}
        <div
          style={{
            width: 100,
            height: 120,
            border: '2px dashed #cbd5e1',
            borderRadius: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 8,
            background: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 24, color: '#94a3b8', marginBottom: 4 }}
          >
            photo_camera
          </span>
          <p
            style={{
              fontSize: 8.5,
              fontWeight: 600,
              color: '#64748b',
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            AFFIX PASSPORT
            <br />
            PHOTO HERE
          </p>
        </div>
      </div>

      {/* Form Instructions */}
      <div
        style={{
          background: '#f1f5f9',
          borderLeft: '4px solid hsl(45 80% 45%)',
          padding: '8px 12px',
          fontSize: '10px',
          color: '#334155',
          marginBottom: 20,
          borderRadius: 2,
        }}
      >
        <strong>INSTRUCTIONS:</strong> Please complete all required sections in BLOCK LETTERS using a black or blue pen.
        Tick (✓) appropriate boxes. Once completed, hand to your local chapter officer or scan/upload via the online portal.
      </div>

      {/* Section 1: Membership Network */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader number={1} label={isGhana ? "Ghana Network (Constituency-based)" : "Diaspora Network (Diaspora-based)"} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 6px',
              }}
            >
              Network Category <span style={{ color: '#dc2626' }}>*</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: '1.5px solid #1e293b',
                  borderRadius: 2,
                  background: 'hsl(156 100% 18%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(156 100% 18%)' }}>
                {isGhana ? 'Ghana Resident (Constituency-based)' : 'Diaspora Network (Diaspora-based)'}
              </span>
            </div>
          </div>

          <div>
            <FieldLine
              label={isGhana ? 'Constituency & Region' : 'Country of Residence'}
              required
            />
          </div>
        </div>
      </div>

      {/* Section 2: Personal Information */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader number={2} label="Personal Information" />
        <FieldLine label="Full Name (As shown on your ID Card or Passport)" required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 10 }}>
          <FieldLine label="Birth Year" hint="e.g. 1992" />
          <div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 6px',
              }}
            >
              Gender <span style={{ color: '#dc2626' }}>*</span>
            </p>
            <CheckboxGroup items={['Male', 'Female']} />
          </div>
          <div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 6px',
              }}
            >
              Age Range <span style={{ color: '#dc2626' }}>*</span>
            </p>
            <CheckboxGroup items={['18–25', '26–35', '36–45', '46–60', '60+']} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 10 }}>
          <FieldLine
            label="Ghana Card Number"
            required={isGhana}
            hint={isGhana ? 'e.g. GHA-123456789-0' : 'Optional for Diaspora'}
          />
          <FieldLine
            label="Voter's ID Card Number"
            required={isGhana}
            hint={isGhana ? '10-digit Voter ID' : 'Optional for Diaspora'}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#334155',
              margin: '0 0 6px',
            }}
          >
            Religion
          </p>
          <CheckboxGroup items={['Christian', 'Muslim', 'Traditionalist', 'Other', 'Prefer not to say']} />
        </div>
      </div>

      {/* Section 3: Party Affiliation / CSO */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader number={3} label="Political Affiliation / CSO" />
        <p
          style={{
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: '#334155',
            margin: '0 0 8px',
          }}
        >
          Party Affiliation / CSO <span style={{ color: '#dc2626' }}>*</span>{' '}
          <span style={{ textTransform: 'none', fontWeight: 500, color: '#0284c7', fontStyle: 'italic', marginLeft: 6 }}>
            (Note: Registrar selects only ONE option)
          </span>
        </p>
        <CheckboxGroup items={partyChecklist} columns={3} />
      </div>

      {/* Section 4: Contact & Location */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader number={4} label="Contact & Location" />
        <FieldLine
          label="Primary Phone Number"
          required
          hint={isGhana ? 'with country code e.g. +233 24 123 4567' : 'with country code e.g. +44 7911 123456 / +1 212 555 0199'}
        />

        <div style={{ marginTop: 6 }}>
          <FieldLine label="Secondary Phone Number" hint="optional" />
        </div>

        {isGhana ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 6 }}>
              <FieldLine label="Email Address" hint="optional, but advised" />
              <FieldLine label="Digital Address (Ghana Post GPS)" hint="e.g. GA-183-9020" />
            </div>

            <div style={{ marginTop: 10, marginBottom: 12 }}>
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#334155',
                  margin: '0 0 6px',
                }}
              >
                Region <span style={{ color: '#dc2626' }}>*</span>{' '}
                <span style={{ textTransform: 'none', fontWeight: 500, color: '#0284c7', fontStyle: 'italic', marginLeft: 6 }}>
                  (Tick the region where you vote)
                </span>
              </p>
              <CheckboxGroup items={regionList} columns={4} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 6 }}>
              <FieldLine label="Constituency" required hint="e.g. Ayawaso West Wuogon" />
              <FieldLine label="District" hint="e.g. Ayawaso West Municipal" />
              <FieldLine label="Polling Station Code / Name" hint="e.g. C090201 — Bawaleshie Primary School" />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: 6 }}>
              <FieldLine label="Email Address" hint="optional, but advised" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 6 }}>
              <FieldLine label="Country of Residence" required hint="e.g. United Kingdom, USA" />
              <FieldLine label="City / Locality" required hint="e.g. London, Atlanta" />
            </div>
          </>
        )}
      </div>

      {/* Section 5: Profession & Career */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader number={5} label="Profession & Career" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FieldLine label="Profession / Job Title" hint="e.g. Software Engineer, Farmer" />
          <div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 6px',
              }}
            >
              Job Level
            </p>
            <CheckboxGroup items={['Entry Level', 'Professional', 'Senior Specialist', 'Management', 'Executive']} />
          </div>
        </div>
      </div>

      {/* Section 6: Emergency Contact */}
      <div style={{ marginBottom: 18 }}>
        <SectionHeader number={6} label="Emergency Contact" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FieldLine label="Emergency Contact Name" />
          <FieldLine label="Emergency Contact Phone" />
        </div>
        <div style={{ marginTop: 6 }}>
          <p
            style={{
              fontSize: '9.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#475569',
              margin: '0 0 4px',
            }}
          >
            Relationship Options:
          </p>
          <CheckboxGroup
            items={[
              'Spouse / Husband / Wife',
              'Parent (Father / Mother)',
              'Sibling (Brother / Sister)',
              'Child',
              'Aunt / Uncle',
              'Cousin',
              'Grandparent',
              'Friend',
              'Other',
            ]}
            columns={3}
          />
        </div>
      </div>

      {/* Section 7: Declaration & Signatures */}
      <div style={{ marginBottom: 16 }}>
        <SectionHeader number={7} label="Applicant Declaration & Verification" />
        <p
          style={{
            fontSize: '9.5px',
            color: '#475569',
            lineHeight: 1.45,
            margin: '0 0 16px',
          }}
        >
          I declare that the information provided above is true and complete to the best of my knowledge.
          I pledge my commitment to the principles, aims, and membership policies of <strong>The Base Movement</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, alignItems: 'flex-end' }}>
          <div>
            <div style={{ height: 32, borderBottom: '1.5px solid #0f172a' }} />
            <p style={{ fontSize: '9px', fontWeight: 700, textAlign: 'center', margin: '4px 0 0', textTransform: 'uppercase' }}>
              Signature of Applicant *
            </p>
          </div>
          <div>
            <div style={{ height: 32, borderBottom: '1.5px solid #0f172a' }} />
            <p style={{ fontSize: '9px', fontWeight: 700, textAlign: 'center', margin: '4px 0 0', textTransform: 'uppercase' }}>
              Date (DD / MM / YYYY) *
            </p>
          </div>
          <div>
            <div style={{ height: 32, borderBottom: '1.5px solid #0f172a' }} />
            <p style={{ fontSize: '9px', fontWeight: 700, textAlign: 'center', margin: '4px 0 0', textTransform: 'uppercase' }}>
              City / Location *
            </p>
          </div>
        </div>
      </div>

      {/* Official Registrar Use Only */}
      <div
        style={{
          border: '1.5px solid #cbd5e1',
          borderRadius: 4,
          padding: '10px 14px',
          background: '#f8fafc',
          marginBottom: 16,
        }}
      >
        <p
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(156 100% 18%)',
            margin: '0 0 8px',
          }}
        >
          FOR OFFICIAL REGISTRAR USE ONLY
        </p>
        <FieldLine
          label="Permanent Reg No Allocated"
          hint={
            isGhana
              ? 'e.g. TBM-GH-268108 (Required if registering on behalf of applicant, e.g. Referee)'
              : 'e.g. TBM-DI-268108 (Required if registering on behalf of applicant, e.g. Referee)'
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
          <FieldLine label="Verification Status" hint="Approved / Pending" />
          <FieldLine label="Registrar Officer Name & Signature" />
        </div>
      </div>

      {/* Footer Branding */}
      <div
        style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '9px',
          color: '#94a3b8',
          fontWeight: 600,
        }}
      >
        <span>www.thebasemovement.org.gh · Official Membership Document</span>
        <span>The Base Ghana & Diaspora Network</span>
      </div>
    </div>
  )
}
