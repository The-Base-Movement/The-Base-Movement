import type { BlogPost } from '@/services/adminService'

interface CategoryFilterBarProps {
  categories: string[]
  activeCategory: string
  posts: BlogPost[]
  onCategoryChange: (cat: string) => void
}

export function CategoryFilterBar({
  categories,
  activeCategory,
  posts,
  onCategoryChange,
}: CategoryFilterBarProps) {
  return (
    <div
      style={{
        marginBottom: 24,
        marginLeft: -16,
        marginRight: -16,
        paddingLeft: 16,
        paddingRight: 16,
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'nowrap',
          width: 'max-content',
          paddingBottom: 4,
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={activeCategory === cat ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            style={{ justifyContent: 'center', flexShrink: 0 }}
          >
            {cat}
            <span style={{ marginLeft: 6, fontWeight: 700, opacity: 0.6, fontSize: 10 }}>
              {cat === 'All' ? posts.length : posts.filter((p) => p.category === cat).length}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
