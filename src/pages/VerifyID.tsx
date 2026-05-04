import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, User, MapPin, Calendar, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface VerifiedMember {
  full_name: string
  id: string
  region: string
  constituency: string
  type: string
  created_at: string
  avatar_url: string | null
}

export default function VerifyID() {
  const { id } = useParams<{ id: string }>()
  const [member, setMember] = useState<VerifiedMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return
      setLoading(true)
      try {
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('full_name, id, region, constituency, type, created_at, avatar_url')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError
        if (!data) {
          setError('Member not found in the national database.')
        } else {
          setMember(data)
        }
      } catch (err) {
        console.error('Verification error:', err)
        setError('Verification failed. Invalid ID or system timeout.')
      } finally {
        setLoading(false)
      }
    }

    fetchMember()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-stone-200 border-t-[var(--brand-red)] rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Verifying Identity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-block p-3 bg-white shadow-xl rounded-[12px] border border-stone-100">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-xl font-black font-meta uppercase tracking-tighter">The Base Movement</h1>
          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Official Verification Portal</p>
        </div>

        {error ? (
          <Card className="rounded-none border-stone-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="h-2 bg-[var(--brand-red)]" />
            <CardContent className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-[var(--brand-red)]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black font-meta uppercase tracking-tight text-stone-900">Verification Failed</h2>
                <p className="text-stone-500 text-sm">{error}</p>
              </div>
              <div className="pt-4">
                <Link to="/">
                  <Button className="w-full h-12 bg-[var(--brand-black)] text-white text-[10px] uppercase font-bold tracking-widest rounded-none">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : member && (
          <Card className="rounded-none border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="h-2 bg-[var(--brand-green)]" />
            <CardHeader className="p-8 border-b border-stone-100 bg-emerald-50/30 text-center">
              <div className="w-24 h-24 bg-white p-1 rounded-full shadow-xl mx-auto mb-4 border-2 border-emerald-500">
                <div className="w-full h-full rounded-full overflow-hidden bg-stone-100">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Identity Verified</span>
              </div>
              <h2 className="text-2xl font-black font-meta uppercase tracking-tight text-stone-900">{member.full_name}</h2>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{member.id}</p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Region
                  </p>
                  <p className="text-xs font-black text-stone-900 uppercase">{member.region}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1 justify-end">
                    <Activity className="w-3 h-3" /> Status
                  </p>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                    {member.type}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Constituency
                  </p>
                  <p className="text-xs font-black text-stone-900 uppercase">{member.constituency}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" /> Member Since
                  </p>
                  <p className="text-xs font-black text-stone-900 uppercase">
                    {new Date(member.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-100">
                <div className="p-4 bg-stone-50 border border-stone-100 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-stone-400 mt-0.5" />
                  <p className="text-[9px] text-stone-500 leading-relaxed uppercase font-bold tracking-tight">
                    This verification is for official use only. Access to this data is logged and monitored for security purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-stone-400">
            &copy; {new Date().getFullYear()} The Base Movement | Security Vault V2.0
          </p>
        </div>
      </div>
    </div>
  )
}
