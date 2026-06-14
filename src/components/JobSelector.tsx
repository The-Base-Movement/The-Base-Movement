import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import {
  jobTaxonomyService,
  type JobSelection,
  type JobTaxonomy,
} from '@/services/jobTaxonomyService'

interface JobSelectorProps {
  value: JobSelection
  onChange: (next: JobSelection) => void
  /** Show a required asterisk + treat empty as invalid when `error` is supplied. */
  required?: boolean
  /** External validation message to show under the control. */
  error?: string
  idPrefix?: string
  disabled?: boolean
  /** Fires with the human-readable selection (role name or custom title) so the
   *  caller can keep a denormalised `profession` field in sync for display. */
  onLabelChange?: (label: string) => void
}

const OTHER = 'other'

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
 * Dependent Industry → Sub-Category → Job Role selector driven by the approved
 * job taxonomy. Reveals a free-text field when "Other" is chosen. Reusable on
 * the registration form and the profile/settings page.
 */
export function JobSelector({
  value,
  onChange,
  required,
  error,
  idPrefix = 'job',
  disabled,
  onLabelChange,
}: JobSelectorProps) {
  const [tax, setTax] = useState<JobTaxonomy | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let alive = true
    jobTaxonomyService
      .getTaxonomy()
      .then((t) => alive && setTax(t))
      .catch(() => alive && setLoadError(true))
    return () => {
      alive = false
    }
  }, [])

  // Keep the caller's denormalised profession label in sync with the selection.
  useEffect(() => {
    if (!onLabelChange) return
    if (value.isOther) {
      onLabelChange(value.customTitle.trim())
    } else if (value.roleId && tax) {
      onLabelChange(tax.roles.find((r) => r.id === value.roleId)?.name ?? '')
    } else {
      onLabelChange('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.roleId, value.isOther, value.customTitle, tax])

  const subCategories = useMemo(
    () =>
      tax && value.industryId
        ? tax.subCategories.filter((s) => s.industry_id === value.industryId)
        : [],
    [tax, value.industryId]
  )
  const roles = useMemo(
    () =>
      tax && value.subCategoryId
        ? tax.roles.filter((r) => r.sub_category_id === value.subCategoryId)
        : [],
    [tax, value.subCategoryId]
  )

  const star = required ? <span style={{ color: 'hsl(var(--destructive))' }}> *</span> : null

  if (loadError) {
    return (
      <p style={{ fontSize: 13, color: 'hsl(var(--destructive))', margin: 0 }}>
        Couldn’t load the job list. Please refresh and try again.
      </p>
    )
  }

  const loading = !tax
  const selectStyle = (enabled: boolean): CSSProperties => ({
    ...fieldStyle,
    cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.55,
  })

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Industry */}
      <div>
        <label htmlFor={`${idPrefix}-industry`} style={labelStyle}>
          Industry{star}
        </label>
        <select
          id={`${idPrefix}-industry`}
          value={value.industryId ?? ''}
          disabled={disabled || loading}
          style={selectStyle(!disabled && !loading)}
          onChange={(e) => {
            const industryId = e.target.value ? Number(e.target.value) : null
            onChange({
              industryId,
              subCategoryId: null,
              roleId: null,
              isOther: false,
              customTitle: '',
            })
          }}
        >
          <option value="">{loading ? 'Loading…' : 'Select industry'}</option>
          {tax?.industries.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-Category */}
      <div>
        <label htmlFor={`${idPrefix}-subcategory`} style={labelStyle}>
          Sub-Category{star}
        </label>
        <select
          id={`${idPrefix}-subcategory`}
          value={value.subCategoryId ?? ''}
          disabled={disabled || loading || !value.industryId}
          style={selectStyle(!disabled && !loading && !!value.industryId)}
          onChange={(e) => {
            const subCategoryId = e.target.value ? Number(e.target.value) : null
            onChange({ ...value, subCategoryId, roleId: null, isOther: false, customTitle: '' })
          }}
        >
          <option value="">
            {value.industryId ? 'Select sub-category' : 'Choose an industry first'}
          </option>
          {subCategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Job Role */}
      <div>
        <label htmlFor={`${idPrefix}-role`} style={labelStyle}>
          Job Role{star}
        </label>
        <select
          id={`${idPrefix}-role`}
          value={value.isOther ? OTHER : (value.roleId ?? '')}
          disabled={disabled || loading || !value.subCategoryId}
          style={selectStyle(!disabled && !loading && !!value.subCategoryId)}
          onChange={(e) => {
            const v = e.target.value
            if (v === OTHER) {
              onChange({ ...value, roleId: null, isOther: true })
            } else {
              onChange({ ...value, roleId: v ? Number(v) : null, isOther: false, customTitle: '' })
            }
          }}
        >
          <option value="">
            {value.subCategoryId ? 'Select job role' : 'Choose a sub-category first'}
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
          {value.subCategoryId ? <option value={OTHER}>Other (not listed)…</option> : null}
        </select>
      </div>

      {/* Custom title — only when "Other" is selected */}
      {value.isOther && (
        <div>
          <label htmlFor={`${idPrefix}-custom`} style={labelStyle}>
            Your job title{star}
          </label>
          <input
            id={`${idPrefix}-custom`}
            type="text"
            value={value.customTitle}
            disabled={disabled}
            placeholder="Type your actual job title"
            style={fieldStyle}
            onChange={(e) => onChange({ ...value, customTitle: e.target.value })}
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
