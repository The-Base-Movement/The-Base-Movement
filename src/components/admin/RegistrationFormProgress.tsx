/**
 * RegistrationFormProgress Component
 * -------------------------------------------------------------
 * Visual step progress bar tracker for the member registration form flow.
 * Provides a responsive layout:
 * - A sticky sidebar on desktop showing each stage with checkmarks and highlighted state
 * - A compact bar track and text summary on mobile screens
 */

interface RegistrationFormProgressProps {
  formStep: number
  isMobile: boolean
}

const STEP_LABELS = [
  'Primary Details',
  'Demographic Info',
  'Emergency & Profession',
  'Final Verification',
]

/**
 * RegistrationFormProgress component definition.
 */
export function RegistrationFormProgress({ formStep, isMobile }: RegistrationFormProgressProps) {
  if (isMobile) {
    return (
      <div
        style={{
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 99,
                background: formStep >= s ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                transition: 'background .2s',
              }}
            />
          ))}
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          Step {formStep} of 4 — {STEP_LABELS[formStep - 1]}
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        height: 'fit-content',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface-muted))',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '24px',
        }}
      >
        Registration progress
      </div>

      <div className="space-y-2">
        {[
          { step: 1, label: 'Primary Details' },
          { step: 2, label: 'Demographic info' },
          { step: 3, label: 'Emergency & Profession' },
          { step: 4, label: 'Final Verification' },
        ].map((item) => (
          <div
            key={item.step}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: formStep === item.step ? 'hsl(var(--container-low))' : 'transparent',
              borderLeft: `4px solid ${
                formStep === item.step ? 'hsl(var(--primary))' : 'transparent'
              }`,
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium, 500)',
                background:
                  formStep >= item.step ? 'hsl(var(--primary))' : 'hsl(var(--container-low))',
                color: formStep >= item.step ? '#fff' : 'hsl(var(--on-surface-muted))',
              }}
            >
              {formStep > item.step ? (
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  check
                </span>
              ) : (
                item.step
              )}
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 'var(--font-weight-medium, 500)',
                color:
                  formStep === item.step
                    ? 'hsl(var(--on-surface))'
                    : 'hsl(var(--on-surface-muted))',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
