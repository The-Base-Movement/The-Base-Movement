import { useState, useEffect, useCallback, useRef } from 'react'
import { useMediaHubLayout } from './MediaHubContext'
import { mediaHubService, type CommsMember, type CommsRole } from '@/services/mediaHubService'
import { toast } from 'sonner'

const ROLES: { value: CommsRole; label: string }[] = [
  { value: 'MEDIA', label: 'Media' },
  { value: 'MOBILIZATION', label: 'Mobilization' },
]

function MemberRow({
  member,
  onToggle,
}: {
  member: CommsMember
  onToggle: (m: CommsMember, role: CommsRole, next: boolean) => void
}) {
  return (
    <div
      className="panel"
      style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 160 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          {member.name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
          {member.registration_number ?? '—'}
          {member.platform ? ` · ${member.platform}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {ROLES.map((r) => {
          const active = member.roles.includes(r.value)
          return (
            <button
              key={r.value}
              className={active ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
              onClick={() => onToggle(member, r.value, !active)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>
                {active ? 'check' : 'add'}
              </span>
              {r.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function MediaMembers() {
  useMediaHubLayout('Members', 'group', 'Give members access to the Comms Hub feed.')

  const [tagged, setTagged] = useState<CommsMember[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CommsMember[]>([])
  const [searching, setSearching] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const loadTagged = useCallback(async () => {
    try {
      const data = await mediaHubService.getCommsMembers()
      setTagged(data)
    } catch {
      toast.error('Failed to load tagged members')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadTagged()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadTagged])

  // Debounced member search — all state updates deferred into the timer callback
  useEffect(() => {
    const q = query.trim()
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      if (q.length < 2) {
        setResults([])
        setSearching(false)
        return
      }
      setSearching(true)
      try {
        const data = await mediaHubService.searchMembers(q)
        setResults(data)
      } catch {
        /* silent */
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [query])

  const toggle = useCallback(
    async (member: CommsMember, role: CommsRole, next: boolean) => {
      const ok = next
        ? await mediaHubService.assignCommsRole(member.id, role)
        : await mediaHubService.removeCommsRole(member.id, role)
      if (!ok) {
        toast.error('Could not update role')
        return
      }
      toast.success(
        next ? `Added ${role.toLowerCase()} access` : `Removed ${role.toLowerCase()} access`
      )

      const apply = (m: CommsMember): CommsMember =>
        m.id === member.id
          ? {
              ...m,
              roles: next ? [...new Set([...m.roles, role])] : m.roles.filter((x) => x !== role),
            }
          : m

      setResults((prev) => prev.map(apply))
      // Keep the tagged list authoritative — reload so members with zero roles drop off.
      loadTagged()
    },
    [loadTagged]
  )

  return (
    <div>
      {/* Search */}
      <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 6,
          }}
        >
          Find a member
        </label>
        <input
          type="text"
          placeholder="Search by name or registration number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px',
            fontSize: 13,
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--container-low))',
            color: 'hsl(var(--on-surface))',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: "'Public Sans', sans-serif",
          }}
        />
        {query.trim().length >= 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {searching ? (
              <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
                Searching…
              </p>
            ) : results.length === 0 ? (
              <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
                No members found.
              </p>
            ) : (
              results.map((m) => <MemberRow key={m.id} member={m} onToggle={toggle} />)
            )}
          </div>
        )}
      </div>

      {/* Currently tagged */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface-muted))',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 10px',
        }}
      >
        Members with access ({tagged.length})
      </p>
      {loading ? (
        <p
          style={{
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            padding: 20,
            textAlign: 'center',
          }}
        >
          Loading…
        </p>
      ) : tagged.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
            fontSize: 13,
          }}
        >
          No members have Comms Hub access yet. Search above to add someone.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tagged.map((m) => (
            <MemberRow key={m.id} member={m} onToggle={toggle} />
          ))}
        </div>
      )}
    </div>
  )
}
