import { useEffect, useId, useState } from 'react'
import type { CSSProperties } from 'react'
import type { AudienceFilter, AudienceType } from '@/services/newsletterService'
import { newsletterService } from '@/services/newsletterService'
import type { ChapterSlot, ConstituencySlot } from '../composeTypes'

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const selectStyle: CSSProperties = {
  flex: 1,
  boxSizing: 'border-box',
  padding: '8px 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--background))',
  outline: 'none',
  cursor: 'pointer',
}

// ---------------------------------------------------------------------------
// SimpleFilterRow — all / region / chapter / role
// ---------------------------------------------------------------------------

interface SimpleFilterRowProps {
  filter: AudienceFilter
  onChange: (f: AudienceFilter) => void
  onRemove: () => void
  showRemove: boolean
  preloadedOptions?: string[]
}

export function SimpleFilterRow({
  filter,
  onChange,
  onRemove,
  showRemove,
  preloadedOptions,
}: SimpleFilterRowProps) {
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    if (filter.type === 'all') return
    let cancelled = false
    const resolve = (): Promise<string[]> =>
      preloadedOptions && preloadedOptions.length > 0
        ? Promise.resolve(preloadedOptions)
        : newsletterService.getAudienceOptions(
            filter.type as Exclude<AudienceType, 'all' | 'multi'>
          )
    resolve()
      .then((data) => {
        if (!cancelled) setOptions(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [filter.type, preloadedOptions])

  const typeSelectId = useId()
  const valueSelectId = useId()

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <select
        id={typeSelectId}
        name={typeSelectId}
        value={filter.type}
        onChange={(e) => {
          const t = e.target.value as AudienceFilter['type']
          onChange({ type: t, value: null })
        }}
        style={selectStyle}
        aria-label="Audience type"
      >
        <option value="all">All members</option>
        <option value="region">By region</option>
        <option value="chapter">By chapter</option>
        <option value="role">By role</option>
      </select>

      {filter.type !== 'all' && (
        <select
          id={valueSelectId}
          name={valueSelectId}
          value={filter.value ?? ''}
          onChange={(e) => onChange({ ...filter, value: e.target.value || null })}
          style={selectStyle}
          aria-label={`${filter.type} value`}
        >
          <option value="">— select —</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {showRemove && (
        <button
          onClick={onRemove}
          title="Remove"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: 'hsl(var(--on-surface-muted))',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            close
          </span>
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ConstituencySlotRow — region filter + search + checkbox list
// ---------------------------------------------------------------------------

interface ConstituencySlotRowProps {
  slot: ConstituencySlot
  regions: string[]
  byRegion: Record<string, string[]>
  allConstituencies: string[]
  onChange: (updates: Partial<ConstituencySlot>) => void
  onRemove: () => void
  showRemove: boolean
}

export function ConstituencySlotRow({
  slot,
  regions,
  byRegion,
  allConstituencies,
  onChange,
  onRemove,
  showRemove,
}: ConstituencySlotRowProps) {
  const base = slot.regionFilter ? (byRegion[slot.regionFilter] ?? []) : allConstituencies
  const visible = slot.search
    ? base.filter((c) => c.toLowerCase().includes(slot.search.toLowerCase()))
    : base
  const allVisibleSelected = visible.length > 0 && visible.every((c) => slot.selected.includes(c))

  function toggle(c: string) {
    const next = slot.selected.includes(c)
      ? slot.selected.filter((x) => x !== c)
      : [...slot.selected, c]
    onChange({ selected: next })
  }

  function selectVisible() {
    onChange({ selected: [...new Set([...slot.selected, ...visible])] })
  }

  function deselectVisible() {
    const vs = new Set(visible)
    onChange({ selected: slot.selected.filter((c) => !vs.has(c)) })
  }

  const loading = regions.length === 0 && allConstituencies.length === 0

  return (
    <div
      style={{
        marginBottom: 10,
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          background: 'hsl(var(--container-low))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, color: 'hsl(var(--primary))' }}
        >
          location_on
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            flex: 1,
          }}
        >
          By constituency
        </span>
        {slot.selected.length > 0 && (
          <span className="pill pill-ok" style={{ fontSize: 10 }}>
            {slot.selected.length} selected
          </span>
        )}
        {showRemove && (
          <button
            onClick={onRemove}
            title="Remove"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              close
            </span>
          </button>
        )}
      </div>

      {/* Region filter + search row */}
      <div style={{ padding: '8px 10px', display: 'flex', gap: 8 }}>
        <select
          id={`constituency-region-filter-${slot.id}`}
          name={`constituency-region-filter-${slot.id}`}
          value={slot.regionFilter ?? ''}
          onChange={(e) => onChange({ regionFilter: e.target.value || null })}
          style={{ ...selectStyle, flex: '0 0 44%' }}
          disabled={loading}
          aria-label="Filter by region"
        >
          {loading ? (
            <option value="">Loading…</option>
          ) : (
            <>
              <option value="">— All regions —</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </>
          )}
        </select>

        <div style={{ position: 'relative', flex: 1 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            id={`constituency-search-${slot.id}`}
            name={`constituency-search-${slot.id}`}
            type="text"
            placeholder="Search constituencies…"
            value={slot.search}
            onChange={(e) => onChange({ search: e.target.value })}
            style={{
              ...selectStyle,
              width: '100%',
              cursor: 'text',
              paddingLeft: 32,
            }}
            aria-label="Search constituencies"
          />
        </div>
      </div>

      {/* Select / deselect all bar */}
      {!loading && visible.length > 0 && (
        <div
          style={{
            padding: '0 10px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <button
            onClick={allVisibleSelected ? deselectVisible : selectVisible}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 11,
              color: 'hsl(var(--primary))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            {allVisibleSelected ? 'Deselect' : 'Select'} all
            {slot.search ? ' matching' : slot.regionFilter ? ` in ${slot.regionFilter}` : ''}
          </button>
          <span
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {visible.length} constituency{visible.length !== 1 ? 'ies' : ''}
            {slot.regionFilter && !slot.search ? ` in ${slot.regionFilter}` : ''}
          </span>
        </div>
      )}

      {/* Checkbox grid */}
      <div
        style={{
          maxHeight: 200,
          overflowY: 'auto',
          padding: '0 10px 10px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px 16px',
        }}
      >
        {loading ? (
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              gridColumn: '1 / -1',
              margin: '8px 0',
            }}
          >
            Loading constituencies…
          </p>
        ) : visible.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              gridColumn: '1 / -1',
              margin: '8px 0',
            }}
          >
            {slot.search ? 'No matches.' : 'No constituencies found.'}
          </p>
        ) : (
          visible.map((c) => {
            const checkboxId = `constituency-cb-${slot.id}-${c.replace(/\s+/g, '-').toLowerCase()}`
            return (
              <label
                key={c}
                htmlFor={checkboxId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  padding: '3px 0',
                  userSelect: 'none',
                }}
              >
                <input
                  id={checkboxId}
                  name={checkboxId}
                  type="checkbox"
                  checked={slot.selected.includes(c)}
                  onChange={() => toggle(c)}
                  style={{
                    cursor: 'pointer',
                    accentColor: 'hsl(var(--primary))',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "'Public Sans', sans-serif",
                    color: 'hsl(var(--on-surface))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c}
                </span>
              </label>
            )
          })
        )}
      </div>

      {/* Selected pills */}
      {slot.selected.length > 0 && (
        <div
          style={{
            padding: '6px 10px 8px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          {slot.selected.map((c) => (
            <span
              key={c}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 4px 2px 8px',
                background: 'rgba(0,107,63,0.08)',
                color: 'hsl(var(--primary))',
                border: '1px solid rgba(0,107,63,0.2)',
                borderRadius: 'var(--radius-pill)',
                fontSize: 11,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              {c}
              <button
                onClick={() => toggle(c)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                  close
                </span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChapterSlotRow — search + checkbox list for bulk chapter selection
// ---------------------------------------------------------------------------

interface ChapterSlotRowProps {
  slot: ChapterSlot
  allChapters: string[]
  onChange: (updates: Partial<ChapterSlot>) => void
  onRemove: () => void
  showRemove: boolean
}

export function ChapterSlotRow({
  slot,
  allChapters,
  onChange,
  onRemove,
  showRemove,
}: ChapterSlotRowProps) {
  const visible = slot.search
    ? allChapters.filter((c) => c.toLowerCase().includes(slot.search.toLowerCase()))
    : allChapters
  const allVisibleSelected = visible.length > 0 && visible.every((c) => slot.selected.includes(c))
  const loading = allChapters.length === 0

  function toggle(c: string) {
    const next = slot.selected.includes(c)
      ? slot.selected.filter((x) => x !== c)
      : [...slot.selected, c]
    onChange({ selected: next })
  }

  function selectVisible() {
    onChange({ selected: [...new Set([...slot.selected, ...visible])] })
  }

  function deselectVisible() {
    const vs = new Set(visible)
    onChange({ selected: slot.selected.filter((c) => !vs.has(c)) })
  }

  return (
    <div
      style={{
        marginBottom: 10,
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          background: 'hsl(var(--container-low))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 14, color: 'hsl(var(--accent))' }}
        >
          groups
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            fontFamily: "'Public Sans', sans-serif",
            color: 'hsl(var(--on-surface))',
            flex: 1,
          }}
        >
          By chapters
        </span>
        {slot.selected.length > 0 && (
          <span className="pill pill-ok" style={{ fontSize: 10 }}>
            {slot.selected.length} selected
          </span>
        )}
        {showRemove && (
          <button
            onClick={onRemove}
            title="Remove"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              close
            </span>
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            id={`chapter-search-${slot.id}`}
            name={`chapter-search-${slot.id}`}
            type="text"
            placeholder="Search chapters…"
            value={slot.search}
            onChange={(e) => onChange({ search: e.target.value })}
            style={{ ...selectStyle, width: '100%', cursor: 'text', paddingLeft: 32 }}
            aria-label="Search chapters"
          />
        </div>
      </div>

      {/* Select / deselect all bar */}
      {!loading && visible.length > 0 && (
        <div style={{ padding: '0 10px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={allVisibleSelected ? deselectVisible : selectVisible}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 11,
              color: 'hsl(var(--accent))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            {allVisibleSelected ? 'Deselect' : 'Select'} all
            {slot.search ? ' matching' : ''}
          </button>
          <span
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            {visible.length} chapter{visible.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Checkbox grid */}
      <div
        style={{
          maxHeight: 180,
          overflowY: 'auto',
          padding: '0 10px 10px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px 16px',
        }}
      >
        {loading ? (
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              gridColumn: '1 / -1',
              margin: '8px 0',
            }}
          >
            Loading chapters…
          </p>
        ) : visible.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              gridColumn: '1 / -1',
              margin: '8px 0',
            }}
          >
            {slot.search ? 'No matches.' : 'No chapters found.'}
          </p>
        ) : (
          visible.map((c) => {
            const checkboxId = `chapter-cb-${slot.id}-${c.replace(/\s+/g, '-').toLowerCase()}`
            return (
              <label
                key={c}
                htmlFor={checkboxId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  padding: '3px 0',
                  userSelect: 'none',
                }}
              >
                <input
                  id={checkboxId}
                  name={checkboxId}
                  type="checkbox"
                  checked={slot.selected.includes(c)}
                  onChange={() => toggle(c)}
                  style={{
                    cursor: 'pointer',
                    accentColor: 'hsl(var(--accent))',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "'Public Sans', sans-serif",
                    color: 'hsl(var(--on-surface))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c}
                </span>
              </label>
            )
          })
        )}
      </div>

      {/* Selected pills */}
      {slot.selected.length > 0 && (
        <div
          style={{
            padding: '6px 10px 8px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          {slot.selected.map((c) => (
            <span
              key={c}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                padding: '2px 4px 2px 8px',
                background: 'rgba(218,165,32,0.08)',
                color: 'hsl(var(--accent))',
                border: '1px solid rgba(218,165,32,0.25)',
                borderRadius: 'var(--radius-pill)',
                fontSize: 11,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              {c}
              <button
                onClick={() => toggle(c)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                  color: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                  close
                </span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
