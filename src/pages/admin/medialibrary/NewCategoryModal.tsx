interface NewCategoryModalProps {
  newFolderLabel: string
  newFolderName: string
  isSavingFolder: boolean
  handleCreateFolder: (e: React.FormEvent) => Promise<void>
  handleLabelChange: (val: string) => void
  setNewFolderName: (val: string) => void
  onClose: () => void
}

export function NewCategoryModal({
  newFolderLabel,
  newFolderName,
  isSavingFolder,
  handleCreateFolder,
  handleLabelChange,
  setNewFolderName,
  onClose,
}: NewCategoryModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,19,16,0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '24px 28px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          background: '#fff',
          border: '1px solid hsl(var(--border))',
          borderRadius: 8,
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 16,
              color: 'hsl(var(--on-surface))',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
            >
              create_new_folder
            </span>
            Create new category
          </h3>
          <button
            onClick={onClose}
            className="ico"
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <form
          onSubmit={handleCreateFolder}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <label
              htmlFor="folder-label"
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              Category Display Name
            </label>
            <input
              id="folder-label"
              type="text"
              placeholder="e.g. Campaign Posters"
              value={newFolderLabel}
              onChange={(e) => handleLabelChange(e.target.value)}
              required
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                background: 'hsl(var(--container-low))',
                color: 'hsl(var(--on-surface))',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="folder-name"
              style={{
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              System Folder Path (Slug)
            </label>
            <input
              id="folder-name"
              type="text"
              placeholder="e.g. campaign-posters"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              required
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                background: 'hsl(var(--container-low))',
                color: 'hsl(var(--on-surface))',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline btn-sm"
              disabled={isSavingFolder}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSavingFolder}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isSavingFolder && (
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}
                >
                  sync
                </span>
              )}
              {isSavingFolder ? 'Creating…' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
