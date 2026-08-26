import { useId } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import MembershipCard from './MembershipCard'

type CardProps = Omit<React.ComponentProps<typeof MembershipCard>, 'isForDownload'>

interface Props {
  cardProps: CardProps
  regNo?: string
  style?: React.CSSProperties
}

/** Download PDF + Print buttons for a MembershipCard, with a hidden full-res
 * capture target used by both actions. Shared by the dashboard card and the
 * settings page's live-preview panel so the export logic lives in one place. */
export function MembershipCardActions({ cardProps, regNo, style }: Props) {
  const captureId = `membership-card-capture-${useId()}`

  const captureCard = async (scale: number) => {
    const el = document.getElementById(captureId)
    if (!el) return null
    el.style.display = 'block'
    try {
      return await html2canvas(el, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
    } finally {
      el.style.display = 'none'
    }
  }

  const handleDownload = async () => {
    try {
      const canvas = await captureCard(2)
      if (!canvas) return
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54)
      pdf.save(`THE-BASE-CARD-${regNo || 'MEMBER'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const handlePrint = async () => {
    try {
      const canvas = await captureCard(4)
      if (!canvas) return
      const imgData = canvas.toDataURL('image/png')
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) return
      iframeDoc.write(
        `<html><head><title>THE BASE - Official Membership Card</title><style>@page{size:85.6mm 54mm;margin:0}body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;width:85.6mm;height:54mm;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;color-adjust:exact}img{width:85.6mm;height:54mm;display:block;object-fit:contain}</style></head><body><img src="${imgData}" onload="setTimeout(()=>{window.print()},200);"/></body></html>`
      )
      iframeDoc.close()
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe)
      }, 60000)
    } catch (error) {
      console.error('Error printing card:', error)
    }
  }

  return (
    <>
      <div
        id={captureId}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '520px',
          height: '325px',
          display: 'none',
        }}
      >
        <MembershipCard {...cardProps} isForDownload />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          ...style,
        }}
      >
        <button
          className="btn btn-outline btn-sm"
          onClick={handlePrint}
          style={{ justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            print
          </span>
          Print card
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleDownload}
          style={{ justifyContent: 'center' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            download
          </span>
          Download PDF
        </button>
      </div>
    </>
  )
}
