import { Link } from 'react-router-dom'
import { MapPin, Globe, ArrowRight } from 'lucide-react'
import SEO from '@/components/SEO'
import type { BrandingSettings } from '@/types/branding'
import { cn } from '@/lib/utils'

interface ChoiceStepProps {
  settings: BrandingSettings
  onSelect: (platform: string) => void
}

export function ChoiceStep({ settings, onSelect }: ChoiceStepProps) {
  return (
    <div className="max-w-[840px] w-full mx-auto">
      <SEO 
        title="Join the Movement"
        description="Register to join The Base Movement. Whether in Ghana or the diaspora, your contribution matters for national development."
        canonical="/register"
      />
      <div className="text-center mb-10">
        <img src={settings.logo_url} alt="The Base" className="h-16 w-auto mx-auto mb-4 object-contain" />
        <h1 className="text-2xl font-black text-on-surface tracking-tight font-meta mb-1">The Base</h1>
        <p className="text-[11px] font-black text-primary uppercase tracking-[.06em]">Member Registration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlatformCard 
          title="Base Ghana"
          subtitle="Local membership"
          description="Designed for patriots currently living within the 16 regions of Ghana."
          icon={<MapPin className="w-6 h-6" />}
          variant="primary"
          onClick={() => onSelect('GHANA')}
        />

        <PlatformCard 
          title="Base Diaspora"
          subtitle="Global membership"
          description="Tailored for Ghanaians and supporters living abroad."
          icon={<Globe className="w-6 h-6" />}
          variant="gold"
          onClick={() => onSelect('DIASPORA')}
        />
      </div>

      <div className="text-center mt-12 pt-8 border-t border-border">
        <p className="text-[13px] text-on-surface-muted">
          Already a member? <Link to="/login" className="text-primary font-bold hover:underline">Sign in securely →</Link>
        </p>
      </div>
    </div>
  )
}

function PlatformCard({ title, subtitle, description, icon, variant, onClick }: { 
  title: string, 
  subtitle: string, 
  description: string, 
  icon: React.ReactNode, 
  variant: 'primary' | 'gold',
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "auth-frame group text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.99]",
        variant === 'primary' ? "hover:border-primary/50" : "hover:border-brand-gold/50"
      )}
    >
      <div className="auth-header-label">
        {subtitle} <span className={cn(variant === 'gold' && "text-brand-gold")}>PATRIOT</span>
      </div>
      <div className="p-8 flex flex-col h-full">
        <div className={cn(
          "w-12 h-12 rounded-sm flex items-center justify-center mb-6 transition-colors",
          variant === 'primary' ? "bg-primary text-white" : "bg-brand-gold text-white"
        )}>
          {icon}
        </div>
        <h3 className="text-2xl font-black text-on-surface mb-3 tracking-tight">{title}</h3>
        <p className="text-[13px] text-on-surface-muted leading-relaxed mb-8 flex-1">
          {description}
        </p>
        <div className={cn(
          "flex items-center gap-2 text-[12px] font-black uppercase tracking-wider transition-colors",
          variant === 'primary' ? "text-primary group-hover:text-primary/80" : "text-brand-gold group-hover:text-brand-gold/80"
        )}>
          Join platform <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  )
}
