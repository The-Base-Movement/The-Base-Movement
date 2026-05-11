import { Activity, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import type { DonationCampaign } from '@/types/admin'

interface StrategicPrioritiesProps {
  loading: boolean
  campaigns: DonationCampaign[]
  onSelectCampaign: (id: string) => void
}

export function StrategicPriorities({ loading, campaigns, onSelectCampaign }: StrategicPrioritiesProps) {
  return (
    <section className="mt-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight font-meta">Strategic priorities</h2>
          <p className="text-xs font-medium text-stone-400 tracking-tight mt-2">Deploy capital to critical movement units.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-stone-100 animate-pulse rounded-none border border-stone-200" />
          ))
        ) : campaigns.map(c => (
          <Card key={c.id} className="rounded-none border-stone-200 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500 overflow-hidden bg-white">
            <div className="aspect-[16/10] bg-stone-100 overflow-hidden relative">
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" decoding="async" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-50">
                   <Activity className="w-12 h-12 text-stone-200 group-hover:text-brand-green/30 transition-colors duration-500" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className="bg-brand-green text-white text-[10px] font-bold tracking-tight px-3 py-1.5 shadow-xl">live mobilization</span>
              </div>
            </div>
            <CardContent className="p-8 flex flex-col flex-1">
              <h3 className="font-bold text-stone-900 font-meta text-xl mb-3 group-hover:text-brand-green transition-colors tracking-tight">{c.title}</h3>
              <p className="text-sm text-stone-500 mb-8 line-clamp-3 leading-relaxed font-medium">{c.description}</p>
              
              <div className="mt-auto space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-3">
                     <span className="text-micro font-medium text-stone-400 tracking-tight">strength at {Math.round((c.raisedAmount / c.targetAmount) * 100)}%</span>
                    <span className="text-sm font-bold font-meta text-stone-900">₵ {c.raisedAmount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 overflow-hidden rounded-full border border-stone-50">
                    <div 
                      className="h-full bg-brand-green transition-all duration-1000 shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" 
                      style={{ width: `${Math.min(100, (c.raisedAmount / c.targetAmount) * 100)}%` }}
                    />
                  </div>
                </div>
                
                <Button 
                  variant="default"
                  onClick={() => onSelectCampaign(c.id)}
                  className="w-full h-12 rounded-none text-tiny font-medium tracking-tight border-stone-200 hover:border-brand-green/40 hover:text-brand-green hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                >
                  direct capital <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
