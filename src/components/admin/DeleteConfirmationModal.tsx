
interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  isLoading?: boolean
  isPermanent?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  isPermanent = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div 
        className="panel"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 0,
          overflow: 'hidden',
          backgroundColor: 'hsl(var(--surface))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Header/Warning Strip */}
        <div 
          style={{
            height: 4,
            width: '100%',
            backgroundColor: isPermanent ? 'hsl(var(--destructive))' : 'hsl(var(--accent))'
          }} 
        />
        
        <div style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
            <div 
              style={{
                width: 48,
                height: 48,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: isPermanent ? 'rgba(206, 17, 38, 0.1)' : 'rgba(184, 153, 94, 0.1)'
              }}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ 
                  fontSize: 24, 
                  color: isPermanent ? 'hsl(var(--destructive))' : 'hsl(var(--accent))' 
                }}
              >
                {isPermanent ? 'delete_forever' : 'warning'}
              </span>
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'hsl(var(--on-surface))' }}>
                {title}
              </h3>
              <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', marginTop: 4, lineHeight: 1.5 }}>
                {description}
              </p>
            </div>
          </div>

          {/* Item Preview Card */}
          <div 
            style={{ 
              backgroundColor: 'hsl(var(--container-low))', 
              borderRadius: 4, 
              padding: 16, 
              border: '1px solid hsl(var(--border))', 
              marginBottom: 32 
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', opacity: 0.5, marginBottom: 4 }}>
              Target item
            </p>
            <p style={{ fontSize: 14, fontWeight: 800, color: 'hsl(var(--on-surface))', margin: 0 }}>
              {itemName}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-outline"
              style={{ flex: 1, height: 48 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={isPermanent ? "btn btn-dest" : "btn btn-primary"}
              style={{ flex: 1, height: 48 }}
            >
              {isLoading ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>sync</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {isPermanent ? 'delete_forever' : 'delete'}
                </span>
              )}
              {isLoading ? 'Processing...' : isPermanent ? 'Permanently delete' : 'Move to trash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
