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

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'hsl(var(--on-surface-muted))',
  marginBottom: 6,
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

/**
 * Streamlined single-tier top-level Industry / Sector selector.
 * Reduces registration friction while maintaining 100% analytics compatibility.
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

  const handleSectorChange = (industryIdStr: string) => {
    const indId = industryIdStr ? Number(industryIdStr) : null
    const sector = industries.find((i) => i.id === indId)
    const checkIsOther = sector ? sector.name.toLowerCase().includes('other') : false

    const nextSelection: JobSelection = {
      industryId: indId,
      subCategoryId: null,
      roleId: null,
      isOther: checkIsOther,
      customTitle: checkIsOther ? customTitle : '',
    }

    const label = checkIsOther ? (customTitle.trim() || 'Other') : (sector?.name || '')

    startTransition(() => {
      onChange?.(nextSelection)
      onLabelChange?.(label)
      onSelectionChange?.({
        job_industry_id: indId,
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
        Couldn’t load the industry list. Please refresh and try again.
      </p>
    )
  }

  const selectStyle: CSSProperties = {
    ...fieldStyle,
    cursor: !disabled && !loading ? 'pointer' : 'not-allowed',
    opacity: !disabled && !loading ? 1 : 0.55,
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Industry / Sector Dropdown */}
      <div>
        <label htmlFor={`${idPrefix}-industry`} style={labelStyle}>
          Occupation / Primary Industry{star}
        </label>
        <select
          id={`${idPrefix}-industry`}
          value={selectedIndustryId ?? ''}
          disabled={disabled || loading}
          style={selectStyle}
          onChange={(e) => handleSectorChange(e.target.value)}
        >
          <option value="">{loading ? 'Loading industries…' : '-- Select Industry / Sector --'}</option>
          {industries.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Title Input — rendered when "Other" is selected */}
      {isOther && (
        <div>
          <label htmlFor={`${idPrefix}-custom`} style={labelStyle}>
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
