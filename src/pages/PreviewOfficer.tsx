import { useEffect, useState } from 'react'
import { OfficerCard, type OfficerProfile } from '../components/OfficerCard'
import { OfficerCardSlider } from '../components/OfficerCardSlider'
import { supabase } from '@/lib/supabase'

export default function PreviewOfficer() {
  const [officers, setOfficers] = useState<OfficerProfile[]>([])
  const [tiers, setTiers] = useState<
    { id: string; name: string; title: string; description: string; order_index: number }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOfficials() {
      const [officersData, tiersData] = await Promise.all([
        supabase
          .from('party_officials')
          .select('*')
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false }),
        supabase.from('party_tiers').select('*').order('order_index', { ascending: true }),
      ])

      if (officersData.error) console.error('Error fetching officials:', officersData.error)
      if (tiersData.data) setTiers(tiersData.data)

      if (officersData.data) {
        const data = officersData.data
        setOfficers(
          data.map((d) => ({
            id: d.id,
            name: d.name,
            role: d.role,
            region: d.region || undefined,
            bio: d.bio || undefined,
            avatarUrl: d.avatar_url || undefined,
            tier: d.tier as 'executive' | 'regional' | 'base',
            socials: {
              facebook: d.facebook_url || undefined,
              instagram: d.instagram_url || undefined,
              twitter: d.twitter_url || undefined,
              linkedin: d.linkedin_url || undefined,
              email: d.email || undefined,
            },
          }))
        )
      }
      setLoading(false)
    }
    loadOfficials()
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>

  return (
    <div
      style={{
        padding: '40px',
        background: 'hsl(var(--background))',
        minHeight: '100vh',
        fontFamily: "'Public Sans', sans-serif",
        overflowX: 'hidden',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'var(--font-weight-semibold, 600)',
            marginBottom: '20px',
            color: 'hsl(var(--on-surface))',
          }}
        >
          Officer Cards Preview
        </h1>

        {tiers.map((tier) => (
          <section key={tier.id} style={{ marginBottom: '80px' }}>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'var(--font-weight-semibold, 600)',
                margin: 0,
                color: 'hsl(var(--primary))',
                borderBottom: '2px solid hsl(var(--border))',
                paddingBottom: '12px',
              }}
            >
              {tier.title}
            </h2>
            <div style={{ marginTop: 24 }}>
              <OfficerCardSlider>
                {officers
                  .filter((o) => o.tier === tier.name)
                  .map((officer) => (
                    <OfficerCard key={officer.id} officer={officer} />
                  ))}
              </OfficerCardSlider>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
