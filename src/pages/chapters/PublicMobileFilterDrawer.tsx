import { PublicFilterSection } from './PublicFilterSection'

interface PublicMobileFilterDrawerProps {
  onClose: () => void
  searchTerm: string
  setSearchTerm: (v: string) => void
  totalChapters: number
  countryCount: number
  onRequestChapter: () => void
}

export function PublicMobileFilterDrawer({
  onClose,
  ...filterProps
}: PublicMobileFilterDrawerProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-start"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-[300px] h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <span className="font-meta font-bold tracking-tight text-lg">Filters</span>
          <button onClick={onClose} className="bg-none border-none cursor-pointer">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>
        <div className="p-6">
          <PublicFilterSection isMobile {...filterProps} />
        </div>
      </div>
    </div>
  )
}
