import { Link } from 'react-router-dom'

interface MobileDrawerItem {
  to: string
  icon: string
  label: string
}

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  items?: MobileDrawerItem[]
}

export default function MobileDrawer({ open, onClose, items = [] }: MobileDrawerProps) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 280,
          background: 'hsl(var(--background))',
          borderRight: '1px solid hsl(var(--border))',
          padding: 16,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'hsl(var(--primary))',
              }}
            />
            <div>
              <div style={{ fontWeight: 600 }}>The Base</div>
              <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                Member portal
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav>
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              onClick={onClose}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '10px 8px',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                color: 'hsl(var(--on-surface))',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {it.icon}
              </span>
              <span style={{ fontWeight: 600 }}>{it.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
