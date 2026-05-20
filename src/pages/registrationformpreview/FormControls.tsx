interface FormControlsProps {
  onBack: () => void
  onPrint: () => void
  formUrl: string | undefined
  platform: string
}

export function FormControls({ onBack, onPrint, formUrl, platform }: FormControlsProps) {
  return (
    <div className="max-w-[210mm] mx-auto mb-8 flex items-center justify-between print:hidden">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm font-bold bg-transparent border-none cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_back
        </span>
        Back to Registration
      </button>
      <div className="flex items-center gap-4">
        <button
          onClick={onPrint}
          className="flex items-center gap-2 h-10 px-4 border border-stone-200 text-stone-600 hover:text-brand-green hover:bg-stone-50 transition-all active:scale-95 shadow-sm text-sm font-bold bg-white cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            print
          </span>
          Print Form
        </button>
        <a
          href={formUrl || '#'}
          download={`The_Base_${platform}_Registration_Form.pdf`}
          className="inline-flex h-10 items-center justify-center bg-primary px-4 text-sm font-bold text-white hover:opacity-90 transition-opacity gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            download
          </span>
          Download {platform === 'DIASPORA' ? 'Diaspora' : 'Ghana'} PDF
        </a>
      </div>
    </div>
  )
}
