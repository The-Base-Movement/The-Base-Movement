import type { CanvassingCampaign } from '@/types/admin'

interface CampaignHeaderProps {
  campaign: CanvassingCampaign
  onReset: () => void
}

export function CampaignHeader({ campaign, onReset }: CampaignHeaderProps) {
  return (
    <>
      {/* Field agent mission header */}
      <div
        className="text-white p-5 pb-[18px] relative overflow-hidden"
        style={{ background: 'hsl(var(--destructive))' }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined" style={{ fontSize: 96 }}>
            location_on
          </span>
        </div>
        <div className="relative z-10">
          <button
            onClick={onReset}
            className="text-[9px] font-bold text-white/60 hover:text-white tracking-[.06em] uppercase mb-3 flex items-center gap-1"
          >
            ← Change mission
          </button>
          <p className="text-[9px] font-bold text-white/70 uppercase tracking-[.06em] mb-1">
            Operation ground game
          </p>
          <h2 className="font-meta font-extrabold text-[18px] tracking-tight leading-tight mb-2">
            {campaign.title}
          </h2>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1 px-[10px] py-[4px] bg-white/10 border border-white/18 rounded-full font-meta font-extrabold text-[9.5px] uppercase tracking-[.04em]">
              <span className="material-symbols-outlined" style={{ fontSize: 10 }}>
                location_on
              </span>{' '}
              {campaign.target_constituency}
            </span>
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div className="flex justify-between items-center px-5 py-[14px] bg-stone-50 border-b border-stone-200">
        <div>
          <div className="font-meta font-extrabold text-[24px] tracking-tight text-primary leading-none tabular-nums">
            0
          </div>
          <div className="text-[10px] font-bold text-on-surface-muted uppercase tracking-[.05em] mt-0.5">
            Doors today
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="text-[10px] font-bold text-on-surface-muted uppercase tracking-[.05em]">
            Goal: {campaign.goal_contacts.toLocaleString()}
          </div>
          <div className="w-[120px] h-[6px] bg-border rounded-full overflow-hidden">
            <div
              className="h-full w-0 rounded-full"
              style={{ background: 'linear-gradient(to right, #CE1126, #DAA520, #006B3F)' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
