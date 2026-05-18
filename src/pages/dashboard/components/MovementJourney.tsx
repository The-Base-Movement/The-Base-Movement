import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { format } from 'date-fns'
import { useAuth } from '@/context/AuthContext'

interface Step {
  title: string
  date: string
  status: 'Complete' | 'In progress' | 'Up next' | 'Verified'
  type: 'c' | 'd' | 't' // c = completed, d = active/in-progress, t = upcoming
}

export function MovementJourney() {
  const { user } = useAuth()
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
        const isVerified = member.status === 'Active' || member.status === 'Approved'
        journeySteps.push({
          title: 'ID verified',
          date: isVerified ? 'Verified' : 'Pending',
          status: isVerified ? 'Verified' : 'In progress',
          type: isVerified ? 'c' : 'd'
        })

        // 3. First contribution — look up by auth ID (member_id) to avoid phone fallback issues
        const authId = user?.id || member.authId
        const { data: donationRows } = await supabase
          .from('donations')
          .select('created_at')
          .eq('member_id', authId)
          .order('created_at', { ascending: true })
          .limit(1)
        const hasDonated = (donationRows?.length ?? 0) > 0
        journeySteps.push({
          title: 'First contribution',
          date: hasDonated ? format(new Date(donationRows![0].created_at), 'dd MMM yyyy') : 'Pending',
          status: hasDonated ? 'Complete' : (isVerified ? 'In progress' : 'Up next'),
          type: hasDonated ? 'c' : (isVerified ? 'd' : 't')
        })

        // 4. Join a Chapter — verified by admin = chapter assigned; also check raw DB value
        const { data: rawUser } = await supabase
          .from('users')
          .select('chapter')
          .eq('registration_number', regNo)
          .single()
        const rawChapter = rawUser?.chapter
        const hasNamedChapter = !!(rawChapter && rawChapter.trim() !== '' && rawChapter !== 'TBM Ghana Chapter')
        const hasChapter = isVerified || hasNamedChapter
        const chapterDisplay = hasNamedChapter ? rawChapter! : (isVerified ? 'Assigned by HQ' : 'Up next')
        journeySteps.push({
          title: 'Join local chapter',
          date: chapterDisplay,
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
                <div className={`dot ${step.type === 'c' ? 'complete' : step.type === 'd' ? 'active' : 'upcoming'}`}>
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
                  <span className="pill" style={{
                    fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '3px 8px', borderRadius: 4, border: '1px solid',
                    background: step.status === 'Complete' || step.status === 'Verified' ? 'rgba(0,107,63,0.08)' : step.status === 'In progress' ? 'rgba(var(--accent-rgb),0.08)' : 'rgba(0,0,0,0.04)',
                    color: step.status === 'Complete' || step.status === 'Verified' ? 'hsl(var(--primary))' : step.status === 'In progress' ? 'hsl(var(--accent))' : 'hsl(var(--on-surface-muted))',
                    borderColor: step.status === 'Complete' || step.status === 'Verified' ? 'rgba(0,107,63,0.15)' : step.status === 'In progress' ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.08)',
                  }}>
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
