import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { HierarchyRow, TreeNode } from '../hierarchy/types'
import { buildTree } from '../hierarchy/types'
import { AddSubordinateModal } from '../hierarchy/AddSubordinateModal'
import { SetupRootModal } from '../hierarchy/SetupRootModal'
import { EditTitleModal } from '../hierarchy/EditTitleModal'
import { RemoveModal } from '../hierarchy/RemoveModal'

const LINE_COLOR = 'hsl(var(--border))'

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
          background: 'hsl(var(--background))',
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

        {/* Avatar */}
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
          <div style={{ width: 2, height: 24, background: LINE_COLOR }} />
          <div style={{ display: 'flex', position: 'relative' }}>
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
  const [removeModal, setRemoveModal] = useState<{
    userId: string
    name: string
    hasChildren: boolean
  } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // it_hierarchy.user_id / reports_to reference auth.users, which PostgREST
      // cannot traverse. Fetch hierarchy rows first, then resolve names from
      // public.users in a separate query using the collected UUIDs.
      const { data: rowData, error } = await supabase
        .from('it_hierarchy')
        .select('id, user_id, reports_to, role_title')
      if (error) throw error

      const allIds = [
        ...new Set((rowData ?? []).flatMap((r) => [r.user_id, r.reports_to].filter(Boolean))),
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

      setRows(
        (rowData ?? []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          reports_to: r.reports_to,
          role_title: r.role_title,
          full_name: nameMap[r.user_id] ?? 'Unknown',
          avatar_url: avatarMap[r.user_id] ?? null,
        }))
      )
    } catch (err) {
      console.error('[OrgChart] load error', err)
      toast.error('Failed to load hierarchy')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  async function handleRemoveConfirm() {
    if (!removeModal) return
    const { userId, name, hasChildren } = removeModal
    const row = rows.find((r) => r.user_id === userId)
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
    setRemoveModal(null)
    load()
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
      <div style={{ padding: 32, overflowX: 'auto', overflowY: 'visible', minHeight: 200 }}>
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
                onRemove={(userId, name, hasChildren) =>
                  setRemoveModal({ userId, name, hasChildren })
                }
                onEditTitle={(userId, currentTitle, name) => {
                  setEditModal({ userId, currentTitle, name })
                  setEditTitle(currentTitle)
                }}
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
      {editModal && (
        <EditTitleModal
          name={editModal.name}
          value={editTitle}
          saving={editSaving}
          onChange={setEditTitle}
          onClose={() => setEditModal(null)}
          onSave={handleEditSave}
        />
      )}
      {removeModal && (
        <RemoveModal
          name={removeModal.name}
          hasChildren={removeModal.hasChildren}
          onClose={() => setRemoveModal(null)}
          onConfirm={handleRemoveConfirm}
        />
      )}
    </div>
  )
}
