import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'

import { cn } from '@/lib/utils'

interface ChoiceStepProps {
  onSelect: (platform: string, file?: File) => void
  isScanning?: boolean
  scanStatus?: string
  activePlatform?: string
  compact?: boolean
}

export function ChoiceStep({
  onSelect,
  isScanning = false,
  scanStatus,
  activePlatform,
  compact = false,
}: ChoiceStepProps) {
  return (
    <div className={cn('w-full auth-frame', compact ? '' : 'max-w-[840px] mx-auto')}>
      <div className="auth-header-label">
        01 · Platform <span>Choose your network</span>
      </div>
      <div className={compact ? 'p-5' : 'p-8 md:p-10'}>
        {!compact && (
          <SEO
            title="Join the Movement"
            description="Register to join The Base Movement. Whether in Ghana or the diaspora, your contribution matters for national development."
            canonical="/register"
          />
        )}
        <div className={compact ? 'text-left mb-5' : 'text-center mb-10'}>
          <h1
            className={cn(
              'font-medium text-on-surface tracking-tight font-meta mb-1',
              compact ? 'text-xl' : 'text-2xl'
            )}
          >
            The Base
          </h1>
          <p className="text-[11px] font-medium text-primary uppercase tracking-[.06em]">
            Member Registration
          </p>
        </div>

        <div className={cn('grid grid-cols-1 gap-4', compact ? '' : 'md:grid-cols-2 gap-6')}>
          <PlatformCard
            title="Base Ghana"
            subtitle="Local membership"
            description="Designed for patriots currently living within the 16 regions of Ghana."
            icon={
              <span className="material-symbols-outlined" style={{ fontSize: compact ? 20 : 24 }}>
                location_on
              </span>
            }
            variant="primary"
            active={activePlatform === 'GHANA'}
            compact={compact}
            onClick={() => onSelect('GHANA')}
          />

          <PlatformCard
            title="Base Diaspora"
            subtitle="Global membership"
            description="Tailored for Ghanaians and supporters living abroad."
            icon={
              <span className="material-symbols-outlined" style={{ fontSize: compact ? 20 : 24 }}>
                public
              </span>
            }
            variant="gold"
            active={activePlatform === 'DIASPORA'}
            compact={compact}
            onClick={() => onSelect('DIASPORA')}
          />
        </div>

        <div
          className={cn(
            'border border-dashed border-border rounded-lg bg-container-low/50',
            compact ? 'mt-5 p-5' : 'mt-12 p-8'
          )}
        >
          <div
            className={cn(
              'flex flex-col items-center justify-between gap-6',
              compact ? '' : 'md:flex-row'
            )}
          >
            <div className="text-left">
              <h3
                className={cn(
                  'font-semibold text-on-surface mb-1',
                  compact ? 'text-base' : 'text-lg'
                )}
              >
                Prefer physical registration?
              </h3>
              <p className="text-[12px] text-on-surface-muted max-w-sm">
                Download the registration form, fill it out manually, and upload a scanned copy here
                for processing.
              </p>
            </div>
            <div
              className={cn(
                'flex flex-wrap gap-3 justify-center',
                compact ? 'w-full' : 'md:justify-end'
              )}
            >
              <div className={cn('flex gap-2', compact ? 'w-full flex-col' : 'flex-col')}>
                <a
                  href="/registration-form-ghana.pdf"
                  download
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary/10 text-primary text-[11px] font-medium tracking-tight rounded-sm hover:bg-primary/20 transition-all border border-primary/20"
                >
                  Download Ghana Form
                </a>
                <a
                  href="/registration-form-diaspora.pdf"
                  download
                  className="inline-flex items-center justify-center px-4 py-2 bg-brand-gold/10 text-brand-gold text-[11px] font-medium tracking-tight rounded-sm hover:bg-brand-gold/20 transition-all border border-brand-gold/20"
                >
                  Download Diaspora Form
                </a>
              </div>
              <label
                className={cn(
                  isScanning ? 'cursor-not-allowed' : 'cursor-pointer',
                  compact && 'w-full'
                )}
              >
                <input
                  type="file"
                  accept=".pdf,image/*,.heic,.heif,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  disabled={isScanning}
                  onChange={(e) => {
                    if (e.target.files?.[0]) onSelect('PHYSICAL', e.target.files[0])
                  }}
                />
                <div
                  className={cn(
                    'inline-flex items-center justify-center gap-2 bg-on-surface text-surface text-[12px] font-medium tracking-tight rounded-sm hover:opacity-90 transition-all shadow-lg select-none',
                    compact ? 'w-full px-4 py-3' : 'px-6 py-4'
                  )}
                >
                  {isScanning ? (
                    <>
                      <span
                        className="material-symbols-outlined animate-spin"
                        style={{ fontSize: 16 }}
                      >
                        progress_activity
                      </span>
                      {scanStatus ?? 'Scanning form…'}
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

        {!compact && (
          <div className="text-center mt-12 pt-8 border-t border-border">
            <p className="text-[13px] text-on-surface-muted">
              Already a member?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in securely →
              </Link>
            </p>
          </div>
        )}
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
  active,
  compact,
  onClick,
}: {
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  variant: 'primary' | 'gold'
  active?: boolean
  compact?: boolean
  onClick: () => void
}) {
  const activeClasses =
    variant === 'primary' ? 'border-primary bg-primary/5' : 'border-brand-gold bg-brand-gold/5'

  return (
    <button
      onClick={onClick}
      className={cn(
        'auth-frame group text-left transition-all duration-300 hover:shadow-2xl active:scale-[0.99]',
        !compact && 'hover:-translate-y-1',
        active
          ? activeClasses
          : variant === 'primary'
            ? 'hover:border-primary/50'
            : 'hover:border-brand-gold/50'
      )}
    >
      <div className="auth-header-label">{subtitle}</div>
      <div className={cn('flex flex-col h-full', compact ? 'p-5' : 'p-8')}>
        <div
          className={cn(
            'rounded-sm flex items-center justify-center transition-colors',
            compact ? 'w-10 h-10 mb-4' : 'w-12 h-12 mb-6',
            variant === 'primary' ? 'bg-primary text-white' : 'bg-brand-gold text-white'
          )}
        >
          {icon}
        </div>
        <h3
          className={cn(
            'font-semibold text-on-surface tracking-tight',
            compact ? 'text-lg mb-2' : 'text-2xl mb-3'
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            'text-[13px] text-on-surface-muted leading-relaxed flex-1',
            compact ? 'mb-5' : 'mb-8'
          )}
        >
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
          {active ? 'Selected platform' : 'Join platform'}{' '}
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {active ? 'check_circle' : 'arrow_forward'}
          </span>
        </div>
      </div>
    </button>
  )
}
