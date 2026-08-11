import { type CSSProperties, useEffect, useState, startTransition, useRef } from 'react'
import {
  jobTaxonomyService,
  type JobRole,
  type JobSubCategory,
  type JobSelection,
} from '@/services/jobTaxonomyService'

export interface JobSelectorOutput {
  job_industry_id: number | null
  job_sub_category_id: number | null
  job_role_id: number | null
  profession: string
  job_custom_title: string | null
}

interface JobSelectorProps {
  value?: JobSelection
  onChange?: (next: JobSelection) => void
  onSelectionChange?: (data: JobSelectorOutput) => void
  required?: boolean
  error?: string
  idPrefix?: string
  disabled?: boolean
  onLabelChange?: (label: string) => void
}

/** A flat role entry enriched with its parent ids for analytics. */
interface FlatRole extends JobRole {
  industry_id: number
}

const fieldStyle: CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 14,
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--card))',
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'hsl(var(--on-surface-muted))',
}

/**
 * Occupation selector — searches actual job roles (Farmer, Hairdresser, etc.)
 * across the full taxonomy. Shows nothing until the user types; results appear
 * as a clickable scrollable list. Selecting a role wires all three FK ids for
 * analytics compatibility.
 */
export function JobSelector({
  value,
  onChange,
  onSelectionChange,
  required,
  error,
  idPrefix = 'job',
  disabled,
  onLabelChange,
}: JobSelectorProps) {
  const [flatRoles, setFlatRoles] = useState<FlatRole[]>([])
  const [subCategories, setSubCategories] = useState<JobSubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    jobTaxonomyService
      .getTaxonomy()
      .then((t) => {
        if (!alive) return
        // Build a flat list of roles enriched with their industry_id via sub_category
        const subMap = new Map<number, JobSubCategory>()
        for (const s of t.subCategories) subMap.set(s.id, s)

        const flat: FlatRole[] = t.roles.map((r) => ({
          ...r,
          industry_id: subMap.get(r.sub_category_id)?.industry_id ?? 0,
        }))
        setFlatRoles(flat)
        setSubCategories(t.subCategories)
        setLoading(false)
      })
      .catch(() => {
        if (alive) {
          setLoadError(true)
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [])

  // Close results when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedRoleId = value?.roleId ?? null
  const customTitle = value?.customTitle ?? ''
  const isOther = value?.isOther ?? false

  // Find the currently selected role for the badge
  const selectedRole = flatRoles.find((r) => r.id === selectedRoleId)

  // Only show results when there's a search query
  const filtered =
    search.trim().length > 0
      ? flatRoles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())).slice(0, 30)
      : []

  const handleRoleSelect = (role: FlatRole) => {
    if (disabled) return
    setSearch('')
    setShowResults(false)

    const nextSelection: JobSelection = {
      industryId: role.industry_id,
      subCategoryId: role.sub_category_id,
      roleId: role.id,
      isOther: false,
      customTitle: '',
    }

    startTransition(() => {
      onChange?.(nextSelection)
      onLabelChange?.(role.name)
      onSelectionChange?.({
        job_industry_id: role.industry_id,
        job_sub_category_id: role.sub_category_id,
        job_role_id: role.id,
        profession: role.name,
        job_custom_title: null,
      })
    })
  }

  const handleSelectOther = () => {
    if (disabled) return
    setSearch('')
    setShowResults(false)

    const nextSelection: JobSelection = {
      industryId: value?.industryId ?? null,
      subCategoryId: value?.subCategoryId ?? null,
      roleId: null,
      isOther: true,
      customTitle: customTitle,
    }

    startTransition(() => {
      onChange?.(nextSelection)
    })
  }

  const handleCustomTitleChange = (newTitle: string) => {
    const nextSelection: JobSelection = {
      industryId: value?.industryId ?? null,
      subCategoryId: value?.subCategoryId ?? null,
      roleId: null,
      isOther: true,
      customTitle: newTitle,
    }
    const label = newTitle.trim() || 'Other'

    startTransition(() => {
      onChange?.(nextSelection)
      onLabelChange?.(label)
      onSelectionChange?.({
        job_industry_id: value?.industryId ?? null,
        job_sub_category_id: value?.subCategoryId ?? null,
        job_role_id: null,
        profession: label,
        job_custom_title: newTitle.trim() || null,
      })
    })
  }

  const star = required ? <span style={{ color: 'hsl(var(--destructive))' }}> *</span> : null

  if (loadError) {
    return (
      <p style={{ fontSize: 13, color: 'hsl(var(--destructive))', margin: 0 }}>
        Couldn't load occupations. Please refresh and try again.
      </p>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 10 }} ref={containerRef}>
      {/* Inline label row: Profession | Occupation */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={labelStyle}>Profession{star}</span>
        <span style={{ ...labelStyle, fontSize: 10, opacity: 0.65 }}>Occupation</span>
      </div>

      {/* Search box */}
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
          id={`${idPrefix}-search`}
          type="text"
          autoComplete="off"
          placeholder={loading ? 'Loading occupations…' : 'Type to search your occupation…'}
          value={search}
          disabled={disabled || loading}
          onChange={(e) => {
            setSearch(e.target.value)
            setShowResults(e.target.value.trim().length > 0)
          }}
          onFocus={() => {
            if (search.trim().length > 0) setShowResults(true)
          }}
          style={{
            ...fieldStyle,
            height: 44,
            paddingLeft: 36,
            fontSize: 13.5,
            opacity: disabled || loading ? 0.55 : 1,
          }}
        />
        {/* Clear button when search has text */}
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setShowResults(false) }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        )}
      </div>

      {/* Selected occupation badge */}
      {(selectedRole || (isOther && customTitle.trim())) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--primary) / 0.08)',
            border: '1px solid hsl(var(--primary) / 0.25)',
            fontSize: 12.5,
            fontWeight: 600,
            color: 'hsl(var(--primary))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            check_circle
          </span>
          {selectedRole ? selectedRole.name : customTitle.trim()}
          <button
            type="button"
            onClick={() => {
              const cleared: JobSelection = { industryId: null, subCategoryId: null, roleId: null, isOther: false, customTitle: '' }
              onChange?.(cleared)
              onLabelChange?.('')
              onSelectionChange?.({ job_industry_id: null, job_sub_category_id: null, job_role_id: null, profession: '', job_custom_title: null })
            }}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'hsl(var(--primary))',
              display: 'flex',
              opacity: 0.7,
            }}
            title="Clear selection"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
          </button>
        </div>
      )}

      {/* Search results dropdown */}
      {showResults && (
        <div
          style={{
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--card))',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {filtered.length === 0 ? (
            <>
              <div
                style={{
                  padding: '12px 14px',
                  fontSize: 12.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  borderBottom: '1px solid hsl(var(--border) / 0.5)',
                }}
              >
                No matches for &ldquo;{search}&rdquo;
              </div>
              <button
                type="button"
                onClick={handleSelectOther}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--on-surface-muted))' }}>
                  edit
                </span>
                Enter my occupation manually
              </button>
            </>
          ) : (
            <>
              {filtered.map((role, idx) => {
                const isSelected = role.id === selectedRoleId
                // Find sub-category name for context hint
                const sub = subCategories.find((s) => s.id === role.sub_category_id)
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '9px 14px',
                      background: isSelected ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                      border: 'none',
                      borderBottom:
                        idx < filtered.length - 1 ? '1px solid hsl(var(--border) / 0.4)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'hsl(var(--container-low))'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    }}
                  >
                    <span>{role.name}</span>
                    {sub && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          fontWeight: 400,
                          marginLeft: 8,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sub.name}
                      </span>
                    )}
                  </button>
                )
              })}
              {/* Always show "Other" as the last option */}
              <button
                type="button"
                onClick={handleSelectOther}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '9px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: '1px solid hsl(var(--border) / 0.5)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: 'hsl(var(--on-surface-muted))',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--container-low))'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  edit
                </span>
                Not listed — enter manually
              </button>
            </>
          )}
        </div>
      )}

      {/* Custom Title Input — rendered when "Other" is selected */}
      {isOther && (
        <div>
          <label
            htmlFor={`${idPrefix}-custom`}
            style={{ ...labelStyle, display: 'block', marginBottom: 6 }}
          >
            Your occupation{star}
          </label>
          <input
            id={`${idPrefix}-custom`}
            type="text"
            value={customTitle}
            disabled={disabled}
            placeholder="e.g., Farmer, Kente Weaver, Graphic Designer…"
            style={fieldStyle}
            onChange={(e) => handleCustomTitleChange(e.target.value)}
            maxLength={120}
            autoFocus
          />
        </div>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--destructive))' }}>{error}</p>
      )}
    </div>
  )
}
