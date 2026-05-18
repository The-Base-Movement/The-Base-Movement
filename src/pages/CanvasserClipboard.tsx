import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign } from '@/types/admin'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export default function CanvasserClipboard() {
  const [activeCampaigns, setActiveCampaigns] = useState<CanvassingCampaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<CanvassingCampaign | null>(null)
  
  // Form State
  const [contactName, setContactName] = useState('')
  const [addressNotes, setAddressNotes] = useState('')
  const [interactionResult, setInteractionResult] = useState<'STRONG_SUPPORT' | 'LEANING' | 'UNDECIDED' | 'HOSTILE' | 'NOT_HOME'>('UNDECIDED')
  const [keyIssues, setKeyIssues] = useState<string[]>([])
  const [needsFollowUp, setNeedsFollowUp] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const issueOptions = ['Economy/Jobs', 'Roads/Infrastructure', 'Education', 'Healthcare', 'Security']

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const campaigns = await adminService.getCanvassingCampaigns()
        setActiveCampaigns(campaigns.filter(c => c.status === 'ACTIVE'))
      } catch (error) {
        console.error('Failed to load campaigns:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCampaigns()
  }, [])

  const toggleIssue = (issue: string) => {
    setKeyIssues(prev => 
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCampaign) return

    setSubmitting(true)
    try {
      const regNo = localStorage.getItem('userRegNo')
      if (!regNo) throw new Error('Authentication required')
      
      const profile = await adminService.getMemberProfile(regNo)
      if (!profile) throw new Error('Profile not found')

      let lat = 5.6037
      let lng = -0.1870
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        )
        lat = pos.coords.latitude
        lng = pos.coords.longitude
      } catch {
        // fallback to default Accra coords if geolocation denied
      }

      const { error } = await supabase.from('canvasser_logs').insert({
        campaign_id: selectedCampaign.id,
        canvasser_id: profile.id,
        contact_name: contactName || null,
        address_notes: addressNotes,
        interaction_result: interactionResult,
        key_issues: keyIssues,
        needs_follow_up: needsFollowUp,
        location_lat: lat,
        location_lng: lng
      })

      if (error) throw error

      toast.success('Contact logged securely to HQ servers.')
      
      // Reset form for next door
      setContactName('')
      setAddressNotes('')
      setInteractionResult('UNDECIDED')
      setKeyIssues([])
      setNeedsFollowUp(false)
      
    } catch (error) {
      console.error('[CANVASSER] Failed to log interaction:', error)
      toast.error('Failed to synchronize. The log has been saved offline.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary animate-bounce" style={{ fontSize: 48 }}>assignment</span>
          <p className="text-micro font-bold tracking-tight text-primary">Loading canvassing protocols...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-stone-50/50 min-h-screen pb-20">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Breadcrumbs />
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
              <span className="text-micro font-bold tracking-tight text-primary">Operation ground game</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-900 flex items-center gap-3 mb-0 tracking-tight italic font-meta">
              Digital <span className="text-stone-400">clipboard</span>
            </h1>
            <p className="text-stone-500 text-xs font-medium tracking-wide mt-1 mb-0">
              Door-to-door constituent outreach and intelligence logging.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 mt-8">
        
        {!selectedCampaign ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-tiny font-bold tracking-tight text-stone-400">Select active campaign</h2>
            {activeCampaigns.length === 0 ? (
              <div className="bg-white border border-stone-200 p-12 text-center shadow-sm">
                <span className="material-symbols-outlined text-stone-300 block mx-auto mb-3" style={{ fontSize: 32 }}>warning</span>
                <p className="text-micro font-bold text-stone-400 tracking-tight">No active canvassing missions in your sector.</p>
              </div>
            ) : (
              activeCampaigns.map(camp => (
                <button 
                  key={camp.id}
                  onClick={() => setSelectedCampaign(camp)}
                  className="w-full bg-white border border-stone-200 p-6 flex items-center justify-between hover:border-primary hover:shadow-md transition-all group text-left"
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 text-[8px] font-bold tracking-tight">Active</span>
                      <span className="text-micro font-bold text-stone-500 tracking-tight">{camp.target_constituency}</span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-900 tracking-tight mb-1">{camp.title}</h3>
                    <p className="text-tiny text-stone-500 line-clamp-1">{camp.description}</p>
                  </div>
                  <span className="material-symbols-outlined text-stone-300 group-hover:text-primary group-hover:translate-x-1 transition-all" style={{ fontSize: 20 }}>chevron_right</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">

            {/* Red canvasser header */}
            <div className="text-white p-5 pb-[18px] relative overflow-hidden" style={{ background: 'hsl(var(--destructive))' }}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined" style={{ fontSize: 96 }}>location_on</span>
              </div>
              <div className="relative z-10">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-[9px] font-bold text-white/60 hover:text-white tracking-[.06em] uppercase mb-3 flex items-center gap-1"
                >
                  ← Change mission
                </button>
                <p className="text-[9px] font-bold text-white/70 uppercase tracking-[.06em] mb-1">Operation ground game</p>
                <h2 className="font-meta font-extrabold text-[18px] tracking-tight leading-tight mb-2">{selectedCampaign.title}</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 px-[10px] py-[4px] bg-white/10 border border-white/18 rounded-full font-meta font-extrabold text-[9.5px] uppercase tracking-[.04em]">
                    <span className="material-symbols-outlined" style={{ fontSize: 10 }}>location_on</span> {selectedCampaign.target_constituency}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress strip */}
            <div className="flex justify-between items-center px-5 py-[14px] bg-stone-50 border-b border-stone-200">
              <div>
                <div className="font-meta font-extrabold text-[24px] tracking-tight text-primary leading-none tabular-nums">
                  0
                </div>
                <div className="text-[10px] font-bold text-on-surface-muted uppercase tracking-[.05em] mt-0.5">Doors today</div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className="text-[10px] font-bold text-on-surface-muted uppercase tracking-[.05em]">
                  Goal: {selectedCampaign.goal_contacts.toLocaleString()}
                </div>
                <div className="w-[120px] h-[6px] bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full w-0 rounded-full"
                    style={{ background: 'linear-gradient(to right, #CE1126, #DAA520, #006B3F)' }}
                  />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              
              <div className="space-y-4">
                <label className="text-micro font-bold tracking-tight text-stone-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>person</span> Constituent data
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="contactName" id="input-2fd5d6"
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contact Name (Optional)"
                    className="w-full h-12 px-4 bg-stone-50 border border-stone-200 focus:border-primary focus:ring-0 text-sm font-medium"
                  />
                  <input name="addressNotes" id="input-b200f3"
                    type="text"
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                    placeholder="House No. / Landmark"
                    className="w-full h-12 px-4 bg-stone-50 border border-stone-200 focus:border-primary focus:ring-0 text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-micro font-bold tracking-tight text-stone-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>description</span> Interaction result
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { val: 'STRONG_SUPPORT', label: 'Strong Support', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                    { val: 'LEANING', label: 'Leaning', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                    { val: 'UNDECIDED', label: 'Undecided', color: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-200' },
                    { val: 'HOSTILE', label: 'Hostile', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                    { val: 'NOT_HOME', label: 'Not Home', color: 'text-stone-400', bg: 'bg-stone-50', border: 'border-stone-200' }
                  ].map((res) => (
                    <button
                      key={res.val}
                      type="button"
                      onClick={() => setInteractionResult(res.val as 'STRONG_SUPPORT' | 'LEANING' | 'UNDECIDED' | 'HOSTILE' | 'NOT_HOME')}
                      className={cn(
                        "p-3 text-center border-2 transition-all",
                        interactionResult === res.val 
                          ? `${res.border} ${res.bg}` 
                          : "border-stone-100 hover:border-stone-200 bg-white"
                      )}
                    >
                      <span className={cn(
                        "text-micro font-bold tracking-tight block",
                        interactionResult === res.val ? res.color : "text-stone-500"
                      )}>
                        {res.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {interactionResult !== 'NOT_HOME' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <label className="text-micro font-bold tracking-tight text-stone-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>check_circle</span> Key issues raised
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {issueOptions.map(issue => (
                      <button
                        key={issue}
                        type="button"
                        onClick={() => toggleIssue(issue)}
                        className={cn(
                          "px-4 py-2 text-micro font-bold tracking-tight border transition-all",
                          keyIssues.includes(issue)
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
                        )}
                      >
                        {issue}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-stone-100 flex justify-between items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input name="name-fa348b" id="input-fa348b" 
                    type="checkbox" 
                    checked={needsFollowUp}
                    onChange={(e) => setNeedsFollowUp(e.target.checked)}
                    className="w-5 h-5 border-2 border-stone-300 text-primary focus:ring-primary rounded-none" 
                  />
                  <div>
                    <span className="text-micro font-bold tracking-tight text-stone-900 block">Needs follow-up</span>
                    <span className="text-micro text-stone-500 font-medium">Flag for local coordinator</span>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={submitting || !addressNotes}
                  className="bg-primary text-white hover:bg-green-700 h-12 px-6 rounded-none text-micro font-bold tracking-tight shadow-lg border-none cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Logging...' : 'Log interaction'}
                </button>
              </div>

            </form>
          </div>
        )}
      </main>
    </div>
  )
}
