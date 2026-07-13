import { Link } from 'react-router-dom'

interface PhysicalSuccessStepProps {
  onUploadAnother: () => void
}

export function PhysicalSuccessStep({ onUploadAnother }: PhysicalSuccessStepProps) {
  return (
    <div className="max-w-[480px] w-full auth-frame p-10 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined" style={{ fontSize: 40 }}>
          check_circle
        </span>
      </div>
      <h2 className="text-2xl font-semibold text-on-surface mb-3 tracking-tight">
        Form Received, Compatriot!
      </h2>
      <p className="text-[14px] text-on-surface-muted leading-relaxed mb-8">
        Your physical registration form has been securely uploaded to the Command Center. Our admin
        team will verify the details and contact you via phone/email once your account is activated.
      </p>
      <div className="space-y-4">
        <Link
          to="/"
          className="block w-full py-4 bg-primary text-white font-medium uppercase tracking-widest text-[12px] rounded-sm hover:opacity-90 transition-all"
        >
          Return Home
        </Link>
        <button
          onClick={onUploadAnother}
          className="w-full text-xs font-medium bg-transparent border-none cursor-pointer text-on-surface-muted hover:text-on-surface transition-colors py-2"
        >
          Upload Another Form
        </button>
      </div>
    </div>
  )
}
