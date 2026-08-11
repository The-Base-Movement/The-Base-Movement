import { type CSSProperties, useEffect, useState, startTransition } from 'react'
import {
  jobTaxonomyService,
  type JobIndustry,
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
 * Streamlined single-tier top-level Industry / Sector selector.
 * Renders a search-filtered scrollable clickable list instead of a native
 * <select> dropdown to reduce mobile friction.
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
  const [industries, setIndustries] = useState<JobIndustry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let alive = true
    jobTaxonomyService
      .getTaxonomy()
      .then((t) => {
        if (alive) {
          setIndustries(t.industries || [])
          setLoading(false)
        }
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

  const selectedIndustryId = value?.industryId ?? null
  const customTitle = value?.customTitle ?? ''
  const isOther = value?.isOther ?? false

  const filtered = industries.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSectorSelect = (industry: JobIndustry) => {
    if (disabled) return
    const checkIsOther = industry.name.toLowerCase().includes('other')
    const nextSelection: JobSelection = {
      industryId: industry.id,
      subCategoryId: null,
      roleId: null,
      isOther: checkIsOther,
      customTitle: checkIsOther ? customTitle : '',
    }
    const label = checkIsOther ? (customTitle.trim() || 'Other') : industry.name

    startTransition(() => {
      onChange?.(nextSelection)
      onLabelChange?.(label)
      onSelectionChange?.({
        job_industry_id: industry.id,
        job_sub_category_id: null,
        job_role_id: null,
        profession: label,
        job_custom_title: checkIsOther ? (customTitle.trim() || null) : null,
      })
    })
  }

  const handleCustomTitleChange = (newTitle: string) => {
    const nextSelection: JobSelection = {
      industryId: selectedIndustryId,
      subCategoryId: null,
      roleId: null,
      isOther: true,
      customTitle: newTitle,
    }
    const label = newTitle.trim() || 'Other'

    startTransition(() => {
      onChange?.(nextSelection)
      onLabelChange?.(label)
      onSelectionChange?.({
        job_industry_id: selectedIndustryId,
        job_sub_category_id: null,
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
        Couldn't load the industry list. Please refresh and try again.
      </p>
    )
  }

  const selectedIndustry = industries.find((i) => i.id === selectedIndustryId)

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {/* Two-column label row: Profession | Occupation / Primary Industry */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={labelStyle}>Profession{star}</span>
        <span style={{ ...labelStyle, color: 'hsl(var(--on-surface-muted) / 0.7)', fontSize: 10 }}>
          Occupation / Primary Industry
        </span>
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
          placeholder={loading ? 'Loading industries…' : 'Search sector or industry…'}
          value={search}
          disabled={disabled || loading}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...fieldStyle,
            height: 40,
            paddingLeft: 34,
            fontSize: 13,
            opacity: disabled || loading ? 0.55 : 1,
          }}
        />
      </div>

      {/* Selected value badge */}
      {selectedIndustry && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--primary) / 0.1)',
            border: '1px solid hsl(var(--primary) / 0.3)',
            fontSize: 12,
            fontWeight: 600,
            color: 'hsl(var(--primary))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            check_circle
          </span>
          {selectedIndustry.name}
        </div>
      )}

      {/* Scrollable industry list */}
      <div
        style={{
          maxHeight: 210,
          overflowY: 'auto',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius-sm)',
          background: 'hsl(var(--card))',
          opacity: disabled ? 0.55 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      >
        {loading && (
          <div
            style={{
              padding: '16px 12px',
              textAlign: 'center',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Loading industries…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              padding: '16px 12px',
              textAlign: 'center',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            No results for &ldquo;{search}&rdquo;
          </div>
        )}
        {!loading &&
          filtered.map((industry, idx) => {
            const isSelected = industry.id === selectedIndustryId
            return (
              <button
                key={industry.id}
                type="button"
                onClick={() => handleSectorSelect(industry)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  background: isSelected ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                  border: 'none',
                  borderBottom:
                    idx < filtered.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: 13,
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
                <span>{industry.name}</span>
                {isSelected && (
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    check
                  </span>
                )}
              </button>
            )
          })}
      </div>

      {/* Custom Title Input — rendered when "Other" is selected */}
      {isOther && (
        <div>
          <label
            htmlFor={`${idPrefix}-custom`}
            style={{ ...labelStyle, display: 'block', marginBottom: 6 }}
          >
            Please specify your job title{star}
          </label>
          <input
            id={`${idPrefix}-custom`}
            type="text"
            value={customTitle}
            disabled={disabled}
            placeholder="e.g., Kente Weaver, Graphic Designer..."
            style={fieldStyle}
            onChange={(e) => handleCustomTitleChange(e.target.value)}
            maxLength={120}
          />
        </div>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--destructive))' }}>{error}</p>
      )}
    </div>
  )
}
