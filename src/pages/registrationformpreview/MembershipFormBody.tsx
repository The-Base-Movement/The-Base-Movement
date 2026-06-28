import { cn } from '@/lib/utils'

interface MembershipFormBodyProps {
  platform: string
  formTitle: string
  logoUrl: string
}

function SectionHeader({ number, label }: { number: number; label: string }) {
  return (
    <div className="bg-brand-green text-white px-4 py-1.5 text-xs font-bold tracking-tight mb-4">
      {number}. {label}
    </div>
  )
}

export function MembershipFormBody({ platform, formTitle, logoUrl }: MembershipFormBodyProps) {
  return (
    <div className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none min-h-[297mm] p-[15mm] border border-stone-200 print:border-none font-body-md text-on-surface">
      {/* Header */}
      <div className="flex items-start justify-between border-b-4 border-brand-green pb-6 mb-8">
        <div className="flex items-center gap-6">
          <img src={logoUrl} alt="The Base" className="h-24 w-24 object-contain" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight leading-none mb-1">
              The base — Membership
            </h1>
            <h2 className="text-xl font-bold tracking-tight text-brand-green leading-none mb-2">
              {formTitle}
            </h2>
            <p className="text-micro font-bold tracking-tight text-muted-foreground/60">
              {platform === 'DIASPORA'
                ? 'Ghanaian diaspora — Supporting the movement from abroad'
                : 'Ghana first, jobs for the youth — A movement of the Ghanaian people'}
            </p>
          </div>
        </div>
        <div className="w-28 h-32 border-2 border-dashed border-stone-200 flex items-center justify-center text-center p-4">
          <p className="text-micro font-bold text-stone-300 leading-tight">
            Affix recent passport photo here
          </p>
        </div>
      </div>

      <p className="text-micro text-muted-foreground/80 italic mb-8">
        Please fill this form clearly using BLOCK LETTERS. Tick (✓) where applicable. Required
        fields are marked with an asterisk (*).
      </p>

      {/* Section 1: Membership Platform */}
      <div className="mb-8">
        <SectionHeader number={1} label="Membership platform" />
        <div className="grid grid-cols-2 gap-8 pl-4">
          <div className="space-y-4">
            <p className="text-micro font-bold tracking-tight text-stone-500">
              I am registering as:*
            </p>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-4 h-4 border-2 border-stone-300 flex items-center justify-center',
                    platform === 'GHANA' && 'bg-brand-green border-brand-green'
                  )}
                >
                  {platform === 'GHANA' && <div className="w-2 h-2 bg-white" />}
                </div>
                <span className="text-tiny font-bold">Ghana Resident</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-4 h-4 border-2 border-stone-300 flex items-center justify-center',
                    platform === 'DIASPORA' && 'bg-brand-green border-brand-green'
                  )}
                >
                  {platform === 'DIASPORA' && <div className="w-2 h-2 bg-white" />}
                </div>
                <span className="text-tiny font-bold">Ghanaian in the Diaspora</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-micro font-bold tracking-tight text-stone-500">
              Country of residence (Diaspora only)
            </p>
            <div className="h-8 border-b-2 border-stone-100" />
          </div>
        </div>
      </div>

      {/* Section 2: Personal Information */}
      <div className="mb-8">
        <SectionHeader number={2} label="Personal information" />
        <div className="grid grid-cols-1 gap-6 pl-4">
          <div className="space-y-2">
            <p className="text-micro font-bold tracking-tight text-stone-500">
              Full name (As on Ghana card / passport)*
            </p>
            <div className="h-8 border-b-2 border-stone-100" />
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">
                Date of birth (DD/MM/YYYY)*
              </p>
              <div className="h-8 border-b-2 border-stone-100 w-full" />
            </div>
            <div className="space-y-4">
              <p className="text-micro font-bold tracking-tight text-stone-500">Gender*</p>
              <div className="flex items-center gap-6">
                {['Male', 'Female', 'Other'].map((g) => (
                  <div key={g} className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-stone-300" />
                    <span className="text-tiny font-bold">{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-4">
              <p className="text-micro font-bold tracking-tight text-stone-500">Age range*</p>
              <div className="grid grid-cols-3 gap-y-2">
                {['18-25', '26-35', '36-45', '46-60', '60+'].map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-stone-300" />
                    <span className="text-tiny font-bold">{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">
                Number of children
              </p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-micro font-bold tracking-tight text-stone-500">
              Ghana card / national ID number
            </p>
            <div className="h-8 border-b-2 border-stone-100" />
          </div>
        </div>
      </div>

      {/* Section 3: Contact Details */}
      <div className="mb-8">
        <SectionHeader number={3} label="Contact details" />
        <div className="grid grid-cols-1 gap-6 pl-4">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">
                Phone number (With country code)*
              </p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">Email address</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-micro font-bold tracking-tight text-stone-500">
              Residential address (optional)
            </p>
            <div className="h-8 border-b-2 border-stone-100" />
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">Region*</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">Constituency*</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-micro font-bold tracking-tight text-stone-500">
              Ghana Post GPS address (e.g. GA-123-4567)
            </p>
            <div className="h-8 border-b-2 border-stone-100" />
          </div>
        </div>
      </div>

      {/* Section 4: Profession & Education */}
      <div className="mb-8">
        <SectionHeader number={4} label="Profession & education" />
        <div className="grid grid-cols-1 gap-6 pl-4">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">
                Profession / skill
              </p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
            <div className="space-y-4">
              <p className="text-micro font-bold tracking-tight text-stone-500">
                Employment status
              </p>
              <div className="grid grid-cols-2 gap-y-2">
                {['Employed', 'Self-employed', 'Student', 'Unemployed', 'Retired'].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-stone-300" />
                    <span className="text-tiny font-bold">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-micro font-bold tracking-tight text-stone-500">
              Highest level of education
            </p>
            <div className="h-8 border-b-2 border-stone-100" />
          </div>
        </div>
      </div>

      {/* Section 5: Next of Kin */}
      <div className="mb-8">
        <SectionHeader number={5} label="Next of kin" />
        <div className="grid grid-cols-1 gap-6 pl-4">
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">Full name</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">Relationship</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">Phone contact</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
            <div className="space-y-2">
              <p className="text-micro font-bold tracking-tight text-stone-500">Address</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Declaration */}
      <div className="mb-12">
        <SectionHeader number={6} label="Declaration & signature" />
        <div className="pl-4 space-y-8">
          <p className="text-tiny leading-relaxed text-on-surface/80">
            I, the undersigned, declare that the information provided above is true and complete to
            the best of my knowledge. I agree to the values, aims, and code of conduct of{' '}
            <strong>The Base Movement</strong>. I consent to my data being processed for membership
            administration, in line with the movement's privacy policy.
          </p>
          <div className="grid grid-cols-3 gap-12 items-end">
            <div className="space-y-2">
              <div className="h-12 border-b-2 border-stone-200" />
              <p className="text-micro font-bold tracking-tight text-center">
                Signature of applicant*
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-12 border-b-2 border-stone-200" />
              <p className="text-micro font-bold tracking-tight text-center">Date*</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 border-b-2 border-stone-200" />
              <p className="text-micro font-bold tracking-tight text-center">Place*</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-stone-100 pt-8 flex justify-between items-center opacity-40 grayscale">
        <p className="text-micro font-bold tracking-tight">thebasemovement.info</p>
        <p className="text-micro font-bold tracking-tight">
          Submission: hand to chapter head, or upload at /register/upload
        </p>
      </div>
    </div>
  )
}
