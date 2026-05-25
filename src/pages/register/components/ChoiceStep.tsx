import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import type { BrandingSettings } from '@/types/branding'
import { cn } from '@/lib/utils'

interface ChoiceStepProps {
  settings: BrandingSettings
  onSelect: (platform: string, file?: File) => void
  isScanning?: boolean
}

export function ChoiceStep({ settings, onSelect, isScanning = false }: ChoiceStepProps) {
  return (
    <div className="max-w-[840px] w-full mx-auto auth-frame">
      <div className="auth-header-label">
        01 · Platform <span>Choose your network</span>
      </div>
      <div className="p-8 md:p-10">
        <SEO
          title="Join the Movement"
          description="Register to join The Base Movement. Whether in Ghana or the diaspora, your contribution matters for national development."
          canonical="/register"
        />
        <div className="text-center mb-10">
          <img
            src={settings.logo_url}
            alt="The Base"
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-medium text-on-surface tracking-tight font-meta mb-1">
            The Base
          </h1>
          <p className="text-[11px] font-medium text-primary uppercase tracking-[.06em]">
            Member Registration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlatformCard
            title="Base Ghana"
            subtitle="Local membership"
            description="Designed for patriots currently living within the 16 regions of Ghana."
            icon={
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                location_on
              </span>
            }
            variant="primary"
            onClick={() => onSelect('GHANA')}
          />

          <PlatformCard
            title="Base Diaspora"
            subtitle="Global membership"
            description="Tailored for Ghanaians and supporters living abroad."
            icon={
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                public
              </span>
            }
            variant="gold"
            onClick={() => onSelect('DIASPORA')}
          />
        </div>

        <div className="mt-12 p-8 border border-dashed border-border rounded-lg bg-container-low/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <h3 className="text-lg font-semibold text-on-surface mb-1">
                Prefer physical registration?
              </h3>
              <p className="text-[12px] text-on-surface-muted max-w-sm">
                Download the registration form, fill it out manually, and upload a scanned copy here
                for processing.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-end">
              <div className="flex flex-col gap-2">
                <a
                  href="/registration-form-ghana.pdf"
                  download
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary/10 text-primary text-[11px] font-medium uppercase tracking-wider rounded-sm hover:bg-primary/20 transition-all border border-primary/20"
                >
                  Download Ghana Form
                </a>
                <a
                  href="/registration-form-diaspora.pdf"
                  download
                  className="inline-flex items-center justify-center px-4 py-2 bg-brand-gold/10 text-brand-gold text-[11px] font-medium uppercase tracking-wider rounded-sm hover:bg-brand-gold/20 transition-all border border-brand-gold/20"
                >
                  Download Diaspora Form
                </a>
              </div>
              <label className={isScanning ? 'cursor-not-allowed' : 'cursor-pointer'}>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  disabled={isScanning}
                  onChange={(e) => {
                    if (e.target.files?.[0]) onSelect('PHYSICAL', e.target.files[0])
                  }}
                />
                <div className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-on-surface text-surface text-[12px] font-medium uppercase tracking-wider rounded-sm hover:opacity-90 transition-all shadow-lg select-none">
                  {isScanning ? (
                    <>
                      <span
                        className="material-symbols-outlined animate-spin"
                        style={{ fontSize: 16 }}
                      >
                        progress_activity
                      </span>
                      Scanning form…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        document_scanner
                      </span>
                      Upload Scanned Form
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-[13px] text-on-surface-muted">
            Already a member?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in securely →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function PlatformCard({
  title,
  subtitle,
  description,
  icon,
  variant,
  onClick,
}: {
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  variant: 'primary' | 'gold'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'auth-frame group text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.99]',
        variant === 'primary' ? 'hover:border-primary/50' : 'hover:border-brand-gold/50'
      )}
    >
      <div className="auth-header-label">
        {subtitle} <span className={cn(variant === 'gold' && 'text-brand-gold')}>PATRIOT</span>
      </div>
      <div className="p-8 flex flex-col h-full">
        <div
          className={cn(
            'w-12 h-12 rounded-sm flex items-center justify-center mb-6 transition-colors',
            variant === 'primary' ? 'bg-primary text-white' : 'bg-brand-gold text-white'
          )}
        >
          {icon}
        </div>
        <h3 className="text-2xl font-semibold text-on-surface mb-3 tracking-tight">{title}</h3>
        <p className="text-[13px] text-on-surface-muted leading-relaxed mb-8 flex-1">
          {description}
        </p>
        <div
          className={cn(
            'flex items-center gap-2 text-[12px] font-medium tracking-tight transition-colors',
            variant === 'primary'
              ? 'text-primary group-hover:text-primary/80'
              : 'text-brand-gold group-hover:text-brand-gold/80'
          )}
        >
          Join platform{' '}
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_forward
          </span>
        </div>
      </div>
    </button>
  )
}
