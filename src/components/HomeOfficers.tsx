import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { OfficerCard, type OfficerProfile } from '@/components/OfficerCard'
import { OfficerCardSlider } from '@/components/OfficerCardSlider'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'
import { ScrollReveal } from '@/components/ScrollReveal'

export function HomeOfficers() {
  const [officers, setOfficers] = useState<OfficerProfile[]>([])
  const [topTier, setTopTier] = useState<{
    id: string
    name: string
    title: string
    description: string
    order_index: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOfficials() {
      const { data: tiersData } = await supabase
        .from('party_tiers')
        .select('*')
        .order('order_index', { ascending: true })
        .limit(1)
      const topT = tiersData?.[0] || null
      setTopTier(topT)

      if (!topT) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('party_officials')
        .select('*')
        .eq('tier', topT.name)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching officials:', error)
      }

      if (data) {
        setOfficers(
          data.map((d) => ({
            id: d.id,
            name: d.name,
            role: d.role,
            region: d.region || undefined,
            bio: d.bio || undefined,
            avatarUrl: d.avatar_url || undefined,
            tier: d.tier as string,
            order_index: d.order_index,
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

  if (loading || officers.length === 0) return null

  return (
    <section
      aria-labelledby="officers-heading"
      className="py-16 md:py-24 bg-background border-b border-border/30"
    >
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <ScrollReveal duration={850} distance="25px" direction="up">
          <div className="mb-10 md:mb-12">
            <span className="text-[10px] font-bold tracking-[.06em] uppercase text-muted-foreground font-meta block mb-2">
              Leadership
            </span>
            <h2
              id="officers-heading"
              className="text-2xl md:text-3xl font-meta font-bold text-on-surface tracking-tight mb-1"
            >
              {topTier?.title || 'National Executives'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl font-body-md">
              {topTier?.description ||
                'Meet the dedicated executives driving our strategic vision and national mobilization.'}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal
          duration={1000}
          delay={150}
          distance="35px"
          direction="up"
          style={{ marginBottom: '40px' }}
        >
          <OfficerCardSlider>
            {officers.map((officer) => (
              <OfficerCard key={officer.id} officer={officer} tierIndex={0} />
            ))}
          </OfficerCardSlider>
        </ScrollReveal>

        <ScrollReveal duration={800} delay={300} distance="20px" direction="up">
          <div className="text-center">
            <ButtonPrimary asChild>
              <Link to="/officers" className="inline-flex items-center gap-2 px-6 py-3">
                View all officers
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_forward
                </span>
              </Link>
            </ButtonPrimary>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
