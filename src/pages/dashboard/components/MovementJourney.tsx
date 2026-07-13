import { useState, useEffect } from 'react'
import { sessionStore } from '@/lib/sessionStore'
import { adminService } from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { useAuth } from '@/context/AuthContext'
import { diasporaName } from '@/lib/diaspora'

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
        const regNo = sessionStore.getItem('userRegNo')
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
            type: 'c',
          },
        ]

        // 2. ID Verified
        const isVerified = member.status === 'Active' || member.status === 'Approved'
        journeySteps.push({
          title: 'ID verified',
          date: isVerified ? 'Verified' : 'Pending',
          status: isVerified ? 'Verified' : 'In progress',
          type: isVerified ? 'c' : 'd',
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
          date: hasDonated
            ? format(new Date(donationRows![0].created_at), 'dd MMM yyyy')
            : 'Pending',
          status: hasDonated ? 'Complete' : isVerified ? 'In progress' : 'Up next',
          type: hasDonated ? 'c' : isVerified ? 'd' : 't',
        })

        // 4. Join a Chapter — verified by admin = chapter assigned; also check raw DB value
        const { data: rawUser } = await supabase
          .from('users')
          .select('chapter')
          .eq('registration_number', regNo)
          .single()
        const rawChapter = rawUser?.chapter
        const hasNamedChapter = !!(rawChapter && rawChapter.trim() !== '')
        const hasChapter = isVerified || hasNamedChapter
        const chapterDisplay = hasNamedChapter
          ? diasporaName(rawChapter!)
          : isVerified
            ? 'Assigned by HQ'
            : 'Up next'
        journeySteps.push({
          title: 'Join a community',
          date: chapterDisplay,
          status: hasChapter ? 'Complete' : hasDonated ? 'In progress' : 'Up next',
          type: hasChapter ? 'c' : hasDonated ? 'd' : 't',
        })

        setSteps(journeySteps)
      } catch (error) {
        console.error('Error fetching journey:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJourney()
  }, [user?.id])

  return (
    <div
      className="card card-pad road border border-border rounded-[4px] p-4 sm:p-6"
      style={{ background: 'hsl(var(--card))' }}
    >
      <h3 className="font-meta text-[14px] font-semibold tracking-tight text-on-surface mb-[14px]">
        My movement journey
      </h3>
      {loading ? (
        <div className="py-10 text-center">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[12px] font-bold text-on-surface/40 uppercase tracking-[.06em] font-meta">
            Analyzing Journey...
          </p>
        </div>
      ) : (
        <div className="steps-container pt-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className="step animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{
                animationDelay: `${i * 100}ms`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '10px 0',
                borderBottom: i < steps.length - 1 ? '1px solid hsl(var(--border))' : 'none',
              }}
            >
              <div>
                <b className="font-meta font-semibold text-[13px] tracking-tight text-on-surface">
                  {step.title}
                </b>
                <span className="text-[11px] text-on-surface-muted block mt-0.5">{step.date}</span>
              </div>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: '1px solid',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  background:
                    step.status === 'Complete' || step.status === 'Verified'
                      ? 'rgba(0,107,63,0.08)'
                      : step.status === 'In progress'
                        ? 'rgba(var(--accent-rgb),0.08)'
                        : 'rgba(0,0,0,0.04)',
                  color:
                    step.status === 'Complete' || step.status === 'Verified'
                      ? 'hsl(var(--primary))'
                      : step.status === 'In progress'
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--on-surface-muted))',
                  borderColor:
                    step.status === 'Complete' || step.status === 'Verified'
                      ? 'rgba(0,107,63,0.15)'
                      : 'rgba(0,0,0,0.08)',
                }}
              >
                {step.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `.steps-container { position: relative; }` }} />
    </div>
  )
}
