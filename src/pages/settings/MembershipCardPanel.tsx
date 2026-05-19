import { useRef } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import MembershipCard from '@/components/MembershipCard'

interface Props {
  form: {
    fullName: string
    region: string
    constituency: string
    status: string
    chapter: string
    joinedDate: string
    country: string
    city: string
    gender: string
  }
  avatarUrl: string | null
  userRegNo: string
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function MembershipCardPanel({ form, avatarUrl, userRegNo, onAvatarChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = form.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

  const previewRegNo =
    userRegNo ||
    `TBM-${!form.country || form.country === 'Ghana' ? 'GH' : 'DI'}-${new Date().getFullYear().toString().slice(-2)}XXXX`

  const handleDownload = async () => {
    const captureEl = document.getElementById('membership-card-download-capture')
    if (!captureEl) return
    try {
      captureEl.style.display = 'block'
      const canvas = await html2canvas(captureEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      captureEl.style.display = 'none'
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85.6, 54] })
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54)
      pdf.save(`THE-BASE-CARD-${previewRegNo || 'MEMBER'}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      const el = document.getElementById('membership-card-download-capture')
      if (el) el.style.display = 'none'
    }
  }

  const handlePrint = async () => {
    const captureEl = document.getElementById('membership-card-download-capture')
    if (!captureEl) return
    try {
      captureEl.style.display = 'block'
      const canvas = await html2canvas(captureEl, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
      })
      captureEl.style.display = 'none'
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
      const el = document.getElementById('membership-card-download-capture')
      if (el) el.style.display = 'none'
    }
  }

  return (
    <div className="panel">
      <div className="ph">
        <h3>Membership card</h3>
        <span className="meta">Live preview</span>
      </div>
      <div style={{ padding: 20 }}>
        <div className="mcard-container">
          <MembershipCard
            userName={form.fullName}
            avatarUrl={avatarUrl}
            userRegNo={previewRegNo}
            initials={initials}
            gender={form.gender}
            joinedDate={form.joinedDate}
            status={form.status}
            region={form.region}
            constituency={form.constituency}
            country={form.country}
            city={form.city}
            chapter={form.chapter}
            onPhotoClick={() => fileRef.current?.click()}
          />
        </div>

        {/* Hidden high-res capture target */}
        <div
          id="membership-card-download-capture"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '520px',
            height: '325px',
            display: 'none',
          }}
        >
          <MembershipCard
            userName={form.fullName}
            avatarUrl={avatarUrl}
            userRegNo={previewRegNo}
            initials={initials}
            gender={form.gender}
            joinedDate={form.joinedDate}
            status={form.status}
            region={form.region}
            constituency={form.constituency}
            country={form.country}
            city={form.city}
            chapter={form.chapter}
            isForDownload={true}
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onAvatarChange}
        />
      </div>
      <div
        style={{
          padding: '0 16px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
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
    </div>
  )
}
