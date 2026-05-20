import type { CanvassingCampaign } from '@/types/admin'

interface CampaignSelectorProps {
  activeCampaigns: CanvassingCampaign[]
  onSelect: (campaign: CanvassingCampaign) => void
}

export function CampaignSelector({ activeCampaigns, onSelect }: CampaignSelectorProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-tiny font-bold tracking-tight text-stone-400">Select active campaign</h2>
      {activeCampaigns.length === 0 ? (
        <div className="bg-white border border-stone-200 p-12 text-center shadow-sm">
          <span
            className="material-symbols-outlined text-stone-300 block mx-auto mb-3"
            style={{ fontSize: 32 }}
          >
            warning
          </span>
          <p className="text-micro font-bold text-stone-400 tracking-tight">
            No active mobilization missions in your sector.
          </p>
        </div>
      ) : (
        activeCampaigns.map((camp) => (
          <button
            key={camp.id}
            onClick={() => onSelect(camp)}
            className="w-full bg-white border border-stone-200 p-6 flex items-center justify-between hover:border-primary hover:shadow-md transition-all group text-left"
          >
            <div className="text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 text-[8px] font-bold tracking-tight">
                  Active
                </span>
                <span className="text-micro font-bold text-stone-500 tracking-tight">
                  {camp.target_constituency}
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-900 tracking-tight mb-1">{camp.title}</h3>
              <p className="text-tiny text-stone-500 line-clamp-1">{camp.description}</p>
            </div>
            <span
              className="material-symbols-outlined text-stone-300 group-hover:text-primary group-hover:translate-x-1 transition-all"
              style={{ fontSize: 20 }}
            >
              chevron_right
            </span>
          </button>
        ))
      )}
    </div>
  )
}
