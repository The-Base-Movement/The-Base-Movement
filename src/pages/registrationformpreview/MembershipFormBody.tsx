interface MembershipFormBodyProps {
  platform: string
  formTitle: string
  logoUrl: string
  regions?: string[]
  watermarkOpacity?: number
}

function SectionHeader({ number, label }: { number: number; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: 'hsl(156 100% 18%)',
        color: '#ffffff',
        padding: '5px 12px',
        fontSize: '11.5px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        borderRadius: '2px',
        marginBottom: '10px',
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
          width: 17,
          height: 17,
          borderRadius: '50%',
          background: 'hsl(45 80% 45%)',
          color: '#0f1310',
          fontSize: '10.5px',
          fontWeight: 800,
        }}
      >
        {number}
      </span>
      {label}
    </div>
  )
}

function FieldLine({
  label,
  required = false,
  hint,
}: {
  label: string
  required?: boolean
  hint?: string
}) {
  return (
    <div style={{ marginBottom: 9 }}>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          color: '#334155',
          margin: '0 0 3px',
          fontFamily: "'Public Sans', sans-serif",
          lineHeight: 1.3,
        }}
      >
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}{' '}
        {hint && (
          <span style={{ textTransform: 'none', fontWeight: 400, color: '#64748b' }}>({hint})</span>
        )}
      </p>
      <div
        style={{
          height: 25,
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
      ? { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '6px 16px' }
      : { display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }

  return (
    <div style={layoutStyle}>
      {items.map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 12,
              border: '1.5px solid #64748b',
              borderRadius: 2,
              background: '#fff',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              color: '#1e293b',
              fontFamily: "'Public Sans', sans-serif",
              lineHeight: 1.3,
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

  return (
    <div
      id="membership-form-body"
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
          borderBottom: '2.5px solid hsl(156 100% 18%)',
          paddingBottom: 12,
          marginBottom: 14,
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
                color: 'hsl(156 100% 18%)',
                margin: '2px 0 3px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
              }}
            >
              {formTitle}
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
              {isGhana
                ? 'Ghana First · Youth Empowerment · Community Mobilization'
                : 'Global Ghanaian Network · Diaspora Contribution · Youth & Economic Development'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#475569',
                }}
              >
                Date Completed:
              </span>
              <div style={{ width: 110, borderBottom: '1.5px solid #334155' }} />
              <span style={{ fontSize: '9.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                (DD / MM / YYYY)
              </span>
            </div>
          </div>
        </div>

        {/* Passport Photo Box */}
        <div
          style={{
            width: 95,
            height: 112,
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
            style={{ fontSize: 22, color: '#94a3b8', marginBottom: 3 }}
          >
            photo_camera
          </span>
          <p
            style={{
              fontSize: 9.5,
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

      {/* Platform Category Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'hsl(156 100% 18%)',
          color: '#ffffff',
          padding: '7px 14px',
          borderRadius: '4px',
          marginBottom: 10,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'hsl(45 80% 45%)' }}>
            [ ✓ ]
          </span>
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {isGhana
              ? 'PLATFORM: GHANA RESIDENT NETWORK (CONSTITUENCY-BASED)'
              : 'PLATFORM: DIASPORA NETWORK (DIASPORA-BASED)'}
          </span>
        </div>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            color: 'hsl(45 80% 65%)',
            textTransform: 'uppercase',
          }}
        >
          OFFICIAL FORM
        </span>
      </div>

      {/* Form Instructions */}
      <div
        style={{
          background: '#f1f5f9',
          borderLeft: '4px solid hsl(45 80% 45%)',
          padding: '7px 12px',
          fontSize: '11px',
          color: '#334155',
          marginBottom: 14,
          borderRadius: 2,
          lineHeight: 1.35,
        }}
      >
        <strong>INSTRUCTIONS:</strong> Please complete all required sections in BLOCK LETTERS using
        a black or blue pen. Tick (✓) appropriate boxes. Once completed, hand to your local chapter
        officer or scan/upload via the online portal.
      </div>

      {/* Section 1: Personal Information */}
      <div style={{ marginBottom: 14 }}>
        <SectionHeader number={1} label="Personal Information" />
        <FieldLine label="Full Name (As shown on your ID Card or Passport)" required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 6 }}>
          <FieldLine label="Birth Year" hint="e.g. 1992" />
          <div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 5px',
                lineHeight: 1.3,
              }}
            >
              Gender <span style={{ color: '#dc2626' }}>*</span>
            </p>
            <CheckboxGroup items={['Male', 'Female']} />
          </div>
          <div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 5px',
                lineHeight: 1.3,
              }}
            >
              Age Range <span style={{ color: '#dc2626' }}>*</span>
            </p>
            <CheckboxGroup items={['14–17', '18–25', '26–35', '36–45', '46–60', '60+']} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
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

        <div style={{ marginTop: 6 }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#334155',
              margin: '0 0 5px',
              lineHeight: 1.3,
            }}
          >
            Religion
          </p>
          <CheckboxGroup
            items={['Christian', 'Muslim', 'Traditionalist', 'Other', 'Prefer not to say']}
          />
        </div>
      </div>

      {/* Section 2: Contact & Location */}
      <div style={{ marginBottom: 14 }}>
        <SectionHeader number={2} label="Contact & Location" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldLine
            label="Primary Phone"
            required
            hint={isGhana ? 'e.g. +233 24 123 4567' : 'e.g. +44 7911 123456 / +1 212 555 0199'}
          />
          <FieldLine label="Secondary Phone" hint="optional" />
        </div>

        {isGhana ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
              <FieldLine label="Email Address" hint="optional, but advised" />
              <FieldLine label="Digital Address (Ghana Post GPS)" hint="e.g. GA-183-9020" />
            </div>

            <div style={{ marginTop: 8, marginBottom: 10 }}>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#334155',
                  margin: '0 0 5px',
                  lineHeight: 1.3,
                }}
              >
                Region <span style={{ color: '#dc2626' }}>*</span>{' '}
                <span
                  style={{
                    textTransform: 'none',
                    fontWeight: 500,
                    color: '#0284c7',
                    fontStyle: 'italic',
                    marginLeft: 6,
                  }}
                >
                  (Tick the region where you vote)
                </span>
              </p>
              <CheckboxGroup items={regionList} columns={4} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 10,
                marginTop: 6,
              }}
            >
              <FieldLine label="Constituency" required hint="e.g. Ayawaso West Wuogon" />
              <FieldLine label="District" hint="e.g. Ayawaso West Municipal" />
              <FieldLine
                label="Polling Station Code / Name"
                hint="e.g. C090201, Bawaleshie Primary School"
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: 6 }}>
              <FieldLine label="Email Address" hint="optional, but advised" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
              <FieldLine label="Country of Residence" required hint="e.g. United Kingdom, USA" />
              <FieldLine label="City / Locality" required hint="e.g. London, Atlanta" />
            </div>
          </>
        )}
      </div>

      {/* Section 3: Profession & Career — starts page 2 for Ghana; Diaspora's page 2 starts at Emergency Contact instead */}
      <div
        style={{
          marginBottom: 14,
          ...(isGhana ? { pageBreakBefore: 'always', breakBefore: 'page', paddingTop: 12 } : {}),
        }}
      >
        <SectionHeader number={3} label="Profession & Career" />

        {/* Employed */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 8 }}>
          <div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 5px',
                lineHeight: 1.3,
              }}
            >
              Employed <span style={{ color: '#dc2626' }}>*</span>
            </p>
            <CheckboxGroup items={['Yes', 'No']} />
          </div>
          <div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 5px',
                lineHeight: 1.3,
              }}
            >
              Job Level{' '}
              <span
                style={{
                  fontStyle: 'italic',
                  fontWeight: 400,
                  textTransform: 'none',
                  color: '#64748b',
                }}
              >
                (if employed)
              </span>
            </p>
            <CheckboxGroup
              items={[
                'Entry Level',
                'Professional',
                'Senior Specialist',
                'Management',
                'Executive',
              ]}
            />
          </div>
        </div>

        {/* Profession — Ghana gets a common-jobs checklist, Diaspora gets a free-text line */}
        {isGhana ? (
          <div style={{ marginBottom: 8 }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: '#334155',
                margin: '0 0 5px',
                lineHeight: 1.3,
              }}
            >
              Profession / Job Title{' '}
              <span
                style={{
                  fontStyle: 'italic',
                  fontWeight: 400,
                  textTransform: 'none',
                  color: '#64748b',
                }}
              >
                (tick one or write below)
              </span>
            </p>
            <CheckboxGroup
              items={[
                'Farmer',
                'Trader',
                'Driver',
                'Mason',
                'Auto-Mechanic',
                'Nurse',
                'Teacher',
                'Clergy',
                'Doctor',
                'Hairdresser',
                'Barber',
                'Tailor',
                'Seamstress',
                'Spiritualist',
                'Student',
              ]}
              columns={5}
            />
            <div style={{ marginTop: 6 }}>
              <FieldLine
                label="Other Profession / Job Title"
                hint="write here if not listed above"
              />
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <FieldLine
              label="Profession / Job Title"
              hint="e.g. Software Engineer, Accountant, Nurse"
            />
          </div>
        )}

        {/* Education Level */}
        <div>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#334155',
              margin: '0 0 5px',
              lineHeight: 1.3,
            }}
          >
            Education Level
          </p>
          <CheckboxGroup
            items={[
              'None',
              'Primary',
              'JHS / Middle School',
              'SHS / Secondary',
              'Vocational / Technical',
              'Diploma / HND',
              "Bachelor's Degree",
              "Master's Degree",
              'PhD / Doctorate',
              'Professional Certification',
            ]}
            columns={isGhana ? 4 : 5}
          />
        </div>
      </div>

      {/* Section 4: Emergency Contact — starts page 2 for Diaspora */}
      <div
        style={{
          marginBottom: 14,
          ...(isGhana ? {} : { pageBreakBefore: 'always', breakBefore: 'page', paddingTop: 12 }),
        }}
      >
        <SectionHeader number={4} label="Emergency Contact" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldLine label="Emergency Contact Name" />
          <FieldLine label="Emergency Contact Phone" />
        </div>
        <div style={{ marginTop: 6 }}>
          <p
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#475569',
              margin: '0 0 4px',
              lineHeight: 1.3,
            }}
          >
            Relationship Options:
          </p>
          <CheckboxGroup
            items={[
              'Spouse',
              'Parent (Father / Mother)',
              'Sibling (Brother / Sister)',
              'Child',
              'Aunt / Uncle',
              'Cousin',
              'Grandparent',
              'Friend',
              'Other',
            ]}
            columns={4}
          />
        </div>
      </div>

      {/* Official Registrar Use Only */}
      <div
        style={{
          border: '1.5px solid #cbd5e1',
          borderRadius: 4,
          padding: '10px 14px',
          background: '#f8fafc',
          marginBottom: 0,
        }}
      >
        <p
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(156 100% 18%)',
            margin: '0 0 6px',
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
        <div
          style={{
            borderTop: '1px dashed #cbd5e1',
            marginTop: 6,
            paddingTop: 5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '9.5px',
            color: '#64748b',
            fontWeight: 600,
          }}
        >
          <span>www.thebasemovement.org.gh · Official Membership Document</span>
          <span>The Base Ghana & Diaspora Network</span>
        </div>
      </div>
    </div>
  )
}
