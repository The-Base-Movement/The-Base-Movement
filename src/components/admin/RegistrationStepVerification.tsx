import type { Dispatch, SetStateAction } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

interface RegistrationStepVerificationProps {
  photoUrl: string | null
  crop: { x: number; y: number }
  zoom: number
  agreed: boolean
  isMobile: boolean
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCropComplete: (_croppedArea: Area, croppedAreaPixels: Area) => void
  setCrop: Dispatch<SetStateAction<{ x: number; y: number }>>
  setZoom: Dispatch<SetStateAction<number>>
  setAgreed: Dispatch<SetStateAction<boolean>>
  setPhotoUrl: Dispatch<SetStateAction<string | null>>
}

export function RegistrationStepVerification(props: RegistrationStepVerificationProps) {
  const {
    photoUrl,
    crop,
    zoom,
    agreed,
    handlePhotoUpload,
    onCropComplete,
    setCrop,
    setZoom,
    setAgreed,
    setPhotoUrl,
  } = props

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
          Step 4: Final verification
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: 'hsl(var(--on-surface-muted))',
            marginTop: '4px',
          }}
        >
          Identity confirmation and oath of commitment.
        </p>
      </div>

      <div className="space-y-4">
        <label
          style={{
            fontSize: '10px',
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Passport photo <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
        </label>

        {!photoUrl ? (
          <div
            style={{
              border: '2px dashed hsl(var(--border))',
              padding: '60px',
              textAlign: 'center',
              background: 'hsl(var(--container-low))',
              position: 'relative',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            <input
              type="file"
              accept="image/*"
              aria-label="Upload profile photo"
              onChange={handlePhotoUpload}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                width: '60px',
                height: '60px',
                background: 'hsla(var(--primary), 0.1)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '32px', color: 'hsl(var(--primary))' }}
              >
                upload
              </span>
            </div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Click to upload passport photo
            </p>
          </div>
        ) : (
          <div
            className="panel"
            style={{ padding: '24px', background: 'hsl(var(--container-low))' }}
          >
            <div
              style={{
                position: 'relative',
                height: '400px',
                width: '100%',
                background: 'hsl(var(--container-low))',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              <Cropper
                image={photoUrl}
                crop={crop}
                zoom={zoom}
                aspect={3 / 4}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginTop: '24px',
              }}
            >
              <input
                name="zoom"
                id="input-d97898"
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'hsl(var(--primary))' }}
              />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="ico no"
                style={{ width: '40px', height: '40px' }}
                title="Remove photo"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: 'var(--font-weight-medium, 500)',
                textAlign: 'center',
                marginTop: '16px',
              }}
            >
              Position the face within the frame
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'hsl(var(--container-low))',
          color: 'hsl(var(--on-surface))',
          padding: '32px',
          marginTop: '40px',
          borderLeft: '8px solid hsl(var(--primary))',
          borderRadius: 'var(--radius-sm)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <h5
          style={{
            color: 'hsl(var(--accent))',
            marginBottom: '12px',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          The Base declaration
        </h5>
        <p
          style={{
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '24px',
          }}
        >
          I hereby declare that the information provided is accurate to the best of my knowledge. I
          commit to uphold the core values of <strong>THE BASE</strong>: Patriotism, Honesty, and
          Discipline and pledge to advance the cause of{' '}
          <strong style={{ color: 'hsl(var(--accent))' }}>GHANA FIRST</strong> in all my actions.
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <input
            name="name-698fba"
            type="checkbox"
            id="privacy"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{
              marginTop: '4px',
              width: '20px',
              height: '20px',
              accentColor: 'hsl(var(--primary))',
            }}
          />
          <label
            htmlFor="privacy"
            style={{
              fontSize: '13px',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
            }}
          >
            I accept this declaration on behalf of the member and agree to the{' '}
            <span style={{ color: 'hsl(var(--accent))', textDecoration: 'underline' }}>
              Privacy Policy
            </span>{' '}
            <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
        </div>
      </div>
    </div>
  )
}
