import { useBranding } from '@/hooks/useBranding'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SEO from '@/components/SEO'
import { FormControls } from './registrationformpreview/FormControls'
import { MembershipFormBody } from './registrationformpreview/MembershipFormBody'

export default function RegistrationFormPreview() {
  const { settings } = useBranding()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const platform = searchParams.get('platform') || 'GHANA'

  const formUrl =
    platform === 'DIASPORA'
      ? settings.registration_form_diaspora_url
      : settings.registration_form_ghana_url

  const formTitle = platform === 'DIASPORA' ? 'Diaspora Membership Form' : 'Ghana Membership Form'

  return (
    <div className="min-h-screen bg-stone-100 py-12 px-4 print:p-0 print:bg-white">
      <SEO title="Membership Form Preview" noindex />
      <FormControls
        onBack={() => navigate(-1)}
        onPrint={() => window.print()}
        formUrl={formUrl}
        platform={platform}
      />
      <MembershipFormBody platform={platform} formTitle={formTitle} logoUrl={settings.logo_url} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body { background: white; }
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
