import { useState } from 'react'
import { createPortal } from 'react-dom'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

interface SpendingCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  onChanged: () => void
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  height: 36,
  padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  outline: 'none',
  boxSizing: 'border-box',
}

export function SpendingCategoryModal({
  isOpen,
  onClose,
  categories,
  onChanged,
}: SpendingCategoryModalProps) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!isOpen) return null

  const handleAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Category already exists')
      return
    }
    setAdding(true)
    const ok = await adminService.addSpendingCategory(trimmed)
    setAdding(false)
    if (ok) {
      toast.success(`"${trimmed}" added`)
      setNewName('')
      onChanged()
    } else {
      toast.error('Failed to add category')
    }
  }

  const handleRename = async (id: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) return
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== id)) {
      toast.error('A category with that name already exists')
      return
    }
    setSavingId(id)
    const ok = await adminService.renameSpendingCategory(id, trimmed)
    setSavingId(null)
    if (ok) {
      toast.success('Category renamed')
      setEditingId(null)
      onChanged()
    } else {
      toast.error('Failed to rename category')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id)
    const ok = await adminService.deleteSpendingCategory(id)
    setDeletingId(null)
    if (ok) {
      toast.success(`"${name}" removed`)
      onChanged()
    } else {
      toast.error('Failed to delete category')
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
              }}
            >
              Manage categories
            </h3>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Add, rename, or remove spending categories.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* Add new */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 8,
          }}
        >
          <label htmlFor="new-category-name" style={{ display: 'none' }}>
            New category name
          </label>
          <input
            id="new-category-name"
            name="newCategoryName"
            style={inputStyle}
            placeholder="New category name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add
            </span>
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>

        {/* Category list */}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {categories.length === 0 ? (
            <p
              style={{
                padding: '32px 20px',
                textAlign: 'center',
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              No categories yet.
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {editingId === cat.id ? (
                  <>
                    <label htmlFor={`edit-cat-${cat.id}`} style={{ display: 'none' }}>
                      Rename category
                    </label>
                    <input
                      id={`edit-cat-${cat.id}`}
                      name="editCategoryName"
                      style={inputStyle}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(cat.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleRename(cat.id)}
                      disabled={savingId === cat.id}
                    >
                      {savingId === cat.id ? 'Saving…' : 'Save'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {cat.name}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setEditingId(cat.id)
                        setEditingName(cat.name)
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        edit
                      </span>
                    </button>
                    <button
                      className="btn btn-outline-dest btn-sm"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={deletingId === cat.id}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {deletingId === cat.id ? 'hourglass_empty' : 'delete'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
