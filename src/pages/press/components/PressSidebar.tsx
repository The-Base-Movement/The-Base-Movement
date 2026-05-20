import type { MediaKitAsset } from '@/types/admin'

interface PressSidebarProps {
  mediaKit: MediaKitAsset[]
}

export function PressSidebar({ mediaKit }: PressSidebarProps) {
  return (
    <div className="space-y-8">
      {/* Media Contact */}
      <div className="bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white">
        <h3 className="font-meta font-bold text-xl tracking-tight mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-warm-gold" style={{ fontSize: 20 }}>
            mail
          </span>
          Media inquiries
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          For interview requests, official commentary, or verified data inquiries, contact our
          communications team.
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-micro font-bold tracking-tight text-slate-500 mb-1">General press</p>
            <p className="text-sm font-bold">press@thebasemovement.org</p>
          </div>
          <div>
            <p className="text-micro font-bold tracking-tight text-slate-500 mb-1">
              Global diaspora
            </p>
            <p className="text-sm font-bold">diaspora.media@thebasemovement.org</p>
          </div>
        </div>
      </div>

      {/* Media Kit */}
      <div className="bg-white p-8 border border-slate-100 shadow-sm">
        <h3 className="font-meta font-bold text-xl tracking-tight mb-4 flex items-center gap-2 text-charcoal-dark">
          <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 20 }}>
            download
          </span>
          Media kit
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Download official brand assets, leadership bios, and movement backgrounders for editorial
          use.
        </p>
        <div className="space-y-3">
          {mediaKit.length > 0 ? (
            mediaKit.map((asset) => (
              <button
                key={asset.id}
                onClick={() => window.open(asset.fileUrl, '_blank')}
                className="w-full flex items-center justify-between text-slate-600 border border-slate-100 hover:bg-slate-50 px-3 py-2 bg-white cursor-pointer text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {asset.fileType === 'LOGO' ? 'open_in_new' : 'description'}
                  </span>
                  {asset.title}
                </div>
                <span className="material-symbols-outlined opacity-50" style={{ fontSize: 16 }}>
                  download
                </span>
              </button>
            ))
          ) : (
            <>
              <button
                disabled
                className="w-full flex items-center justify-between text-slate-600 border border-slate-100 opacity-50 cursor-not-allowed px-3 py-2 bg-white text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    description
                  </span>
                  Brand Guidelines
                </div>
                <span className="material-symbols-outlined opacity-50" style={{ fontSize: 16 }}>
                  download
                </span>
              </button>
              <button
                disabled
                className="w-full flex items-center justify-between text-slate-600 border border-slate-100 opacity-50 cursor-not-allowed px-3 py-2 bg-white text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    open_in_new
                  </span>
                  High-Res Logos
                </div>
                <span className="material-symbols-outlined opacity-50" style={{ fontSize: 16 }}>
                  download
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
