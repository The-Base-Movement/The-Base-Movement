interface TrashCardProps {
  title: string
  subtitle: string
  type: string
  deletedAt: string
  onRestore: () => void
  onDelete: () => void
  daysLeft: number
  icon?: string
  image?: string
  accent?: 'red' | 'gold' | 'green'
  isSelected: boolean
  onToggle: () => void
}

export function TrashCard({
  title,
  subtitle,
  type,
  deletedAt,
  onRestore,
  onDelete,
  daysLeft,
  icon,
  image,
  accent = 'red',
  isSelected,
  onToggle,
}: TrashCardProps) {
  const isExpiringSoon = daysLeft <= 7
  const accentColor =
    accent === 'red'
      ? 'hsl(var(--destructive))'
      : accent === 'gold'
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'

  return (
    <div
      className="panel"
      style={{
        padding: 0,
        overflow: 'hidden',
        outline: isSelected ? '2px solid hsl(var(--primary))' : '2px solid transparent',
        transition: 'outline 0.15s',
      }}
    >
      {/* Desktop layout */}
      <div className="desktop-only" style={{ display: 'flex', minHeight: 140 }}>
        <div
          style={{
            width: 120,
            position: 'relative',
            overflow: 'hidden',
            background: 'hsl(var(--container-low))',
            borderRight: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {image ? (
            <img
              src={image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
            />
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 36, color: 'hsl(var(--on-surface-muted))', opacity: 0.15 }}
            >
              {icon}
            </span>
          )}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: accentColor,
            }}
          />
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <input
              type="checkbox"
              aria-label={`Select ${title}`}
              checked={isSelected}
              onChange={onToggle}
              style={{
                width: 15,
                height: 15,
                accentColor: 'hsl(var(--primary))',
                cursor: 'pointer',
              }}
            />
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
            <span
              className="pill"
              style={{
                background: 'hsl(var(--on-surface))',
                color: '#fff',
                fontSize: 9,
                fontWeight: 'var(--font-weight-semibold, 600)',
                padding: '2px 7px',
              }}
            >
              {type}
            </span>
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 10,
                    color: 'hsl(var(--on-surface-muted))',
                    margin: '0 0 3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </p>
                <h4
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 14,
                    color: 'hsl(var(--on-surface))',
                    margin: 0,
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </h4>
              </div>
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 4,
                  background: isExpiringSoon
                    ? 'hsl(var(--destructive))'
                    : 'hsl(var(--container-low))',
                  border: `1px solid ${isExpiringSoon ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}`,
                  textAlign: 'center',
                  flexShrink: 0,
                  minWidth: 56,
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    color: isExpiringSoon ? '#fff' : 'hsl(var(--on-surface))',
                    lineHeight: 1,
                  }}
                >
                  {daysLeft}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: isExpiringSoon
                      ? 'rgba(255,255,255,0.8)'
                      : 'hsl(var(--on-surface-muted))',
                    marginTop: 2,
                  }}
                >
                  days left
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
              >
                history
              </span>
              <span
                style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}
              >
                Deleted {new Date(deletedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid hsl(var(--border))',
            }}
          >
            <button
              onClick={onRestore}
              className="btn btn-primary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                settings_backup_restore
              </span>
              Restore
            </button>
            <button
              onClick={onDelete}
              className="btn btn-dest btn-sm"
              style={{ width: 36, padding: 0, justifyContent: 'center' }}
              title="Delete forever"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                delete_forever
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="mobile-only" style={{ padding: 14 }}>
        <div style={{ height: 3, background: accentColor, borderRadius: 99, marginBottom: 12 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
            <input
              type="checkbox"
              aria-label={`Select ${title}`}
              checked={isSelected}
              onChange={onToggle}
              style={{
                width: 15,
                height: 15,
                accentColor: 'hsl(var(--primary))',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  className="pill"
                  style={{
                    background: 'hsl(var(--on-surface))',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    padding: '2px 7px',
                  }}
                >
                  {type}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'hsl(var(--on-surface-muted))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </span>
              </div>
              <h4
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 14,
                  color: 'hsl(var(--on-surface))',
                  margin: 0,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h4>
            </div>
          </div>
          <div
            style={{
              padding: '5px 9px',
              borderRadius: 4,
              background: isExpiringSoon ? 'hsl(var(--destructive))' : 'hsl(var(--container-low))',
              border: `1px solid ${isExpiringSoon ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}`,
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 'var(--font-weight-semibold, 600)',
                color: isExpiringSoon ? '#fff' : 'hsl(var(--on-surface))',
                lineHeight: 1,
              }}
            >
              {daysLeft}
            </div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: isExpiringSoon ? 'rgba(255,255,255,0.8)' : 'hsl(var(--on-surface-muted))',
                marginTop: 2,
              }}
            >
              days left
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}
          >
            history
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>
            Deleted {new Date(deletedAt).toLocaleDateString()}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <button
            onClick={onRestore}
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              settings_backup_restore
            </span>
            Restore
          </button>
          <button
            onClick={onDelete}
            className="btn btn-dest btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            title="Delete forever"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
              delete_forever
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
