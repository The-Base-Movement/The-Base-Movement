import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface FormControlsProps {
  onBack: () => void
  onPrint: () => void
  formUrl: string | undefined
  platform: string
  watermarkOpacity: number
  onWatermarkOpacityChange: (value: number) => void
}

export function FormControls({
  onBack,
  onPrint,
  platform,
  watermarkOpacity,
  onWatermarkOpacityChange,
}: FormControlsProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    const el = document.getElementById('membership-form-body')
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
      pdf.save(`The_Base_${platform}_Registration_Form.pdf`)
      toast.success('Registration form PDF downloaded')
    } catch (err) {
      console.error('Failed to generate form PDF:', err)
      toast.error('Failed to download PDF form')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-[210mm] mx-auto mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-600 hover:text-stone-900 text-sm font-bold bg-transparent border-none cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_back
        </span>
        Back to Registration
      </button>

      <div className="flex flex-wrap items-center gap-4">
        {/* Watermark Opacity Control Slider */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded shadow-sm">
          <span className="material-symbols-outlined text-stone-500" style={{ fontSize: 16 }}>
            watermark
          </span>
          <span className="text-xs font-semibold text-stone-700 whitespace-nowrap">
            Watermark: {Math.round(watermarkOpacity * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="0.25"
            step="0.01"
            value={watermarkOpacity}
            onChange={(e) => onWatermarkOpacityChange(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-primary"
            title="Adjust Eagle Watermark Opacity"
          />
        </div>

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
          {downloading ? 'Generating PDF…' : `Download ${platform === 'DIASPORA' ? 'Diaspora' : 'Ghana'} PDF`}
        </button>
      </div>
    </div>
  )
}
