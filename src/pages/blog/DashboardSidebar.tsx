import type { BlogPost } from '@/services/adminService'

interface DashboardSidebarProps {
  categories: string[]
  activeCategory: string
  posts: BlogPost[]
  onCategoryChange: (cat: string) => void
  sidebarEmail: string
  onSidebarEmailChange: (v: string) => void
  sidebarSubmitting: boolean
  onSidebarSubscribe: () => void
}

export function DashboardSidebar({
  categories,
  activeCategory,
  posts,
  onCategoryChange,
  sidebarEmail,
  onSidebarEmailChange,
  sidebarSubmitting,
  onSidebarSubscribe,
}: DashboardSidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel">
        <div className="ph">
          <span>Categories</span>
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                marginBottom: 2,
                background: activeCategory === cat ? 'rgba(0,107,63,0.07)' : 'none',
                color: activeCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
              }}
            >
              <span>{cat === 'All' ? 'All Articles' : cat}</span>
              <span style={{ fontWeight: 800, fontSize: 10, opacity: 0.5 }}>
                {cat === 'All' ? posts.length : posts.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: '#181d19',
          borderRadius: 6,
          padding: 20,
          borderLeft: '4px solid hsl(var(--accent))',
        }}
      >
        <div
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 14,
            color: '#fff',
            marginBottom: 6,
          }}
        >
          The Base Weekly
        </div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6,
            margin: '0 0 14px',
          }}
        >
          Get policy briefs and movement news delivered to your inbox weekly.
        </p>
        <input
          aria-label="Email address"
          name="name-0af8a4"
          id="input-0af8a4"
          type="email"
          placeholder="Email address"
          value={sidebarEmail}
          onChange={(e) => onSidebarEmailChange(e.target.value)}
          style={{
            width: '100%',
            height: 38,
            padding: '0 12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            color: '#fff',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 8,
          }}
        />
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={sidebarSubmitting}
          onClick={onSidebarSubscribe}
        >
          {sidebarSubmitting ? 'Subscribing…' : 'Subscribe'}
        </button>
      </div>
    </div>
  )
}
