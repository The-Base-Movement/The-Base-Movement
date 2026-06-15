import { type CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import { jobTaxonomyService, type JobTaxonomy } from '@/services/jobTaxonomyService'

// Editors only — narrower than the Jobs Analytics viewer list. Backend writes are
// independently gated by the is_admin() RLS policy on the job_* tables.
const ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'FOUNDER', 'IT_MANAGER']

const LEVELS = ['Entry', 'Professional', 'Senior / Specialist', 'Management', 'Other']

type Usage = {
  industries: Record<number, number>
  subCategories: Record<number, number>
  roles: Record<number, number>
}
const EMPTY_USAGE: Usage = { industries: {}, subCategories: {}, roles: {} }

const inputStyle: CSSProperties = {
  height: 32,
  padding: '0 8px',
  fontSize: 12,
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  boxSizing: 'border-box',
  width: '100%',
}

export default function JobTaxonomy() {
  const [role, setRole] = useState<string | null>(() => adminService.getCurrentUser()?.role ?? null)
  const [authChecked, setAuthChecked] = useState<boolean>(() => !!adminService.getCurrentUser())
  const [tax, setTax] = useState<JobTaxonomy | null>(null)
  const [usage, setUsage] = useState<Usage>(EMPTY_USAGE)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selIndustry, setSelIndustry] = useState<number | null>(null)
  const [selSub, setSelSub] = useState<number | null>(null)

  useEffect(() => {
    if (authChecked) return
    adminService.initialize().then((u) => {
      setRole(u?.role ?? null)
      setAuthChecked(true)
    })
  }, [authChecked])

  const allowed = !!role && ALLOWED_ROLES.includes(role)

  // No synchronous setState here — loading starts true and is cleared in finally;
  // the !allowed branch is handled by the access gate before any loading UI renders.
  const load = useCallback(async () => {
    try {
      const [taxonomy, counts] = await Promise.all([
        jobTaxonomyService.refresh(),
        jobTaxonomyService.getUsageCounts(),
      ])
      setTax(taxonomy)
      setUsage(counts)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load job taxonomy')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authChecked) return
    // load() only setStates after an await (deferred) — intentional fetch-on-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (allowed) load()
  }, [authChecked, allowed, load])

  // Run a write, then refresh taxonomy + usage. Surfaces FK / RLS errors as toasts.
  const run = useCallback(async (action: () => Promise<void>, successMsg: string) => {
    setBusy(true)
    try {
      await action()
      const [taxonomy, counts] = await Promise.all([
        jobTaxonomyService.refresh(),
        jobTaxonomyService.getUsageCounts(),
      ])
      setTax(taxonomy)
      setUsage(counts)
      toast.success(successMsg)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/foreign key|violates|23503/i.test(msg)) {
        toast.error('Cannot delete — still assigned to one or more members.')
      } else {
        console.error(err)
        toast.error(msg || 'Action failed')
      }
    } finally {
      setBusy(false)
    }
  }, [])

  const subs = useMemo(
    () =>
      tax && selIndustry ? tax.subCategories.filter((s) => s.industry_id === selIndustry) : [],
    [tax, selIndustry]
  )
  const roles = useMemo(
    () => (tax && selSub ? tax.roles.filter((r) => r.sub_category_id === selSub) : []),
    [tax, selSub]
  )

  if (!authChecked) return <Centered>Verifying access…</Centered>
  if (!allowed) {
    return (
      <Centered>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, color: 'hsl(var(--destructive))', marginBottom: 8 }}
        >
          lock
        </span>
        <p style={{ margin: 0, fontWeight: 'var(--font-weight-medium, 500)' }}>Access restricted</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
          Managing the job taxonomy is limited to Admins, Super Admins, Founders and IT Managers.
        </p>
      </Centered>
    )
  }

  return (
    <div className="main">
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'hsl(var(--on-surface))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            account_tree
          </span>
          Job Taxonomy
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
          Manage the industries, sub-categories and roles members pick during registration. Entries
          assigned to a member cannot be deleted until reassigned.
        </p>
      </div>

      {loading ? (
        <div
          className="panel"
          style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}
        >
          Loading taxonomy…
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {/* Industries */}
          <Column
            title="Industries"
            bar="hsl(var(--on-surface))"
            count={tax?.industries.length ?? 0}
            addPlaceholder="New industry name"
            busy={busy}
            onAdd={(name) => run(() => jobTaxonomyService.createIndustry(name), 'Industry added')}
          >
            {(tax?.industries ?? []).map((i) => (
              <TaxRow
                key={i.id}
                name={i.name}
                usage={usage.industries[i.id] ?? 0}
                selected={selIndustry === i.id}
                busy={busy}
                onSelect={() => {
                  setSelIndustry(i.id)
                  setSelSub(null)
                }}
                onSave={(name) =>
                  run(() => jobTaxonomyService.updateIndustry(i.id, name), 'Industry renamed')
                }
                onDelete={() =>
                  run(() => jobTaxonomyService.deleteIndustry(i.id), 'Industry deleted')
                }
              />
            ))}
          </Column>

          {/* Sub-categories */}
          <Column
            title="Sub-categories"
            bar="hsl(var(--primary))"
            count={subs.length}
            disabled={!selIndustry}
            disabledHint="Select an industry to view its sub-categories."
            addPlaceholder="New sub-category name"
            busy={busy}
            onAdd={(name) =>
              selIndustry &&
              run(
                () => jobTaxonomyService.createSubCategory(selIndustry, name),
                'Sub-category added'
              )
            }
          >
            {subs.map((s) => (
              <TaxRow
                key={s.id}
                name={s.name}
                secondary={s.code}
                usage={usage.subCategories[s.id] ?? 0}
                selected={selSub === s.id}
                busy={busy}
                onSelect={() => setSelSub(s.id)}
                onSave={(name) =>
                  run(
                    () => jobTaxonomyService.updateSubCategory(s.id, { name }),
                    'Sub-category renamed'
                  )
                }
                onDelete={() =>
                  run(() => jobTaxonomyService.deleteSubCategory(s.id), 'Sub-category deleted')
                }
              />
            ))}
          </Column>

          {/* Roles */}
          <Column
            title="Roles"
            bar="hsl(var(--accent))"
            count={roles.length}
            disabled={!selSub}
            disabledHint="Select a sub-category to view its roles."
            addPlaceholder="New role title"
            withLevel
            busy={busy}
            onAdd={(name, level) =>
              selSub &&
              run(
                () => jobTaxonomyService.createRole(selSub, name, level || 'Professional'),
                'Role added'
              )
            }
          >
            {roles.map((r) => (
              <TaxRow
                key={r.id}
                name={r.name}
                level={r.level}
                usage={usage.roles[r.id] ?? 0}
                busy={busy}
                onSave={(name, level) =>
                  run(() => jobTaxonomyService.updateRole(r.id, { name, level }), 'Role updated')
                }
                onDelete={() => run(() => jobTaxonomyService.deleteRole(r.id), 'Role deleted')}
              />
            ))}
          </Column>
        </div>
      )}
    </div>
  )
}

// --- Column shell: header + add form + scrollable list ----------------------
function Column({
  title,
  bar,
  count,
  disabled,
  disabledHint,
  addPlaceholder,
  withLevel,
  busy,
  onAdd,
  children,
}: {
  title: string
  bar: string
  count: number
  disabled?: boolean
  disabledHint?: string
  addPlaceholder: string
  withLevel?: boolean
  busy: boolean
  onAdd: (name: string, level?: string) => void
  children: React.ReactNode
}) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState(LEVELS[1])

  const submit = () => {
    const n = name.trim()
    if (!n) return
    onAdd(n, withLevel ? level : undefined)
    setName('')
  }

  return (
    <div className="panel" style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: bar }}
      />
      <div className="ph" style={{ paddingLeft: 18 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {title}
        </h3>
        <span className="pill pill-mute">{count}</span>
      </div>

      {disabled ? (
        <p
          style={{
            padding: '20px 18px',
            margin: 0,
            fontSize: 12,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {disabledHint}
        </p>
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '10px 14px 10px 18px',
              borderBottom: '1px solid hsl(var(--border))',
              flexWrap: 'wrap',
            }}
          >
            <input
              value={name}
              placeholder={addPlaceholder}
              style={{ ...inputStyle, flex: 1, minWidth: 120 }}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            {withLevel && (
              <select
                value={level}
                style={{ ...inputStyle, width: 'auto', minWidth: 120 }}
                disabled={busy}
                onChange={(e) => setLevel(e.target.value)}
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={submit}
              disabled={busy || !name.trim()}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
              Add
            </button>
          </div>
          <div style={{ maxHeight: 460, overflowY: 'auto', padding: '6px 0' }}>
            {count === 0 ? (
              <p
                style={{
                  padding: '14px 18px',
                  margin: 0,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Nothing here yet — add the first entry above.
              </p>
            ) : (
              children
            )}
          </div>
        </>
      )}
    </div>
  )
}

// --- One row: select / inline edit / usage badge / delete-confirm -----------
function TaxRow({
  name,
  secondary,
  level,
  usage,
  selected,
  busy,
  onSelect,
  onSave,
  onDelete,
}: {
  name: string
  secondary?: string
  level?: string
  usage: number
  selected?: boolean
  busy: boolean
  onSelect?: () => void
  onSave: (name: string, level?: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [draft, setDraft] = useState(name)
  const [draftLevel, setDraftLevel] = useState(level ?? LEVELS[1])
  const hasLevel = level !== undefined

  const save = () => {
    const n = draft.trim()
    if (!n) return
    onSave(n, hasLevel ? draftLevel : undefined)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 6, padding: '6px 14px 6px 18px', flexWrap: 'wrap' }}>
        <input
          autoFocus
          value={draft}
          style={{ ...inputStyle, flex: 1, minWidth: 120 }}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
        />
        {hasLevel && (
          <select
            value={draftLevel}
            style={{ ...inputStyle, width: 'auto', minWidth: 110 }}
            disabled={busy}
            onChange={(e) => setDraftLevel(e.target.value)}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        <button className="btn btn-primary btn-sm" onClick={save} disabled={busy || !draft.trim()}>
          Save
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={busy}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 14px 7px 18px',
        background: selected ? 'hsl(var(--container-low))' : 'transparent',
        cursor: onSelect ? 'pointer' : 'default',
      }}
      onClick={onSelect}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
          {onSelect && (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))', marginLeft: 'auto' }}
            >
              chevron_right
            </span>
          )}
        </div>
        {(secondary || level) && (
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 1 }}>
            {secondary && <span style={{ fontFamily: 'monospace' }}>{secondary}</span>}
            {secondary && level ? ' · ' : ''}
            {level}
          </div>
        )}
      </div>

      {usage > 0 && (
        <span className="pill pill-ok" title={`${usage} member${usage === 1 ? '' : 's'} assigned`}>
          {usage}
        </span>
      )}

      {confirming ? (
        <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-dest btn-sm" onClick={onDelete} disabled={busy || usage > 0}>
            Delete
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setConfirming(false)}
            disabled={busy}
          >
            No
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 2 }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-ghost btn-sm"
            title="Rename"
            onClick={() => {
              setDraft(name)
              setDraftLevel(level ?? LEVELS[1])
              setEditing(true)
            }}
            disabled={busy}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              edit
            </span>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            title={usage > 0 ? 'In use — reassign members first' : 'Delete'}
            onClick={() => setConfirming(true)}
            disabled={busy || usage > 0}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: usage > 0 ? undefined : 'hsl(var(--destructive))' }}
            >
              delete
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        fontFamily: "'Public Sans', sans-serif",
        color: 'hsl(var(--on-surface))',
      }}
    >
      {children}
    </div>
  )
}
