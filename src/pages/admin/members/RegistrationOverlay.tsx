import { createPortal } from 'react-dom'
import { DotLoader } from '@/components/states'
import RegistrationForm, { type RegistrationSubmission } from '@/components/admin/RegistrationForm'
import { toast } from 'sonner'

const isMobileOverlay = () => window.innerWidth < 768

interface RegistrationOverlayProps {
  isSubmitting: boolean
  onClose: () => void
  onSubmitData: (data: RegistrationSubmission) => Promise<void>
}

export function RegistrationOverlay({
  isSubmitting,
  onClose,
  onSubmitData,
}: RegistrationOverlayProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: isMobileOverlay() ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobileOverlay() ? '8px' : '16px',
        background: 'rgba(15,19,16,.6)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
      }}
    >
      <RegistrationForm
        onClose={onClose}
        onSuccess={() => {
          onClose()
          toast.success('Identity successfully registered in the database.')
        }}
        onSubmitData={onSubmitData}
      />
      {isSubmitting && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 110,
            background: 'rgba(255,255,255,.7)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DotLoader label="Finalizing registration…" />
        </div>
      )}
    </div>,
    document.body
  )
}
