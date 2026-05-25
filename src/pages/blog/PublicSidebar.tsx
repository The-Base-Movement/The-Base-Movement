import type { BlogPost } from '@/services/adminService'

interface PublicSidebarProps {
  categories: string[]
  activeCategory: string
  posts: BlogPost[]
  onCategoryChange: (cat: string) => void
  publicEmail: string
  onPublicEmailChange: (v: string) => void
  publicSubmitting: boolean
  onPublicSubscribe: () => void
}

export function PublicSidebar({
  categories,
  activeCategory,
  posts,
  onCategoryChange,
  publicEmail,
  onPublicEmailChange,
  publicSubmitting,
  onPublicSubscribe,
}: PublicSidebarProps) {
  return (
    <aside className="hidden lg:block lg:w-1/3 space-y-12 lg:sticky lg:top-8 lg:self-start">
      <div>
        <h2 className="text-stone-900 font-medium tracking-tight mb-6">Categories</h2>
        <div className="bg-white border border-slate-200 p-8 space-y-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`w-full flex items-center justify-between p-3 text-xs font-medium tracking-tight transition-all group ${activeCategory === cat ? 'bg-brand-green/10 text-brand-green' : 'text-slate-600 hover:bg-slate-50 hover:text-brand-green'}`}
            >
              {cat === 'All' ? 'All Articles' : cat}
              <span
                className={`text-micro font-meta transition-colors ${activeCategory === cat ? 'text-brand-green' : 'text-slate-300 group-hover:text-brand-green'}`}
              >
                {cat === 'All' ? posts.length : posts.filter((p) => p.category === cat).length}{' '}
                Posts
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-charcoal-dark p-8 border-l-4 border-warm-gold text-white">
        <h4 className="font-meta font-medium text-lg tracking-tight mb-4">The Base Weekly</h4>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Get the movement's policy briefs and news delivered directly to your inbox every week.
        </p>
        <div className="space-y-3">
          <input
            aria-label="Email Address"
            name="name-b70be6"
            id="input-b70be6"
            type="email"
            placeholder="Email Address"
            value={publicEmail}
            onChange={(e) => onPublicEmailChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-green transition-colors rounded-sm"
          />
          <button
            className="w-full h-12 bg-primary text-white text-xs border-none cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              borderRadius: 'var(--button-radius)',
              fontWeight: 'var(--button-font-weight)',
            }}
            disabled={publicSubmitting}
            onClick={onPublicSubscribe}
          >
            {publicSubmitting ? 'Subscribing…' : 'Subscribe'}
          </button>
        </div>
      </div>
    </aside>
  )
}
