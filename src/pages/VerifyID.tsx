import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'

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
  const { settings } = useBranding()
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
      <SEO
        title="Member Verification"
        noindex
      />
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block p-3 bg-white shadow-xl rounded-[12px] border border-border/40">
            <img src={settings.logo_url} alt="Logo" className="w-12 h-12 object-contain" decoding="async" loading="lazy" />
          </div>
          <h1 className="text-xl font-bold font-meta tracking-tight">The Base Movement</h1>
          <p className="text-micro font-bold text-muted-foreground/80 tracking-tight">Official verification portal</p>
        </div>

        {error ? (
          <div className="rounded-none border border-border/60 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="h-2 bg-destructive" />
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-destructive" style={{ fontSize: 40 }}>cancel</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold font-meta tracking-tight text-on-surface">Verification failed</h2>
                <p className="text-stone-500 text-sm">{error}</p>
              </div>
              <div className="pt-4">
                <Link to="/">
                  <button className="w-full h-12 bg-stone-950 text-white text-micro font-bold tracking-tight border-none cursor-pointer hover:opacity-90 transition-opacity">
                    Return to home
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : member && (
          <div className="rounded-none border border-border/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="h-2 bg-primary" />
            <div className="p-8 border-b border-border/40 bg-primary/5 text-center">
              <div className="w-24 h-24 bg-white p-1 rounded-full shadow-xl mx-auto mb-4 border-2 border-primary">
                <div className="w-full h-full rounded-full overflow-hidden bg-stone-100">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" decoding="async" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <span className="material-symbols-outlined" style={{ fontSize: 40 }}>person</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>check_circle</span>
                <span className="text-micro font-bold tracking-tight text-primary">Identity verified</span>
              </div>
              <h2 className="text-2xl font-bold font-meta tracking-tight text-on-surface">{member.full_name}</h2>
              <p className="text-micro font-bold text-muted-foreground/80 tracking-tight mt-1">{member.id}</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span> Region
                  </p>
                  <p className="text-xs font-bold text-on-surface">{member.region}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1 justify-end">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>monitoring</span> Status
                  </p>
                  <span className="text-micro font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
                    {member.type}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>verified_user</span> Constituency
                  </p>
                  <p className="text-xs font-bold text-on-surface">{member.constituency}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[8px] font-bold tracking-tight text-muted-foreground/80 flex items-center gap-1 justify-end">
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>calendar_today</span> Member Since
                  </p>
                  <p className="text-xs font-bold text-on-surface">
                    {new Date(member.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40">
                <div className="p-4 bg-background border border-border/40 flex items-start gap-3">
                  <span className="material-symbols-outlined text-muted-foreground/80 mt-0.5" style={{ fontSize: 16 }}>warning</span>
                  <p className="text-micro text-stone-500 leading-relaxed font-bold tracking-tight">
                    This verification is for official use only. Access to this data is logged and monitored for security purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
