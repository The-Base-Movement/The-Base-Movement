import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, AlertTriangle, User, MapPin, Calendar, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/neon-button'
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-border/60 border-t-destructive rounded-full animate-spin mx-auto" />
          <p className="text-micro font-bold tracking-tight text-muted-foreground/80">Verifying identity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="inline-block p-3 bg-white shadow-xl rounded-[12px] border border-border/40">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain"  decoding="async" loading="lazy" />
          </div>
          <h1 className="text-xl font-bold font-meta tracking-tight">The Base Movement</h1>
          <p className="text-micro font-bold text-muted-foreground/80 tracking-tight">Official verification portal</p>
        </div>

        {error ? (
          <Card className="rounded-none border-border/60 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="h-2 bg-destructive" />
            <CardContent className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-meta tracking-tight text-on-surface">Verification failed</h2>
                <p className="text-stone-500 text-sm">{error}</p>
              </div>
              <div className="pt-4">
                <Link to="/">
                  <Button className="w-full h-12 bg-stone-950 text-white text-micro font-bold tracking-tight rounded-none">
                    Return to home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : member && (
          <Card className="rounded-none border-border/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="h-2 bg-primary" />
            <CardHeader className="p-8 border-b border-border/40 bg-primary/5 text-center">
              <div className="w-24 h-24 bg-white p-1 rounded-full shadow-xl mx-auto mb-4 border-2 border-primary">
                <div className="w-full h-full rounded-full overflow-hidden bg-stone-100">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="text-micro font-bold tracking-tight text-primary">Identity verified</span>
              </div>
              <h2 className="text-2xl font-bold font-meta tracking-tight text-on-surface">{member.full_name}</h2>
              <p className="text-micro font-bold text-muted-foreground/80 tracking-tight mt-1">{member.id}</p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Region
                  </p>
                  <p className="text-xs font-bold text-on-surface">{member.region}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1 justify-end">
                    <Activity className="w-3 h-3" /> Status
                  </p>
                  <span className="text-micro font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                    {member.type}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Constituency
                  </p>
                  <p className="text-xs font-bold text-on-surface">{member.constituency}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1 justify-end">
                    <Calendar className="w-3 h-3" /> Member Since
                  </p>
                  <p className="text-xs font-bold text-on-surface">
                    {new Date(member.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40">
                <div className="p-4 bg-background border border-border/40 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground/80 mt-0.5" />
                  <p className="text-micro text-stone-500 leading-relaxed font-bold tracking-tight">
                    This verification is for official use only. Access to this data is logged and monitored for security purposes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80">
            &copy; {new Date().getFullYear()} The Base Movement | Security Vault V2.0
          </p>
        </div>
      </div>
    </div>
  )
}
