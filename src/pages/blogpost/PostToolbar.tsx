import { Breadcrumbs } from '@/components/Breadcrumbs'

interface PostToolbarProps {
  title: string
  onShare: () => void
  isDashboard?: boolean
  isLiked?: boolean
  likeLoading?: boolean
  onLikeToggle?: () => void
}

export function PostToolbar({
  title,
  onShare,
  isDashboard = false,
  isLiked = false,
  likeLoading = false,
  onLikeToggle,
}: PostToolbarProps) {
  return (
    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <Breadcrumbs currentLabel={title} />
      <div className="flex items-center gap-3">
        <button
          onClick={onShare}
          className="h-10 px-4 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-none text-micro font-medium tracking-tight bg-white flex items-center cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 8 }}>
            share
          </span>{' '}
          Share
        </button>
        {isDashboard && onLikeToggle && (
          <button
            onClick={onLikeToggle}
            disabled={likeLoading}
            title={isLiked ? 'Unlike this post' : 'Like this post'}
            className="h-10 w-10 p-0 border border-stone-200 hover:bg-stone-50 rounded-none bg-white flex items-center justify-center cursor-pointer transition-colors"
            style={{
              color: isLiked ? 'hsl(var(--destructive))' : 'rgb(87,83,78)',
              borderColor: isLiked ? 'hsl(var(--destructive))' : undefined,
              opacity: likeLoading ? 0.5 : 1,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 18,
                fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              favorite
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
