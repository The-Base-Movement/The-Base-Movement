import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const selectSt: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 10px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 400,
  fontSize: 12,
  borderRadius: 4,
  color: 'hsl(var(--on-surface))',
  boxSizing: 'border-box',
}

const inputSt: React.CSSProperties = { ...selectSt, cursor: 'text' }

interface MembersFilterSidebarProps {
  search: string
  selectedProfession: string
  isFiltered: boolean
  chapterName?: string | null
  onSearchChange: (value: string) => void
  onProfessionChange: (value: string) => void
  onClearFilters: () => void
}

export function MembersFilterSidebar({
  search,
  selectedProfession,
  isFiltered,
  chapterName,
  onSearchChange,
  onProfessionChange,
  onClearFilters,
}: MembersFilterSidebarProps) {
  const [professions, setProfessions] = useState<string[]>([])

  useEffect(() => {
    if (!chapterName) return
    supabase
      .from('users')
      .select('profession')
      .eq('chapter', chapterName)
      .not('profession', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const unique = Array.from(
          new Set(data.map((r) => (r.profession as string | null)?.trim()).filter(Boolean))
        ).sort() as string[]
        setProfessions(unique)
      })
  }, [chapterName])

  return (
    <aside className="panel" style={{ padding: 0 }}>
      <div className="ph">
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 13,
            color: 'hsl(var(--on-surface))',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
          >
            filter_list
          </span>
          Filters
        </span>
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            aria-label="Search by name"
            name="search"
            id="input-members-search"
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ ...inputSt, paddingLeft: 34, height: 40 }}
          />
        </div>

        <div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface))',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, color: 'hsl(var(--primary))' }}
            >
              work
            </span>
            Profession
          </div>
          <select
            name="selectedProfession"
            id="select-members-profession"
            value={selectedProfession}
            onChange={(e) => onProfessionChange(e.target.value)}
            style={selectSt}
          >
            <option value="all">All professions</option>
            {professions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {isFiltered && (
          <button
            className="btn btn-dest btn-sm"
            style={{ justifyContent: 'center' }}
            onClick={onClearFilters}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              close
            </span>
            Clear filters
          </button>
        )}
      </div>
    </aside>
  )
}
