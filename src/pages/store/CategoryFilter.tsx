import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  categories: string[]
  activeCategory: string
  filteredCount: number
  onSelect: (cat: string) => void
}

export function CategoryFilter({
  categories,
  activeCategory,
  filteredCount,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            'px-[14px] py-[6px] rounded-full border font-meta font-medium text-[11px] cursor-pointer transition-all',
            activeCategory === cat
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-on-surface border-border hover:border-primary hover:text-primary'
          )}
        >
          {cat === 'All' ? `All · ${filteredCount}` : cat}
        </button>
      ))}
    </div>
  )
}
