import { useNavigate } from 'react-router-dom'
import { MaintenanceGate } from '@/components/MaintenanceGate'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'
import { useGhanaRegions } from '@/hooks/useGhanaRegions'
import { FormControls } from '../registrationformpreview/FormControls'
import { YouthFormBody } from './YouthFormBody'

/**
 * Printable / downloadable Youth Wing enrolment form, for offline sign-up drives.
 * Separate sheet from the adult membership form: no Ghana Card or Voter ID field,
 * a mandatory guardian consent block, and the not-party-membership declaration
 * printed on the page.
 *
 * Sits outside YouthLayout so the sheet prints with no site chrome, and carries
 * its own MaintenanceGate to keep the same gating as every other public route.
 */
export default function YouthWingFormPreview() {
  const { settings } = useBranding()
  const regions = useGhanaRegions()
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 2 && document.referrer.includes(window.location.host)) {
      navigate(-1)
    } else {
      navigate('/youth-wing')
    }
  }

  return (
    <MaintenanceGate>
      <div className="min-h-screen bg-stone-100 py-12 px-4 print:p-0 print:bg-white">
        <SEO
          title="Youth Wing Enrolment Form | The Base Movement"
          description="Printable Youth Wing enrolment form for ages 14 to 17, including the parent or guardian consent section."
          canonical="/youth-wing/form"
        />
        <FormControls
          onBack={handleBack}
          onPrint={() => window.print()}
          formUrl={undefined}
          platform="YOUTH"
          elementId="youth-form-body"
          fileName="Youth Wing Enrolment Form _ The Base Movement.pdf"
          downloadLabel="Download Youth Wing PDF"
          backLabel="Back to Youth Wing"
        />
        <YouthFormBody logoUrl={settings.logo_url} regions={regions} watermarkOpacity={0.03} />
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
          #youth-form-body {
            box-shadow: none !important;
            border: none !important;
            padding: 10mm 15mm !important;
            margin: 0 auto !important;
          }
        }
      `,
          }}
        />
      </div>
    </MaintenanceGate>
  )
}
