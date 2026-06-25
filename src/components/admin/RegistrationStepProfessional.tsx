import { educationLevels } from './RegistrationForm.constants'
import type { RegistrationChangeHandler, RegistrationFormData } from './RegistrationForm.types'

interface RegistrationStepProfessionalProps {
  formData: RegistrationFormData
  isMobile: boolean
  handleChange: RegistrationChangeHandler
}

export function RegistrationStepProfessional(props: RegistrationStepProfessionalProps) {
  const { formData, isMobile, handleChange } = props

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
          Emergency contact name <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
        </label>
        <input
          aria-label="Full Name"
          name="name-6a8f94"
          id="input-6a8f94"
          placeholder="Full Name"
          required
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
            Relationship <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <input
            aria-label="E.g. Spouse, Parent, Brother"
            name="name-6df3eb"
            id="input-6df3eb"
            placeholder="E.g. Spouse, Parent, Brother"
            required
            value={formData.emergencyRelationship}
            onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
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
            Emergency contact number <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <input
            aria-label="Phone number"
            name="name-434c82"
            id="input-434c82"
            type="tel"
            placeholder="Phone number"
            required
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '32px',
        }}
      >
        <div className="space-y-2">
          <label
            htmlFor="input-fcf881"
            style={{
              fontSize: '10px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Profession / occupation <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <input
            aria-label="E.g. Teacher, Nurse, Student"
            name="name-fcf881"
            id="input-fcf881"
            placeholder="E.g. Teacher, Nurse, Student"
            required
            value={formData.profession}
            onChange={(e) => handleChange('profession', e.target.value)}
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
      </div>
    </div>
  )
}
