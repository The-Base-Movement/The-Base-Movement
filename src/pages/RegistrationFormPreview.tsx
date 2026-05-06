import { useRef } from 'react'
import { useBranding } from '@/hooks/useBranding'
import { Button } from '@/components/ui/neon-button'
import { Printer, Download, ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function RegistrationFormPreview() {
  const { settings } = useBranding()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const platform = searchParams.get('platform') || 'GHANA'
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const formUrl = platform === 'DIASPORA' 
    ? settings.registration_form_diaspora_url 
    : settings.registration_form_ghana_url

  const formTitle = platform === 'DIASPORA'
    ? 'Diaspora Membership Form'
    : 'Ghana Membership Form'

  return (
    <div className="min-h-screen bg-stone-100 py-12 px-4 print:p-0 print:bg-white">
      {/* Controls - Hidden on Print */}
      <div className="max-w-[210mm] mx-auto mb-8 flex items-center justify-between print:hidden">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </Button>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Form
          </Button>
          <a 
            href={formUrl as string} 
            download={`The_Base_${platform}_Registration_Form.pdf`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2"
          >
            <Download className="w-4 h-4" />
            Download {platform === 'DIASPORA' ? 'Diaspora' : 'Ghana'} PDF
          </a>
        </div>
      </div>

      {/* The Form - Optimized for A4 Printing */}
      <div 
        ref={printRef}
        className="max-w-[210mm] mx-auto bg-white shadow-2xl print:shadow-none min-h-[297mm] p-[15mm] border border-stone-200 print:border-none font-body-md text-on-surface"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-brand-green pb-6 mb-8">
          <div className="flex items-center gap-6">
            <img src={settings.logo_url} alt="The Base" className="h-24 w-24 object-contain" />
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">The Base — Membership</h1>
              <h2 className="text-xl font-bold uppercase tracking-tight text-brand-green leading-none mb-2">{formTitle}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                {platform === 'DIASPORA' ? 'Ghanaian Diaspora — Supporting the movement from abroad' : 'Ghana First, Jobs for the Youth — A movement of the Ghanaian people'}
              </p>
            </div>
          </div>
          <div className="w-28 h-32 border-2 border-dashed border-stone-200 flex items-center justify-center text-center p-4">
            <p className="text-[9px] font-bold text-stone-300 leading-tight">Affix recent passport photo here</p>
          </div>
        </div>

        <p className="text-[9px] text-muted-foreground/80 italic mb-8">Please fill this form clearly using BLOCK LETTERS. Tick (✓) where applicable. Required fields are marked with an asterisk (*).</p>

        {/* Section 1: Membership Platform */}
        <div className="mb-8">
          <div className="bg-brand-green text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4">
            1. Membership Platform
          </div>
          <div className="grid grid-cols-2 gap-8 pl-4">
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">I am registering as:*</p>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className={cn("w-4 h-4 border-2 border-stone-300 flex items-center justify-center", platform === 'GHANA' && "bg-brand-green border-brand-green")}>
                    {platform === 'GHANA' && <div className="w-2 h-2 bg-white" />}
                  </div>
                  <span className="text-[11px] font-bold">Ghana Resident</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={cn("w-4 h-4 border-2 border-stone-300 flex items-center justify-center", platform === 'DIASPORA' && "bg-brand-green border-brand-green")}>
                    {platform === 'DIASPORA' && <div className="w-2 h-2 bg-white" />}
                  </div>
                  <span className="text-[11px] font-bold">Ghanaian in the Diaspora</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Country of Residence (Diaspora Only)</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
        </div>

        {/* Section 2: Personal Information */}
        <div className="mb-8">
          <div className="bg-brand-green text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4">
            2. Personal Information
          </div>
          <div className="grid grid-cols-1 gap-6 pl-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Full Name (As on Ghana Card / Passport)*</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Date of Birth (DD/MM/YYYY)*</p>
                <div className="h-8 border-b-2 border-stone-100 w-full" />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Gender*</p>
                <div className="flex items-center gap-6">
                  {['Male', 'Female', 'Other'].map(g => (
                    <div key={g} className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-stone-300" />
                      <span className="text-[11px] font-bold">{g}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Age Range*</p>
                <div className="grid grid-cols-3 gap-y-2">
                  {['16-25', '26-35', '36-45', '46-60', '60+'].map(r => (
                    <div key={r} className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-stone-300" />
                      <span className="text-[11px] font-bold">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Number of Children</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ghana Card / National ID Number</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
        </div>

        {/* Section 3: Contact Details */}
        <div className="mb-8">
          <div className="bg-brand-green text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4">
            3. Contact Details
          </div>
          <div className="grid grid-cols-1 gap-6 pl-4">
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Phone Number (With Country Code)*</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Email Address</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Residential Address*</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Region*</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Constituency*</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ghana Post GPS Address (e.g. GA-123-4567)</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
        </div>

        {/* Section 4: Profession & Education */}
        <div className="mb-8">
          <div className="bg-brand-green text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4">
            4. Profession & Education
          </div>
          <div className="grid grid-cols-1 gap-6 pl-4">
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Profession / Skill</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Employment Status</p>
                <div className="grid grid-cols-2 gap-y-2">
                  {['Employed', 'Self-employed', 'Student', 'Unemployed', 'Retired'].map(s => (
                    <div key={s} className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-stone-300" />
                      <span className="text-[11px] font-bold">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Highest Level of Education</p>
              <div className="h-8 border-b-2 border-stone-100" />
            </div>
          </div>
        </div>

        {/* Section 5: Next of Kin */}
        <div className="mb-8">
          <div className="bg-brand-green text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4">
            5. Next of Kin
          </div>
          <div className="grid grid-cols-1 gap-6 pl-4">
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Full Name</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Relationship</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Phone Contact</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Address</p>
                <div className="h-8 border-b-2 border-stone-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Declaration */}
        <div className="mb-12">
          <div className="bg-brand-green text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4">
            6. Declaration & Signature
          </div>
          <div className="pl-4 space-y-8">
            <p className="text-[11px] leading-relaxed text-on-surface/80">
              I, the undersigned, declare that the information provided above is true and complete to the best of my knowledge. I agree to the values, aims, and code of conduct of <strong>The Base Movement</strong>. I consent to my data being processed for membership administration, in line with the movement's privacy policy.
            </p>
            <div className="grid grid-cols-3 gap-12 items-end">
              <div className="space-y-2">
                <div className="h-12 border-b-2 border-stone-200" />
                <p className="text-[9px] font-black uppercase tracking-widest text-center">Signature of Applicant*</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 border-b-2 border-stone-200" />
                <p className="text-[9px] font-black uppercase tracking-widest text-center">Date*</p>
              </div>
              <div className="space-y-2">
                <div className="h-12 border-b-2 border-stone-200" />
                <p className="text-[9px] font-black uppercase tracking-widest text-center">Place*</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t-2 border-stone-100 pt-8 flex justify-between items-center opacity-40 grayscale">
           <p className="text-[9px] font-bold uppercase tracking-widest">thebasemovement.com</p>
           <p className="text-[9px] font-bold uppercase tracking-widest">Submission: hand to chapter head, or upload at /register/upload</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `}} />
    </div>
  )
}
