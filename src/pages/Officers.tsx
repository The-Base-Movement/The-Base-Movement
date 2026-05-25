import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { OfficerCard, type OfficerProfile } from '@/components/OfficerCard'
import { OfficerCardSlider } from '@/components/OfficerCardSlider'
import { SearchBar } from '@/components/SearchBar'
import SEO from '@/components/SEO'
import { useBranding } from '@/hooks/useBranding'
import { usePerformance } from '@/context/PerformanceContext'
import { ScrollReveal } from '@/components/ScrollReveal'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function Officers() {
  const { lowBandwidthMode } = usePerformance()
  const { settings } = useBranding()
  const [officers, setOfficers] = useState<OfficerProfile[]>([])
  const [tiers, setTiers] = useState<
    { id: string; name: string; title: string; description: string; order_index: number }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

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

  return (
    <main className="bg-background min-h-screen">
      <SEO
        title="Leadership | The Base"
        description="Meet the dedicated executives and officers driving our strategic vision and national mobilization."
      />

      <section className="bg-on-surface text-white py-20 md:py-32 relative overflow-hidden">
        {!lowBandwidthMode && (
          <div
            className="absolute inset-0 z-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url('${settings.hero_bg_url || '/hero-bg.png'}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'grayscale(100%) contrast(1.2)',
            }}
          />
        )}
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 relative z-10 text-center">
          <Breadcrumbs variant="dark" />
          <ScrollReveal direction="down" duration={1000}>
            <h1 className="font-meta font-medium text-4xl md:text-6xl mb-6 tracking-tight">
              National Leadership
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200} duration={1000}>
            <p className="text-white/80 max-w-2xl mx-auto font-body-md text-lg leading-relaxed">
              A transparent and accountable leadership structure dedicated to securing jobs,
              developing infrastructure, and empowering the youth across all 16 regions.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="py-20 md:py-24 max-w-[1280px] mx-auto px-5 sm:px-8">
        {!loading && (
          <div style={{ maxWidth: 480, margin: '0 auto 48px' }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, role, or region…"
              variant="public"
            />
          </div>
        )}
        {loading ? (
          <div className="py-20 text-center text-muted-foreground font-meta font-medium">
            Loading leadership roster...
          </div>
        ) : (
          <div className="space-y-32">
            {[...tiers]
              .sort((a, b) => a.order_index - b.order_index)
              .map((tier, idx) => {
                const q = searchQuery.trim().toLowerCase()
                const tierOfficers = officers
                  .filter((o) => o.tier === tier.name)
                  .filter(
                    (o) =>
                      !q ||
                      o.name.toLowerCase().includes(q) ||
                      o.role.toLowerCase().includes(q) ||
                      (o.region || '').toLowerCase().includes(q)
                  )
                  .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                if (tierOfficers.length === 0) return null

                const headerColor =
                  idx === 0 ? 'text-destructive' : idx === 1 ? 'text-accent' : 'text-primary'

                return (
                  <div key={tier.id} className="scroll-mt-32" id={tier.name}>
                    <ScrollReveal duration={850} distance="25px" direction="up">
                      <div className="mb-10 text-center">
                        <h2
                          className={`text-3xl font-meta font-semibold tracking-tight mb-2 ${headerColor}`}
                        >
                          {tier.title}
                        </h2>
                        <p className="text-muted-foreground font-body-md">{tier.description}</p>
                      </div>
                    </ScrollReveal>

                    <ScrollReveal duration={1000} delay={100} distance="35px" direction="up">
                      <OfficerCardSlider>
                        {tierOfficers.map((officer) => (
                          <OfficerCard key={officer.id} officer={officer} tierIndex={idx} />
                        ))}
                      </OfficerCardSlider>
                    </ScrollReveal>
                  </div>
                )
              })}
          </div>
        )}
      </section>
    </main>
  )
}
