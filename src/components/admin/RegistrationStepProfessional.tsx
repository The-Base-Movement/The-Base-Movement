import { educationLevels, emergencyRelationships } from './RegistrationForm.constants'
import type { RegistrationChangeHandler, RegistrationFormData } from './RegistrationForm.types'
import { JobSelector } from '@/components/JobSelector'
import { emptyJobSelection } from '@/services/jobTaxonomyService'

interface RegistrationStepProfessionalProps {
  formData: RegistrationFormData
  isMobile: boolean
  handleChange: RegistrationChangeHandler
  setFields: (partial: Partial<RegistrationFormData>) => void
}

export function RegistrationStepProfessional(props: RegistrationStepProfessionalProps) {
  const { formData, isMobile, handleChange, setFields } = props

  return (
    <div className="space-y-8">
      <div
        style={{
          borderBottom: '2px solid hsl(var(--on-surface))',
          paddingBottom: '16px',
          marginBottom: '32px',
        }}
      >
        <h3
          style={{
            fontSize: '20px',
            fontWeight: 'var(--font-weight-medium, 500)',
            margin: 0,
          }}
        >
          Step 3: Emergency & profession details
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: 'hsl(var(--on-surface-muted))',
            marginTop: '4px',
          }}
        >
          Crucial for member safety and institutional records.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="input-6a8f94"
          style={{
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Emergency contact name{' '}
          <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
            (optional)
          </span>
        </label>
        <input
          aria-label="Full Name"
          name="name-6a8f94"
          id="input-6a8f94"
          placeholder="Full Name"
          value={formData.emergencyContactName}
          onChange={(e) => handleChange('emergencyContactName', e.target.value)}
          style={{
            width: '100%',
            padding: '14px 18px',
            fontSize: '14px',
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
            color: 'hsl(var(--on-surface))',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '32px',
        }}
      >
        <div className="space-y-2">
          <label
            htmlFor="input-6df3eb"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Relationship{' '}
            <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
              (optional)
            </span>
          </label>
          <select
            aria-label="Relationship"
            name="name-6df3eb"
            id="input-6df3eb"
            value={formData.emergencyRelationship}
            onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
            className="reg"
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: '14px',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              color: 'hsl(var(--on-surface))',
            }}
          >
            <option value="">Select</option>
            {emergencyRelationships.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="input-434c82"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Emergency contact number{' '}
            <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
              (optional)
            </span>
          </label>
          <input
            aria-label="Phone number"
            name="name-434c82"
            id="input-434c82"
            type="tel"
            placeholder="Phone number"
            value={formData.emergencyNumber}
            onChange={(e) => handleChange('emergencyNumber', e.target.value)}
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: '14px',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              color: 'hsl(var(--on-surface))',
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          style={{
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          Profession / occupation <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
        </label>
        <JobSelector
          value={formData.job ?? emptyJobSelection}
          onChange={(j) => setFields({ job: j })}
          onLabelChange={(label) => setFields({ profession: label })}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '32px',
        }}
      >
        <div className="space-y-2">
          <label
            htmlFor="select-b50420"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Education level <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <select
            name="name-b50420"
            id="select-b50420"
            required
            value={formData.educationLevel}
            onChange={(e) => handleChange('educationLevel', e.target.value)}
            className="reg"
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: '14px',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            <option value="">Select Level</option>
            {educationLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="input-children-admin"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            No. of children{' '}
            <span style={{ color: 'hsl(var(--on-surface-muted))', textTransform: 'none' }}>
              (optional)
            </span>
          </label>
          <input
            aria-label="Number of children"
            name="name-children-admin"
            id="input-children-admin"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={formData.children_count === 0 ? '' : formData.children_count}
            onChange={(e) => setFields({ children_count: Number(e.target.value || 0) })}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '14px 18px',
              fontSize: '14px',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              color: 'hsl(var(--on-surface))',
            }}
          />
        </div>
      </div>
    </div>
  )
}
