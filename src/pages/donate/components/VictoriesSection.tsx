import { Check } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { DonationCampaign } from '@/types/admin'

interface VictoriesSectionProps {
  pastCampaigns: DonationCampaign[]
}

export function VictoriesSection({ pastCampaigns }: VictoriesSectionProps) {
  if (pastCampaigns.length === 0) return null

  return (
    <section className="mt-32 lowercase">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-meta flex items-center gap-4">
            <Check className="w-8 h-8 text-brand-green" />
            strategic victories
          </h2>
          <p className="text-xs font-medium text-stone-400 tracking-tight mt-2">historical proof of patriot mobilization success.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {pastCampaigns.map(c => (
          <Card key={c.id} className="bg-white border border-stone-200 p-6 flex flex-col relative grayscale hover:grayscale-0 transition-all duration-700 opacity-75 hover:opacity-100 rounded-none">
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-stone-900 text-white text-[9px] font-bold tracking-tight px-3 py-1 shadow-xl flex items-center gap-1">
                <Check className="w-3 h-3 text-brand-green" /> 100% secured
              </span>
            </div>
            <div className="aspect-square bg-stone-50 mb-6 overflow-hidden rounded-none border border-stone-100">
              {c.imageUrl && <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover"  decoding="async" loading="lazy" />}
            </div>
            <h4 className="font-bold text-stone-900 font-meta text-sm mb-2 tracking-tight lowercase first-letter:uppercase">{c.title}</h4>
            <p className="text-xs font-medium text-stone-500 mb-8 line-clamp-2 leading-relaxed lowercase">{c.description}</p>
            <div className="mt-auto pt-6 border-t border-stone-100 flex justify-between items-center">
              <div>
                <p className="text-micro font-medium text-stone-400 tracking-tight">total impact</p>
                <p className="text-sm font-bold text-brand-green font-meta">ghs {c.raisedAmount.toLocaleString()}</p>
              </div>
              <span className="text-[9px] font-bold text-stone-300 tracking-tight italic uppercase">decommissioned</span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
