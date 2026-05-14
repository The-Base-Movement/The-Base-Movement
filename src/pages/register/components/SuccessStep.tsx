import MembershipCard from '@/components/MembershipCard'
import { useNavigate } from 'react-router-dom'
import { useRef } from 'react'
import html2canvas from 'html2canvas'
import type { RegistrationFormData } from '@/types/registration'


interface SuccessStepProps {
  formData: RegistrationFormData
  photoUrl: string | null
  regNumber: string
  onEdit: () => void
}

export function SuccessStep({ formData, photoUrl, regNumber, onEdit }: SuccessStepProps) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)

  const handlePrint = async () => {
    if (!cardRef.current) return
    try {
      const canvas = await html2canvas(cardRef.current, { 
        scale: 4, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      })
      const imgData = canvas.toDataURL('image/png')
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = 'none'
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentWindow?.document
      if (!iframeDoc) return
      iframeDoc.write(`
        <html>
          <head>
            <title>THE BASE - Membership Card</title>
            <style>
              @page { 
                size: 85.6mm 54mm; 
                margin: 0; 
              }
              body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                width: 85.6mm;
                height: 54mm;
                overflow: hidden;
                background: #fff; 
                -webkit-print-color-adjust: exact; 
                color-adjust: exact; 
              }
              img { 
                width: 85.6mm; 
                height: 54mm; 
                display: block; 
                object-fit: contain;
                image-rendering: -webkit-optimize-contrast; 
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" onload="setTimeout(() => { window.print(); }, 200);" />
          </body>
        </html>
      `)
      iframeDoc.close()
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 60000)
    } catch (error) {
      console.error('Error printing card:', error)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 animate-bounce">
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>check_circle</span>
        </div>
        <h1 className="text-3xl font-bold text-on-surface tracking-tighter font-meta mb-2">Registration complete</h1>
        <p className="text-muted-foreground/90 font-meta tracking-tight text-xs">Welcome to the movement, patriot.</p>
      </div>

      <div className="space-y-8">
        <div className="bg-white border border-border/60 p-2 shadow-2xl relative">
          <div className="border-b border-border/40 pb-3 mb-4 px-4 pt-2">
            <h3 className="font-meta font-bold text-micro text-muted-foreground/80 tracking-tight">Official membership card</h3>
          </div>

          <div className="max-w-md mx-auto py-4" ref={cardRef}>
            <MembershipCard
              userName={formData.fullName}
              avatarUrl={photoUrl}
              userRegNo={regNumber}
              initials={formData.fullName.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')}
              gender={formData.gender + ' / ' + formData.ageRange}
              joinedDate={new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              status="Active & Verified"
              region={formData.region}
              constituency={formData.constituency}
              country={formData.country}
              chapter={formData.chapter}
              city={formData.city}
            />
          </div>

          <div className="bg-muted/30 p-6 mt-4 border-t border-border/40">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-meta font-bold text-xs text-on-surface tracking-tight mb-1">Registration number</h4>
                <p className="font-meta font-bold text-xl text-primary tracking-tight">{regNumber}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white font-bold text-sm shadow-md hover:scale-[1.02] active:scale-95 transition-all border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
                  Print card
                </button>
                <button
                  onClick={onEdit}
                  className="flex items-center justify-center gap-2 px-6 py-3 text-stone-500 border border-stone-200 bg-white hover:text-primary hover:bg-stone-50 transition-all active:scale-95 shadow-sm font-bold text-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> Edit info
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-border/60 p-8 shadow-sm">
            <h4 className="font-meta font-bold text-micro text-muted-foreground/80 tracking-tight mb-4">Membership verification</h4>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <p className="text-xs font-bold text-on-surface font-meta tracking-tight">Status: Verified</p>    
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-body-md leading-relaxed">
              Your official records have been synchronized with the movement's hub.
            </p>
          </div>

          <div className="bg-primary text-primary-foreground p-8 flex flex-col justify-between shadow-lg">      
            <div>
              <h4 className="font-meta font-bold text-micro text-primary-foreground/90 tracking-tight mb-4 normal-case">Next step</h4>
              <p className="text-sm font-bold font-meta leading-tight mb-4">Access your portal to join a chapter.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white h-auto p-3 text-center justify-center font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              Enter Overview <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
