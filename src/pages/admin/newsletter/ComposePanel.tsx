import { useRef, useState, useEffect, useId } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import type { AudienceFilter, AudienceType } from '@/services/newsletterService'
import { newsletterService, formatRecipientCount } from '@/services/newsletterService'
import { useIsDarkTheme } from '@/hooks/useIsDarkTheme'

// ---------------------------------------------------------------------------
// Slot types — one slot = one row in the UI; constituency slot = N filters
// ---------------------------------------------------------------------------

interface SimpleSlot {
  id: string
  type: 'simple'
  filter: AudienceFilter
}

interface ConstituencySlot {
  id: string
  type: 'constituency'
  regionFilter: string | null
  search: string
  selected: string[]
}

interface ChapterSlot {
  id: string
  type: 'chapter'
  search: string
  selected: string[]
}

type FilterSlot = SimpleSlot | ConstituencySlot | ChapterSlot

interface RegionsData {
  regions: string[]
  byRegion: Record<string, string[]>
  allConstituencies: string[]
}

function deriveFilters(slots: FilterSlot[]): AudienceFilter[] {
  return slots.flatMap((slot): AudienceFilter[] => {
    if (slot.type === 'simple') return [slot.filter]
    if (slot.type === 'constituency')
      return slot.selected.map((c) => ({ type: 'constituency', value: c }))
    return slot.selected.map((c) => ({ type: 'chapter', value: c }))
  })
}

function slotsComplete(slots: FilterSlot[]): boolean {
  if (slots.length === 0) return false
  return slots.every((slot) => {
    if (slot.type === 'simple') return slot.filter.type === 'all' || slot.filter.value !== null
    return slot.selected.length > 0
  })
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const selectStyle: React.CSSProperties = {
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

function SimpleFilterRow({
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

function ConstituencySlotRow({
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

function ChapterSlotRow({
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

// ---------------------------------------------------------------------------
// ComposePanel
// ---------------------------------------------------------------------------

interface ComposePanelProps {
  isSending: boolean
  onSend: (subject: string, bodyHtml: string, filters: AudienceFilter[]) => void
  onSchedule: (
    subject: string,
    bodyHtml: string,
    filters: AudienceFilter[],
    scheduledAt: string
  ) => void
}

export function ComposePanel({ isSending, onSend, onSchedule }: ComposePanelProps) {
  const isDark = useIsDarkTheme()
  const editorRef = useRef<{ getContent: () => string } | null>(null)
  const [subject, setSubject] = useState('')
  const [slots, setSlots] = useState<FilterSlot[]>([
    { id: uid(), type: 'simple', filter: { type: 'all', value: null } },
  ])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [allRegions, setAllRegions] = useState<string[]>([])
  const [regionsData, setRegionsData] = useState<RegionsData | null>(null)
  const [allChapters, setAllChapters] = useState<string[]>([])
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  // Pre-fetch reference data for slot pickers
  useEffect(() => {
    let cancelled = false
    Promise.all([
      newsletterService.getAudienceOptions('region'),
      newsletterService.getRegionsWithConstituencies(),
      newsletterService.getAudienceOptions('chapter'),
    ])
      .then(([regions, rData, chapters]) => {
        if (!cancelled) {
          setAllRegions(regions)
          setRegionsData(rData)
          setAllChapters(chapters)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const filters = deriveFilters(slots)
  const filtersComplete = slotsComplete(slots)
  const isAllMode =
    slots.length === 1 && slots[0].type === 'simple' && slots[0].filter.type === 'all'
  const hasConstituencySlot = slots.some((s) => s.type === 'constituency')
  const hasChapterSlot = slots.some((s) => s.type === 'chapter')

  // Recipient count — batch constituency queries into one DB call
  useEffect(() => {
    if (!filtersComplete) return
    let cancelled = false
    const derived = deriveFilters(slots)
    if (derived.length === 0) return

    const constituencyValues = derived
      .filter((f) => f.type === 'constituency' && f.value)
      .map((f) => f.value as string)
    const chapterValues = derived
      .filter((f) => f.type === 'chapter' && f.value)
      .map((f) => f.value as string)
    const otherFilters = derived.filter((f) => f.type !== 'constituency' && f.type !== 'chapter')

    Promise.all([
      constituencyValues.length > 0
        ? newsletterService.getRecipientCountForConstituencies(constituencyValues)
        : Promise.resolve(0),
      chapterValues.length > 0
        ? newsletterService.getRecipientCountForChapters(chapterValues)
        : Promise.resolve(0),
      ...otherFilters.map((f) =>
        newsletterService.getRecipientCount(f.type as Exclude<AudienceType, 'multi'>, f.value)
      ),
    ])
      .then((counts) => {
        if (!cancelled) setTotalCount(counts.reduce((a, b) => a + b, 0))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [slots, filtersComplete])

  function updateSimpleSlot(id: string, filter: AudienceFilter) {
    setSlots((prev) => prev.map((s) => (s.id === id && s.type === 'simple' ? { ...s, filter } : s)))
  }

  function updateConstituencySlot(id: string, updates: Partial<ConstituencySlot>) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id && s.type === 'constituency' ? { ...s, ...updates } : s))
    )
  }

  function updateChapterSlot(id: string, updates: Partial<ChapterSlot>) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id && s.type === 'chapter' ? { ...s, ...updates } : s))
    )
  }

  function removeSlot(id: string) {
    setSlots((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (next.length === 0)
        return [{ id: uid(), type: 'simple', filter: { type: 'all', value: null } }]
      return next
    })
  }

  function addSimpleSlot() {
    setSlots((prev) => [
      ...prev,
      { id: uid(), type: 'simple', filter: { type: 'region', value: null } },
    ])
  }

  function addConstituencySlot() {
    setSlots((prev) => {
      const without = prev.filter((s) => !(s.type === 'simple' && s.filter.type === 'all'))
      return [
        ...without,
        { id: uid(), type: 'constituency', regionFilter: null, search: '', selected: [] },
      ]
    })
  }

  function addChapterSlot() {
    setSlots((prev) => {
      const without = prev.filter((s) => !(s.type === 'simple' && s.filter.type === 'all'))
      return [...without, { id: uid(), type: 'chapter', search: '', selected: [] }]
    })
  }

  function handleSend() {
    const body = editorRef.current?.getContent() ?? ''
    onSend(subject, body, filters)
  }

  function handleSchedule() {
    const body = editorRef.current?.getContent() ?? ''
    onSchedule(subject, body, filters, new Date(scheduledAt).toISOString())
  }

  const scheduledAtValid = scheduleMode ? scheduledAt.length > 0 : true

  const canSend =
    !isSending &&
    subject.trim().length > 0 &&
    filtersComplete &&
    filters.length > 0 &&
    (totalCount === null || totalCount > 0) &&
    scheduledAtValid

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'hsl(var(--on-surface-muted))',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
    fontFamily: "'Public Sans', sans-serif",
  }

  const addBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    fontSize: 12,
    color: 'hsl(var(--primary))',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  return (
    <div className="panel" style={{ padding: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, paddingRight: 60 }}>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Compose newsletter
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Sent via SendGrid · wrapped in branded template
          </p>
        </div>
        <img
          src="/brand/icons/loudspeaker.png"
          alt=""
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: '100%',
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
            objectFit: 'contain',
          }}
        />
      </div>

      <div className="compose-body">
        {/* Subject */}
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="newsletter-compose-subject" style={labelStyle}>
            Subject
          </label>
          <input
            id="newsletter-compose-subject"
            name="newsletter-compose-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Movement update — June 2026"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--background))',
              outline: 'none',
            }}
          />
        </div>

        {/* Audience slots */}
        <div style={{ marginBottom: 6 }}>
          <label style={labelStyle}>
            Audience{filters.length > 1 ? ` (${filters.length} targets)` : ''}
          </label>

          {slots.map((slot) =>
            slot.type === 'simple' ? (
              <SimpleFilterRow
                key={slot.id}
                filter={slot.filter}
                preloadedOptions={slot.filter.type === 'region' ? allRegions : undefined}
                onChange={(f) => updateSimpleSlot(slot.id, f)}
                onRemove={() => removeSlot(slot.id)}
                showRemove={slots.length > 1}
              />
            ) : slot.type === 'constituency' ? (
              <ConstituencySlotRow
                key={slot.id}
                slot={slot}
                regions={regionsData?.regions ?? []}
                byRegion={regionsData?.byRegion ?? {}}
                allConstituencies={regionsData?.allConstituencies ?? []}
                onChange={(updates) => updateConstituencySlot(slot.id, updates)}
                onRemove={() => removeSlot(slot.id)}
                showRemove={slots.length > 1}
              />
            ) : (
              <ChapterSlotRow
                key={slot.id}
                slot={slot}
                allChapters={allChapters}
                onChange={(updates) => updateChapterSlot(slot.id, updates)}
                onRemove={() => removeSlot(slot.id)}
                showRemove={slots.length > 1}
              />
            )
          )}

          {/* Add buttons */}
          <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>
            {!isAllMode && (
              <button onClick={addSimpleSlot} style={addBtnStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  add
                </span>
                Add audience
              </button>
            )}
            {!hasConstituencySlot && (
              <button onClick={addConstituencySlot} style={addBtnStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  add_location_alt
                </span>
                Select constituencies
              </button>
            )}
            {!hasChapterSlot && (
              <button onClick={addChapterSlot} style={addBtnStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  group_add
                </span>
                Select chapters
              </button>
            )}
          </div>
        </div>

        {/* Recipient count */}
        {filtersComplete && totalCount !== null && (
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 14,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}
            >
              people
            </span>
            ~{formatRecipientCount(totalCount)}
            {filters.length > 1 && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>(duplicates removed at send time)</span>
            )}
          </p>
        )}

        {/* TinyMCE body */}
        <div style={{ marginBottom: 18, marginTop: 14 }}>
          <label htmlFor="newsletter-compose-body" style={labelStyle}>
            Body
          </label>
          <Editor
            id="newsletter-compose-body"
            textareaName="newsletter-compose-body"
            key={isDark ? 'dark' : 'light'}
            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
            onInit={(_, editor) => {
              editorRef.current = editor
            }}
            initialValue=""
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist',
                'autolink',
                'lists',
                'link',
                'charmap',
                'searchreplace',
                'wordcount',
              ],
              toolbar:
                'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link | removeformat',
              statusbar: false,
              content_style: isDark
                ? 'body { font-family: "Public Sans", sans-serif; font-size:14px; color:#f1f5f9; line-height:1.65; background:#0f1110; }'
                : 'body { font-family: "Public Sans", sans-serif; font-size:14px; color:#1f2520; line-height:1.65; background:white; }',
              skin: isDark ? 'oxide-dark' : 'oxide',
              content_css: isDark ? 'dark' : 'default',
              branding: false,
            }}
          />
        </div>

        {/* Send / Schedule row */}
        <div className="newsletter-send-row">
          {/* Mode toggle */}
          <div
            style={{
              display: 'flex',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setScheduleMode(false)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                border: 'none',
                cursor: 'pointer',
                background: !scheduleMode ? 'hsl(var(--primary))' : 'transparent',
                color: !scheduleMode ? '#fff' : 'hsl(var(--on-surface))',
              }}
            >
              Send now
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode(true)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                border: 'none',
                borderLeft: '1px solid hsl(var(--border))',
                cursor: 'pointer',
                background: scheduleMode ? 'hsl(var(--accent))' : 'transparent',
                color: scheduleMode ? '#fff' : 'hsl(var(--on-surface))',
              }}
            >
              Schedule
            </button>
          </div>

          {/* Datetime picker (schedule mode only) */}
          {scheduleMode && (
            <input
              id="newsletter-compose-scheduled-at"
              name="newsletter-compose-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--background))',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              aria-label="Scheduled date and time"
            />
          )}

          {/* Action button */}
          {scheduleMode ? (
            <button
              className="btn btn-accent"
              onClick={handleSchedule}
              disabled={!canSend}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                schedule_send
              </span>
              Schedule newsletter
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={!canSend}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                send
              </span>
              {isSending ? 'Sending…' : 'Send newsletter'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
