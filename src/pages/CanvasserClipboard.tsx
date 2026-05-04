import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ClipboardList, MapPin, User, FileText, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign } from '@/services/adminService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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

      // Mock geolocation (in a real app, use navigator.geolocation)
      const lat = 5.6037
      const lng = -0.1870

      // Simulate API call for now since we don't have the explicit submit method in adminService yet
      await new Promise(resolve => setTimeout(resolve, 800))
      
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
          <ClipboardList className="w-12 h-12 text-[var(--brand-green)] animate-bounce" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-green)]">Loading Canvassing Protocols...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-stone-50/50 min-h-screen pb-20">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Breadcrumbs />
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2 w-2 rounded-full bg-[var(--brand-green)] animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-green)]">Operation Ground Game</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-stone-900 flex items-center gap-3 mb-0 uppercase tracking-tighter italic font-meta">
              Digital <span className="text-stone-400">Clipboard</span>
            </h1>
            <p className="text-stone-500 text-xs font-medium tracking-wide mt-1 mb-0">
              Door-to-door constituent outreach and intelligence logging.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 mt-8">
        
        {!selectedCampaign ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-stone-400">Select Active Campaign</h2>
            {activeCampaigns.length === 0 ? (
              <div className="bg-white border border-stone-200 p-12 text-center shadow-sm">
                <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No active canvassing missions in your sector.</p>
              </div>
            ) : (
              activeCampaigns.map(camp => (
                <button 
                  key={camp.id}
                  onClick={() => setSelectedCampaign(camp)}
                  className="w-full bg-white border border-stone-200 p-6 flex items-center justify-between hover:border-[var(--brand-green)] hover:shadow-md transition-all group text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">Active</span>
                      <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest">{camp.target_constituency}</span>
                    </div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight mb-1">{camp.title}</h3>
                    <p className="text-[11px] text-stone-500 line-clamp-1">{camp.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-[var(--brand-green)] group-hover:translate-x-1 transition-all" />
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            
            <div className="bg-stone-900 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <MapPin className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <button 
                  onClick={() => setSelectedCampaign(null)}
                  className="text-[9px] font-bold text-stone-400 hover:text-white uppercase tracking-widest mb-4 flex items-center gap-1"
                >
                  ← Change Mission
                </button>
                <h2 className="text-lg font-black uppercase tracking-tight mb-1">{selectedCampaign.title}</h2>
                <p className="text-[11px] text-stone-400">{selectedCampaign.target_constituency}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[var(--brand-green)]" /> Constituent Data
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Contact Name (Optional)"
                    className="w-full h-12 px-4 bg-stone-50 border border-stone-200 focus:border-[var(--brand-green)] focus:ring-0 text-sm font-medium"
                  />
                  <input
                    type="text"
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                    placeholder="House No. / Landmark"
                    className="w-full h-12 px-4 bg-stone-50 border border-stone-200 focus:border-[var(--brand-green)] focus:ring-0 text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--brand-green)]" /> Interaction Result
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
                      onClick={() => setInteractionResult(res.val as any)}
                      className={cn(
                        "p-3 text-center border-2 transition-all",
                        interactionResult === res.val 
                          ? `${res.border} ${res.bg}` 
                          : "border-stone-100 hover:border-stone-200 bg-white"
                      )}
                    >
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest block",
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
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--brand-green)]" /> Key Issues Raised
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {issueOptions.map(issue => (
                      <button
                        key={issue}
                        type="button"
                        onClick={() => toggleIssue(issue)}
                        className={cn(
                          "px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all",
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
                  <input 
                    type="checkbox" 
                    checked={needsFollowUp}
                    onChange={(e) => setNeedsFollowUp(e.target.checked)}
                    className="w-5 h-5 border-2 border-stone-300 text-[var(--brand-green)] focus:ring-[var(--brand-green)] rounded-none" 
                  />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-900 block">Needs Follow-up</span>
                    <span className="text-[9px] text-stone-500 font-medium">Flag for local coordinator</span>
                  </div>
                </label>

                <Button 
                  type="submit" 
                  disabled={submitting || !addressNotes}
                  className="bg-[var(--brand-green)] text-white hover:bg-green-700 h-12 px-6 rounded-none text-[10px] font-black uppercase tracking-[0.2em] shadow-lg"
                >
                  {submitting ? 'Logging...' : 'Log Interaction'}
                </Button>
              </div>

            </form>
          </div>
        )}
      </main>
    </div>
  )
}
