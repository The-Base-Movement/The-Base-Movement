import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Print / PDF pipeline for a credential card, shared by the adult membership
 * card and the Youth Wing card. Both render a hidden full-resolution 520x325
 * capture target and export it at CR80 card size (85.6 x 54 mm).
 */

async function captureCard(captureId: string, scale: number): Promise<HTMLCanvasElement | null> {
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

export async function downloadCardPdf(captureId: string, fileName: string): Promise<void> {
  try {
    const canvas = await captureCard(captureId, 2)
    if (!canvas) return
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 85.6, 54)
    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
  }
}

export async function printCard(captureId: string, documentTitle: string): Promise<void> {
  try {
    const canvas = await captureCard(captureId, 4)
    if (!canvas) return
    const imgData = canvas.toDataURL('image/png')
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none'
    document.body.appendChild(iframe)
    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) return
    iframeDoc.write(
      `<html><head><title>${documentTitle}</title><style>@page{size:85.6mm 54mm;margin:0}body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;width:85.6mm;height:54mm;overflow:hidden;background:#fff;-webkit-print-color-adjust:exact;color-adjust:exact}img{width:85.6mm;height:54mm;display:block;object-fit:contain}</style></head><body><img src="${imgData}" onload="setTimeout(()=>{window.print()},200);"/></body></html>`
    )
    iframeDoc.close()
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe)
    }, 60000)
  } catch (error) {
    console.error('Error printing card:', error)
  }
}

/** Off-screen container styles for the hidden full-resolution capture target. */
export const cardCaptureStyle: React.CSSProperties = {
  position: 'fixed',
  left: '-9999px',
  top: '-9999px',
  width: '520px',
  height: '325px',
  display: 'none',
}
