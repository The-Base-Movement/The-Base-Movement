import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { AdminCandidate } from './types'
import { INPUT_ST } from './types'

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function SetupRootModal({ onClose, onSaved }: Props) {
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
      const { error } = await supabase
        .from('it_hierarchy')
        .upsert(
          { user_id: selected.id, reports_to: null, role_title: 'IT Manager' },
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
          background: 'hsl(var(--background))',
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
                style={{ ...INPUT_ST, paddingLeft: 34 }}
                autoFocus
              />
              {(candidates.length > 0 || searching) && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'hsl(var(--background))',
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
