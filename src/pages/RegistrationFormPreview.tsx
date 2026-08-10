import { useBranding } from '@/hooks/useBranding'
import { usePoliticalParties } from '@/hooks/usePoliticalParties'
import { useGhanaRegions } from '@/hooks/useGhanaRegions'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SEO from '@/components/SEO'
import { FormControls } from './registrationformpreview/FormControls'
import { MembershipFormBody } from './registrationformpreview/MembershipFormBody'

export default function RegistrationFormPreview() {
  const { settings } = useBranding()
  const parties = usePoliticalParties()
  const regions = useGhanaRegions()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const platform = searchParams.get('platform') || 'GHANA'

  const handleBack = () => {
    if (window.history.length > 2 && document.referrer.includes(window.location.host)) {
      navigate(-1)
    } else {
      navigate(`/register?platform=${platform}`)
    }
  }

  const formUrl =
    platform === 'DIASPORA'
      ? settings.registration_form_diaspora_url
      : settings.registration_form_ghana_url

  const seoTitle = platform === 'DIASPORA' ? 'Membership Form Base Diaspora' : 'Membership Form Base Ghana'
  const formTitle = platform === 'DIASPORA' ? 'Diaspora Membership Form' : 'Ghana Membership Form'

  return (
    <div className="min-h-screen bg-stone-100 py-12 px-4 print:p-0 print:bg-white">
      <SEO title={seoTitle} noindex />
      <FormControls
        onBack={handleBack}
        onPrint={() => window.print()}
        formUrl={formUrl}
        platform={platform}
      />
      <MembershipFormBody
        platform={platform}
        formTitle={formTitle}
        logoUrl={settings.logo_url}
        parties={parties}
        regions={regions}
        watermarkOpacity={0.03}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #membership-form-body {
            box-shadow: none !important;
            border: none !important;
            padding: 10mm 15mm !important;
            margin: 0 auto !important;
          }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-0 { padding: 0 !important; }
        }
      `,
        }}
      />
    </div>
  )
}
