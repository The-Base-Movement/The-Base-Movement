import { Breadcrumbs } from '@/components/Breadcrumbs'

interface PostToolbarProps {
  title: string
  onShare: () => void
}

export function PostToolbar({ title, onShare }: PostToolbarProps) {
  return (
    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <Breadcrumbs currentLabel={title} />
      <div className="flex items-center gap-3">
        <button
          onClick={onShare}
          className="h-10 px-4 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none text-micro font-bold tracking-tight bg-white flex items-center cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 8 }}>
            share
          </span>{' '}
          Share
        </button>
        <button className="h-10 w-10 p-0 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none bg-white flex items-center justify-center cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            bookmark
          </span>
        </button>
      </div>
    </div>
  )
}
