import type { PressRelease } from '@/types/admin'

interface ReleaseDetailModalProps {
  release: PressRelease
  onClose: () => void
}

export function ReleaseDetailModal({ release, onClose }: ReleaseDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-stone-50/50">
          <div className="pr-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2 py-0.5 text-micro font-bold tracking-tight rounded-sm">
                {release.category}
              </span>
              <span className="text-tiny text-slate-400 font-medium tracking-tight">
                {new Date(release.publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-charcoal-dark tracking-tight leading-tight mb-0">
              {release.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-white/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              close
            </span>
          </button>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed space-y-4">
            <p className="font-bold text-charcoal-dark">ACCRA, GHANA — Official Statement</p>
            <p>{release.excerpt}</p>
            <p>
              "The Base Movement remains committed to the principle of collective progress. This
              milestone/policy reflects our deep engagement with the grassroots and our vision for a
              sovereign, prosperous nation. We invite all citizens and members of the Diaspora to
              review the full implications of this development."
            </p>
            <p>
              For further information or to schedule an interview with movement leadership, please
              contact the communications desk at press@thebasemovement.org.
            </p>
          </div>
        </div>
        <div className="p-6 bg-stone-50 border-t border-slate-100 text-center">
          <button
            onClick={onClose}
            className="h-10 px-6 bg-primary text-white font-bold text-xs border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            Close Release
          </button>
        </div>
      </div>
    </div>
  )
}
