import { Link } from 'react-router-dom'
import { FileText, User, ArrowRight } from 'lucide-react'
import SEO from '@/components/SEO'
import type { BrandingSettings } from '@/types/branding'

interface ChoiceStepProps {
  settings: BrandingSettings
  onSelect: (platform: string) => void
}

export function ChoiceStep({ settings, onSelect }: ChoiceStepProps) {
  return (
    <div className="max-w-5xl w-full mx-auto">
      <SEO 
        title="Join the Movement"
        description="Register to join The Base Movement. Whether in Ghana or the diaspora, your contribution matters for national development."
        canonical="/register"
      />
      <div className="text-center mb-12">
        <img src={settings.logo_url} alt="The Base" className="h-24 w-auto mx-auto mb-6 object-contain" />
        <h1 className="text-4xl font-bold text-on-surface tracking-tighter font-meta mb-2">The Base</h1>
        <div className="w-20 h-1.5 bg-destructive mx-auto mb-6"></div>
        <h2 className="text-sm font-bold text-muted-foreground tracking-tight font-meta">Membership registration options</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Local Membership Card */}
        <div 
          onClick={() => onSelect('GHANA')}
          className="group relative bg-white border border-border/60 hover:border-brand-green/40 p-10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-green/10 flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-0 h-1.5 bg-brand-green group-hover:w-full transition-all duration-700" />
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div className="w-20 h-20 bg-brand-green/5 flex items-center justify-center group-hover:bg-brand-green/10 transition-colors">
                <FileText className="w-10 h-10 text-brand-green" />
              </div>
              <div className="text-micro font-bold text-brand-green bg-brand-green/10 px-3 py-1 tracking-tight">In-country</div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-3xl text-on-surface tracking-tight font-meta leading-none group-hover:text-brand-green transition-colors">
                Local membership <br/> (Ghana)
              </h3>
              <p className="text-sm text-muted-foreground/90 leading-relaxed font-body-md">
                Designed for citizens and residents currently living within the 16 regions of Ghana.
              </p>
              <ul className="space-y-3">
                {[
                  'Automatic assignment to your regional chapter',
                  'Full voting rights on tactical directives',
                  'Eligibility for local leadership roles'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-on-surface/90 font-body-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-tiny font-bold tracking-tight text-brand-green">
              Select membership <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* Diaspora Membership Card */}
        <div 
          onClick={() => onSelect('DIASPORA')}
          className="group relative bg-white border border-border/60 hover:border-brand-gold/40 p-10 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-brand-gold/10 flex flex-col justify-between"
        >
          <div className="absolute top-0 left-0 w-0 h-1.5 bg-brand-gold group-hover:w-full transition-all duration-700" />
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div className="w-20 h-20 bg-brand-gold/5 flex items-center justify-center group-hover:bg-brand-gold/10 transition-colors">
                <User className="w-10 h-10 text-brand-gold" />
              </div>
              <div className="text-micro font-bold text-brand-gold bg-brand-gold/10 px-3 py-1 tracking-tight">Global community</div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-3xl text-on-surface tracking-tight font-meta leading-none group-hover:text-brand-gold transition-colors">
                Diaspora <br/> membership
              </h3>
              <p className="text-sm text-muted-foreground/90 leading-relaxed font-body-md">
                Tailored for Ghanaians and supporters living abroad.
              </p>
              <ul className="space-y-3">
                {[
                  'Participation in global advisory committees',
                  'Access to digital town halls',
                  'Dedicated Diaspora Member ID'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-on-surface/90 font-body-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-tiny font-bold tracking-tight text-brand-gold">
              Select membership <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-16 pt-8 border-t border-border/60">
        <p className="text-sm text-muted-foreground font-body-md">
          Already a member? <Link to="/login" className="text-primary font-bold hover:underline">Sign in securely</Link>
        </p>
      </div>
    </div>
  )
}
