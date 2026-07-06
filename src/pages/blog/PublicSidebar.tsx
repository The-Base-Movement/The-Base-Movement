import { useState } from 'react'
import type { BlogPost } from '@/services/adminService'

interface PublicSidebarProps {
  categories: string[]
  activeCategory: string
  posts: BlogPost[]
  onCategoryChange: (cat: string) => void
  publicEmail: string
  onPublicEmailChange: (v: string) => void
  publicPhone: string
  onPublicPhoneChange: (v: string) => void
  publicSubmitting: boolean
  onPublicSubscribe: () => void
  publicSubscribed?: boolean
}

export function PublicSidebar({
  categories,
  activeCategory,
  posts,
  onCategoryChange,
  publicEmail,
  onPublicEmailChange,
  publicPhone,
  onPublicPhoneChange,
  publicSubmitting,
  onPublicSubscribe,
  publicSubscribed = false,
}: PublicSidebarProps) {
  const [hoverCat, setHoverCat] = useState<string | null>(null)

  return (
    <aside className="hidden lg:block lg:w-1/3 space-y-12 lg:sticky lg:top-8 lg:self-start">
      <div>
        <h2 className="font-medium tracking-tight mb-6" style={{ color: 'hsl(var(--on-surface))' }}>
          Categories
        </h2>
        <div
          className="p-8 space-y-2"
          style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
        >
          {categories.map((cat) => {
            const active = activeCategory === cat
            const highlighted = active || hoverCat === cat
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                onMouseEnter={() => setHoverCat(cat)}
                onMouseLeave={() => setHoverCat(null)}
                className="w-full flex items-center justify-between p-3 text-xs font-medium tracking-tight transition-all"
                style={{
                  background: active
                    ? 'hsl(var(--primary) / 0.1)'
                    : hoverCat === cat
                      ? 'hsl(var(--container-low))'
                      : 'transparent',
                  color: highlighted ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                }}
              >
                {cat === 'All' ? 'All Articles' : cat}
                <span
                  className="text-micro font-meta transition-colors"
                  style={{
                    color: highlighted ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {cat === 'All' ? posts.length : posts.filter((p) => p.category === cat).length}{' '}
                  Posts
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div
        className="p-8"
        style={{
          background: 'hsl(132 9% 10%)',
          borderLeft: '4px solid hsl(var(--accent))',
          color: '#fff',
        }}
      >
        <h4 className="font-meta font-medium text-lg tracking-tight mb-4">The Base Weekly</h4>
        <p className="text-xs leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
            disabled={publicSubscribed}
            className="w-full text-xs"
            style={{
              padding: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <input
            aria-label="Phone Number"
            type="tel"
            placeholder="Phone number for SMS (optional)"
            value={publicPhone}
            onChange={(e) => onPublicPhoneChange(e.target.value)}
            disabled={publicSubscribed}
            className="w-full text-xs"
            style={{
              padding: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            className="w-full h-12 text-xs cursor-pointer hover:opacity-90 transition-opacity"
            style={{
              background: 'hsl(var(--primary))',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--button-radius)',
              fontWeight: 'var(--button-font-weight)',
            }}
            disabled={publicSubmitting || publicSubscribed}
            onClick={onPublicSubscribe}
          >
            {publicSubmitting ? 'Subscribing…' : publicSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>
    </aside>
  )
}
