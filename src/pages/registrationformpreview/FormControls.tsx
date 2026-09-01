import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface FormControlsProps {
  onBack: () => void
  onPrint: () => void
  formUrl: string | undefined
  platform: string
  /** Print/PDF target. Defaults to the adult membership form. */
  elementId?: string
  /** Overrides the adult filename and button label (Youth Wing form reuses this). */
  fileName?: string
  downloadLabel?: string
  backLabel?: string
}

export function FormControls({
  onBack,
  onPrint,
  platform,
  elementId = 'membership-form-body',
  fileName,
  downloadLabel,
  backLabel = 'Back to Registration',
}: FormControlsProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    const el = document.getElementById(elementId)
    if (!el) {
      toast.error('Form element not found')
      return
    }

    setDownloading(true)
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      const pdfFilename =
        fileName ??
        (platform === 'DIASPORA'
          ? 'Membership Form Base Diaspora _ The Base Movement.pdf'
          : 'Membership Form Base Ghana _ The Base Movement.pdf')
      pdf.save(pdfFilename)
      toast.success('Registration form PDF downloaded')
    } catch (err) {
      console.error('Failed to generate form PDF:', err)
      toast.error('Failed to download PDF form')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-[210mm] mx-auto mb-8 flex items-center justify-between print:hidden">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm font-bold bg-transparent border-none cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_back
        </span>
        {backLabel}
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

        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="inline-flex h-10 items-center justify-center bg-primary px-4 text-sm font-bold text-white hover:opacity-90 transition-opacity gap-2 cursor-pointer border-none"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {downloading ? 'progress_activity' : 'download'}
          </span>
          {downloading
            ? 'Generating PDF…'
            : (downloadLabel ?? `Download ${platform === 'DIASPORA' ? 'Diaspora' : 'Ghana'} PDF`)}
        </button>
      </div>
    </div>
  )
}
