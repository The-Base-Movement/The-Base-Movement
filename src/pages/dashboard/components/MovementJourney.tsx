import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { adminService } from '@/services/adminService'
import { donationService } from '@/services/donationService'
import { format } from 'date-fns'

interface Step {
  title: string
  date: string
  status: 'Complete' | 'In progress' | 'Up next' | 'Verified'
  type: 'c' | 'd' | 't' // c = completed, d = active/in-progress, t = upcoming
}

export function MovementJourney() {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchJourney() {
      try {
        const regNo = localStorage.getItem('userRegNo')
        if (!regNo) {
          setLoading(false)
          return
        }

        const member = await adminService.getMemberProfile(regNo)
        if (!member) {
          setLoading(false)
          return
        }

        // 1. Account Created
        const journeySteps: Step[] = [
          { 
            title: 'Account created', 
            date: member.joined || 'N/A', 
            status: 'Complete', 
            type: 'c' 
          }
        ]

        // 2. ID Verified
        const isVerified = member.status === 'Approved'
        journeySteps.push({
          title: 'ID verified',
          date: isVerified ? 'Verified' : 'Pending',
          status: isVerified ? 'Verified' : 'In progress',
          type: isVerified ? 'c' : 'd'
        })

        // 3. First contribution
        const donations = await donationService.getMemberDonations(member.phone || '')
        const hasDonated = donations.length > 0
        journeySteps.push({
          title: 'First contribution',
          date: hasDonated ? format(new Date(donations[0].date), 'dd MMM yyyy') : 'Pending',
          status: hasDonated ? 'Complete' : (isVerified ? 'In progress' : 'Up next'),
          type: hasDonated ? 'c' : (isVerified ? 'd' : 't')
        })

        // 4. Join a Chapter
        const hasChapter = !!member.chapter && member.chapter !== 'TBM Ghana Chapter'
        journeySteps.push({
          title: 'Join local chapter',
          date: hasChapter ? member.chapter! : 'Up next',
          status: hasChapter ? 'Complete' : (hasDonated ? 'In progress' : 'Up next'),
          type: hasChapter ? 'c' : (hasDonated ? 'd' : 't')
        })

        setSteps(journeySteps)
      } catch (error) {
        console.error('Error fetching journey:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJourney()
  }, [])

  return (
    <div className="card card-pad road bg-white border border-border rounded-[4px] p-6">
      <h3 className="font-meta text-[14px] font-extrabold tracking-tight text-on-surface mb-[14px]">My movement journey</h3>
      {loading ? (
        <div className="py-10 text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[12px] font-bold text-on-surface/40 uppercase tracking-[.06em] font-meta">Analyzing Journey...</p>
        </div>
      ) : (
        <div className="steps-container pt-2">
          {steps.map((step, i) => (
            <div key={i} className="step animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="side">
                <div className={cn("dot", step.type === 'c' ? 'complete' : step.type === 'd' ? 'active' : 'upcoming')}>
                  {step.type === 'd' && <div className="inner-dot" />}
                </div>
                {i < steps.length - 1 && <div className="line" />}
              </div>
              <div className="body pb-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <b className="font-meta font-extrabold text-[13px] tracking-tight text-on-surface">{step.title}</b>
                    <span className="text-[11px] text-on-surface-muted block mt-0.5">{step.date}</span>
                  </div>
                  <span className={cn(
                    "pill font-meta font-bold uppercase tracking-tight text-[9px] px-2 py-0.5 rounded-full border",
                    step.status === 'Complete' || step.status === 'Verified' ? "bg-brand-green/10 text-brand-green border-brand-green/20" : 
                    step.status === 'In progress' ? "bg-brand-gold/10 text-brand-gold border-brand-gold/20" : "bg-on-surface/5 text-on-surface/40 border-on-surface/10"
                  )}>
                    {step.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .steps-container { position: relative; }
        .step { display: grid; grid-template-columns: 24px 1fr; gap: 12px; }
        .step .side { display: flex; flex-direction: column; align-items: center; }
        .step .dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--dot-color); background: #fff; z-index: 1; margin-top: 4px; position: relative; }
        .step .dot.complete { border-color: var(--brand-gold); background: var(--brand-gold); }
        .step .dot.active { border-color: var(--brand-green); background: #fff; }
        .step .dot.active .inner-dot { position: absolute; inset: 2px; background: var(--brand-green); border-radius: 50%; }
        .step .dot.upcoming { border-color: var(--border); background: #fff; }
        
        .step .line { width: 1px; flex: 1; background: var(--border); margin: 4px 0; }
        
        .step .body b { display: block; font-family: 'Public Sans', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: -0.01em; }
        .pill { font-family: 'Public Sans', sans-serif; }
      ` }} />
    </div>
  )
}
