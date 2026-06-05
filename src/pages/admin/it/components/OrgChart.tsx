import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HierarchyRow {
  id: string
  user_id: string
  reports_to: string | null
  role_title: string
  full_name: string
  avatar_url?: string | null
}

interface TreeNode extends HierarchyRow {
  children: TreeNode[]
}

interface AdminCandidate {
  id: string
  full_name: string
  role: string
  avatar_url?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LINE_COLOR = 'hsl(var(--border))'

function buildTree(rows: HierarchyRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  rows.forEach((r) => map.set(r.user_id, { ...r, children: [] }))

  const roots: TreeNode[] = []
  rows.forEach((r) => {
    const node = map.get(r.user_id)!
    if (r.reports_to && map.has(r.reports_to)) {
      map.get(r.reports_to)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

// ─── Add Subordinate Modal ────────────────────────────────────────────────────

interface AddModalProps {
  parentUserId: string
  parentName: string
  existingUserIds: Set<string>
  onClose: () => void
  onSaved: () => void
}

function AddSubordinateModal({
  parentUserId,
  parentName,
  existingUserIds,
  onClose,
  onSaved,
}: AddModalProps) {
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<AdminCandidate[]>([])
  const [selected, setSelected] = useState<AdminCandidate | null>(null)
  const [roleTitle, setRoleTitle] = useState('')
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length < 2) {
        setCandidates([])
        return
      }
      setSearching(true)
      try {
        const { data } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .ilike('full_name', `%${query}%`)
          .limit(8)

        const filtered = (data ?? []).filter((u) => !existingUserIds.has(u.id))
        setCandidates(
          filtered.map((u) => ({
            id: u.id,
            full_name: u.full_name,
            role: '',
            avatar_url: u.avatar_url,
          }))
        )
      } finally {
        setSearching(false)
      }
    }, 280)
    return () => clearTimeout(t)
  }, [query, existingUserIds])

  async function handleSave() {
    if (!selected) {
      toast.error('Select a team member first')
      return
    }
    if (!roleTitle.trim()) {
      toast.error('Role title is required')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('it_hierarchy').upsert(
        {
          user_id: selected.id,
          reports_to: parentUserId,
          role_title: roleTitle.trim(),
        },
        { onConflict: 'user_id' }
      )
      if (error) throw error
      toast.success(`${selected.full_name} added to the hierarchy`)
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add subordinate')
    } finally {
      setSaving(false)
    }
  }

  const inputSt: React.CSSProperties = {
    width: '100%',
    height: 38,
    padding: '0 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 13,
    color: 'hsl(var(--on-surface))',
    background: 'hsl(var(--background))',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Add Subordinate
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
              Reports to: {parentName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}
            >
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Member search */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 6,
              }}
            >
              Team Member
            </label>
            {selected ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  border: '1px solid hsl(var(--primary))',
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--primary) / 0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selected.avatar_url ? (
                    <img
                      src={selected.avatar_url}
                      alt={selected.full_name}
                      style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                      decoding="async"
                    />
                  ) : (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                    >
                      person
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {selected.full_name}
                  </span>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                  >
                    close
                  </span>
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 15,
                    color: 'hsl(var(--on-surface-muted))',
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name…"
                  style={{ ...inputSt, paddingLeft: 34 }}
                  autoFocus
                />
                {(candidates.length > 0 || searching) && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      zIndex: 10,
                      overflow: 'hidden',
                    }}
                  >
                    {searching ? (
                      <div
                        style={{
                          padding: '10px 14px',
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        Searching…
                      </div>
                    ) : (
                      candidates.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelected(c)
                            setQuery('')
                          }}
                          style={{
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            borderBottom: '1px solid hsl(var(--border))',
                            fontSize: 13,
                            color: 'hsl(var(--on-surface))',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'hsl(var(--container-low))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                        >
                          {c.avatar_url ? (
                            <img
                              src={c.avatar_url}
                              alt={c.full_name}
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                              decoding="async"
                            />
                          ) : (
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 15, color: 'hsl(var(--on-surface-muted))' }}
                            >
                              person
                            </span>
                          )}
                          {c.full_name}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role title */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'hsl(var(--on-surface-muted))',
                marginBottom: 6,
              }}
            >
              Role / Title
            </label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior Developer, IT Support"
              style={inputSt}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            disabled={saving || !selected || !roleTitle.trim()}
            onClick={handleSave}
          >
            {saving ? 'Adding…' : 'Add to hierarchy'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Set-up IT Manager Modal ──────────────────────────────────────────────────

function SetupRootModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [query, setQuery] = useState('')
  const [candidates, setCandidates] = useState<AdminCandidate[]>([])
  const [selected, setSelected] = useState<AdminCandidate | null>(null)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length < 2) {
        setCandidates([])
        return
      }
      setSearching(true)
      try {
        const { data } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .ilike('full_name', `%${query}%`)
          .limit(8)
        setCandidates(
          (data ?? []).map((u) => ({
            id: u.id,
            full_name: u.full_name,
            role: '',
            avatar_url: u.avatar_url,
          }))
        )
      } finally {
        setSearching(false)
      }
    }, 280)
    return () => clearTimeout(t)
  }, [query])

  async function handleSave() {
    if (!selected) {
      toast.error('Select the IT Manager first')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('it_hierarchy').upsert(
        {
          user_id: selected.id,
          reports_to: null,
          role_title: 'IT Manager',
        },
        { onConflict: 'user_id' }
      )
      if (error) throw error
      toast.success(`${selected.full_name} set as IT Manager`)
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to set IT Manager')
    } finally {
      setSaving(false)
    }
  }

  const inputSt: React.CSSProperties = {
    width: '100%',
    height: 38,
    padding: '0 12px',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-sm)',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    fontSize: 13,
    color: 'hsl(var(--on-surface))',
    background: 'hsl(var(--background))',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Set IT Manager
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
            This person becomes the root of the IT org chart.
          </p>
        </div>
        <div style={{ padding: 24 }}>
          {selected ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                border: '1px solid hsl(var(--primary))',
                borderRadius: 'var(--radius-sm)',
                background: 'hsl(var(--primary) / 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selected.avatar_url ? (
                  <img
                    src={selected.avatar_url}
                    alt={selected.full_name}
                    style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
                    decoding="async"
                  />
                ) : (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                  >
                    person
                  </span>
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {selected.full_name}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}
                >
                  close
                </span>
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 15,
                  color: 'hsl(var(--on-surface-muted))',
                  pointerEvents: 'none',
                }}
              >
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                style={{ ...inputSt, paddingLeft: 34 }}
                autoFocus
              />
              {(candidates.length > 0 || searching) && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    zIndex: 10,
                    overflow: 'hidden',
                  }}
                >
                  {searching ? (
                    <div
                      style={{
                        padding: '10px 14px',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      Searching…
                    </div>
                  ) : (
                    candidates.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelected(c)
                          setQuery('')
                        }}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          borderBottom: '1px solid hsl(var(--border))',
                          fontSize: 13,
                          color: 'hsl(var(--on-surface))',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'hsl(var(--container-low))')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        {c.avatar_url ? (
                          <img
                            src={c.avatar_url}
                            alt={c.full_name}
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                            decoding="async"
                          />
                        ) : (
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 15, color: 'hsl(var(--on-surface-muted))' }}
                          >
                            person
                          </span>
                        )}
                        {c.full_name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            gap: 10,
          }}
        >
          <button className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            disabled={saving || !selected}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : 'Set as IT Manager'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  node: TreeNode
  isRoot?: boolean
  existingUserIds: Set<string>
  onAddSubordinate: (parentUserId: string, parentName: string) => void
  onRemove: (userId: string, name: string, hasChildren: boolean) => void
  onEditTitle: (userId: string, currentTitle: string, name: string) => void
}

function OrgNode({
  node,
  isRoot = false,
  existingUserIds,
  onAddSubordinate,
  onRemove,
  onEditTitle,
}: TreeNodeProps) {
  const n = node.children.length
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Node card */}
      <div
        style={{
          background: '#fff',
          border: `1.5px solid ${isRoot ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          minWidth: 160,
          maxWidth: 200,
          boxShadow: isRoot
            ? '0 0 0 3px hsl(var(--primary) / 0.12), 0 2px 8px rgba(0,0,0,0.06)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Node actions menu */}
        <div style={{ position: 'absolute', top: 6, right: 6 }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              borderRadius: 'var(--radius-xs)',
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              more_vert
            </span>
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 2px)',
                  zIndex: 50,
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  minWidth: 130,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onEditTitle(node.user_id, node.role_title, node.full_name)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontFamily: "'Public Sans', sans-serif",
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(var(--on-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    edit
                  </span>
                  Edit title
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onRemove(node.user_id, node.full_name, n > 0)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontFamily: "'Public Sans', sans-serif",
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'hsl(var(--destructive))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    person_remove
                  </span>
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
        {/* Avatar circle */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: isRoot ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
            border: `1.5px solid ${isRoot ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px',
            overflow: 'hidden',
          }}
        >
          {node.avatar_url ? (
            <img
              src={node.avatar_url}
              alt={node.full_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              decoding="async"
            />
          ) : (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: isRoot ? '#fff' : 'hsl(var(--on-surface-muted))' }}
            >
              {isRoot ? 'computer' : 'person'}
            </span>
          )}
        </div>

        <p
          style={{
            margin: '0 0 2px',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface))',
            lineHeight: 1.3,
            wordBreak: 'break-word',
          }}
        >
          {node.full_name}
        </p>
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 10,
            color: isRoot ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {node.role_title}
        </p>

        <button
          onClick={() => onAddSubordinate(node.user_id, node.full_name)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-pill)',
            background: 'hsl(var(--container-low))',
            cursor: 'pointer',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            transition: 'all 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'hsl(var(--primary))'
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.borderColor = 'hsl(var(--primary))'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'hsl(var(--container-low))'
            e.currentTarget.style.color = 'hsl(var(--on-surface-muted))'
            e.currentTarget.style.borderColor = 'hsl(var(--border))'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
            add
          </span>
          Add Subordinate
        </button>
      </div>

      {/* Children */}
      {n > 0 && (
        <>
          {/* Vertical connector down from this node */}
          <div style={{ width: 2, height: 24, background: LINE_COLOR }} />

          {/* Children row */}
          <div style={{ display: 'flex', position: 'relative' }}>
            {/* Horizontal line spanning all children centers */}
            {n > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${100 / (n * 2)}%`,
                  right: `${100 / (n * 2)}%`,
                  height: 2,
                  background: LINE_COLOR,
                  pointerEvents: 'none',
                }}
              />
            )}

            {node.children.map((child) => (
              <div
                key={child.user_id}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingLeft: 16,
                  paddingRight: 16,
                }}
              >
                {/* Vertical connector down to child */}
                <div style={{ width: 2, height: 24, background: LINE_COLOR }} />
                <OrgNode
                  node={child}
                  existingUserIds={existingUserIds}
                  onAddSubordinate={onAddSubordinate}
                  onRemove={onRemove}
                  onEditTitle={onEditTitle}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── OrgChart (exported) ──────────────────────────────────────────────────────

export function OrgChart() {
  const [rows, setRows] = useState<HierarchyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState<{ parentUserId: string; parentName: string } | null>(
    null
  )
  const [setupModal, setSetupModal] = useState(false)
  const [editModal, setEditModal] = useState<{
    userId: string
    currentTitle: string
    name: string
  } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  async function handleRemove(userId: string, name: string, hasChildren: boolean) {
    const row = rows.find((r) => r.user_id === userId)
    const confirmMsg = hasChildren
      ? `Remove ${name} from the hierarchy? Their direct reports will be reassigned to their manager.`
      : `Remove ${name} from the hierarchy?`
    if (!confirm(confirmMsg)) return

    if (hasChildren && row?.reports_to) {
      await supabase
        .from('it_hierarchy')
        .update({ reports_to: row.reports_to })
        .eq('reports_to', userId)
    }
    const { error } = await supabase.from('it_hierarchy').delete().eq('user_id', userId)
    if (error) {
      toast.error('Failed to remove member')
      return
    }
    toast.success(`${name} removed from hierarchy`)
    load()
  }

  function openEditModal(userId: string, currentTitle: string, name: string) {
    setEditModal({ userId, currentTitle, name })
    setEditTitle(currentTitle)
  }

  async function handleEditSave() {
    if (!editModal || !editTitle.trim()) return
    setEditSaving(true)
    const { error } = await supabase
      .from('it_hierarchy')
      .update({ role_title: editTitle.trim() })
      .eq('user_id', editModal.userId)
    setEditSaving(false)
    if (error) {
      toast.error('Failed to update title')
      return
    }
    toast.success('Role title updated')
    setEditModal(null)
    load()
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // it_hierarchy.user_id / reports_to reference auth.users, which PostgREST
      // cannot traverse. Fetch hierarchy rows first, then resolve names from
      // public.users in a separate query using the collected UUIDs.
      const { data: rows, error } = await supabase
        .from('it_hierarchy')
        .select('id, user_id, reports_to, role_title')

      if (error) throw error

      const allIds = [
        ...new Set((rows ?? []).flatMap((r) => [r.user_id, r.reports_to].filter(Boolean))),
      ] as string[]

      let nameMap: Record<string, string> = {}
      let avatarMap: Record<string, string | null> = {}
      if (allIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .in('id', allIds)
        nameMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.full_name ?? 'Unknown']))
        avatarMap = Object.fromEntries((users ?? []).map((u) => [u.id, u.avatar_url ?? null]))
      }

      const mapped: HierarchyRow[] = (rows ?? []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        reports_to: r.reports_to,
        role_title: r.role_title,
        full_name: nameMap[r.user_id] ?? 'Unknown',
        avatar_url: avatarMap[r.user_id] ?? null,
      }))
      setRows(mapped)
    } catch (err) {
      console.error('[OrgChart] load error', err)
      toast.error('Failed to load hierarchy')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const roots = buildTree(rows)
  const existingUserIds = new Set(rows.map((r) => r.user_id))

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      {/* Panel header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
          >
            account_tree
          </span>
          <p
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            Team Hierarchy
          </p>
          {rows.length > 0 && (
            <span className="pill pill-ok" style={{ fontSize: 9 }}>
              {rows.length} {rows.length === 1 ? 'member' : 'members'}
            </span>
          )}
        </div>

        {rows.length === 0 && !loading && (
          <button className="btn btn-primary btn-sm" onClick={() => setSetupModal(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              add
            </span>
            Set IT Manager
          </button>
        )}
      </div>

      {/* Chart body */}
      <div
        style={{
          padding: 32,
          overflowX: 'auto',
          overflowY: 'visible',
          minHeight: 200,
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 160,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
            }}
          >
            Loading hierarchy…
          </div>
        ) : roots.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              height: 160,
              textAlign: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 40, color: 'hsl(var(--on-surface-muted))', opacity: 0.25 }}
            >
              account_tree
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              No hierarchy set up yet.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setSetupModal(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                add
              </span>
              Set IT Manager
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
            {roots.map((root) => (
              <OrgNode
                key={root.user_id}
                node={root}
                isRoot
                existingUserIds={existingUserIds}
                onAddSubordinate={(parentUserId, parentName) =>
                  setAddModal({ parentUserId, parentName })
                }
                onRemove={handleRemove}
                onEditTitle={openEditModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {addModal && (
        <AddSubordinateModal
          parentUserId={addModal.parentUserId}
          parentName={addModal.parentName}
          existingUserIds={existingUserIds}
          onClose={() => setAddModal(null)}
          onSaved={() => {
            setAddModal(null)
            load()
          }}
        />
      )}
      {setupModal && (
        <SetupRootModal
          onClose={() => setSetupModal(false)}
          onSaved={() => {
            setSetupModal(false)
            load()
          }}
        />
      )}

      {/* Edit role title modal */}
      {editModal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setEditModal(null)}
          >
            <div
              style={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: 380,
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 14,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  Edit Role Title
                </p>
                <p
                  style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}
                >
                  {editModal.name}
                </p>
              </div>
              <div style={{ padding: '20px' }}>
                <input
                  id="edit-role-title"
                  name="roleTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Role title"
                  autoFocus
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    background: 'hsl(var(--background))',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditModal(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={editSaving || !editTitle.trim()}
                    onClick={handleEditSave}
                  >
                    {editSaving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
