import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import { type Chapter } from '@/services/adminService'
import { Button } from '@/components/buttons/ui/neon-button'
import { Skeleton } from '@/components/states'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'

interface ChaptersSectionProps {
  chapters: Chapter[]
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const leader = chapter.leadership?.[0]
  const leaderName = leader?.name || chapter.leader_name || 'Branch Chair'
  const leaderInitial = leaderName.charAt(0).toUpperCase()
  const isFeatured = chapter.status === 'Active' && chapter.member_count > 500
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid hsl(var(--border))',
        borderRadius: 6,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          background: isFeatured ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 14,
              letterSpacing: '-.005em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {chapter.name}
            {chapter.flag_url && (
              <img
                src={chapter.flag_url}
                alt={chapter.country}
                style={{ height: 13, width: 'auto', borderRadius: 2, flexShrink: 0 }}
              />
            )}
          </div>
          <div
            style={{
              fontSize: 9.5,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              color: isFeatured ? 'rgba(255,255,255,.85)' : 'hsl(var(--accent))',
              marginTop: 2,
            }}
          >
            {chapter.city_or_region || chapter.country}
          </div>
        </div>
        <span
          style={{
            padding: '2px 8px',
            background: 'rgba(255,255,255,.1)',
            border: '1px solid rgba(255,255,255,.18)',
            borderRadius: 2,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 9,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {chapter.country !== 'Ghana' ? 'Diaspora' : isFeatured ? 'Featured' : 'Active'}
        </span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {[
            { v: chapter.member_count.toLocaleString(), l: 'Members' },
            { v: String(chapter.activities?.length ?? 0), l: 'Events' },
            { v: chapter.status === 'Active' ? 'Open' : 'Closed', l: 'Status' },
          ].map((stat) => (
            <div key={stat.l}>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 17,
                  letterSpacing: '-.015em',
                }}
              >
                {stat.v}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}
              >
                {stat.l}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 12,
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'hsl(var(--primary))',
              border: '2px solid hsl(var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {leader?.imageUrl ? (
              <img
                src={leader.imageUrl}
                alt={leaderName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  const el = e.currentTarget
                  el.style.display = 'none'
                  const parent = el.parentElement
                  if (parent)
                    parent.innerHTML = `<span style="color:#fff;font-size:12px;font-weight:700">${leaderInitial}</span>`
                }}
              />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>
                person
              </span>
            )}
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11.5,
                fontWeight: 'var(--font-weight-semibold, 600)',
              }}
            >
              {leaderName}
            </div>
            <span
              style={{
                fontSize: 10,
                color: 'hsl(var(--on-surface-muted))',
                display: 'block',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              Branch chair
            </span>
          </div>
          <Button
            variant={isFeatured ? 'primary' : 'outline'}
            size="sm"
            style={{ marginLeft: 'auto' }}
          >
            Join
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ChaptersSection({ chapters }: ChaptersSectionProps) {
  return (
    <section
      aria-labelledby="chapters-heading"
      className="py-16 md:py-24 bg-background border-y border-border/40"
    >
      <div className="page-container">
        <div className="flex items-end justify-between mb-8 md:mb-10" data-fade>
          <div>
            <span className="text-[10px] font-medium tracking-[.06em] uppercase text-muted-foreground font-meta block mb-2">
              Community
            </span>
            <h2
              id="chapters-heading"
              className="text-2xl md:text-3xl font-meta font-medium text-on-surface tracking-tight"
            >
              Chapters near you
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Community branches across all 16 regions. Find yours.
            </p>
          </div>
          <Link
            to="/chapters"
            className="hidden md:inline-flex items-center gap-2 text-primary font-meta font-medium tracking-tight text-xs hover:underline"
          >
            All chapters{' '}
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </Link>
        </div>

        {chapters.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}
              >
                <Skeleton variant="img" height={56} style={{ borderRadius: 0 }} />
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Skeleton variant="text-sm" width="75%" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[0, 1, 2].map((j) => (
                      <Skeleton key={j} variant="btn" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="sm:hidden -mx-5 px-5">
              <Swiper
                modules={[Pagination]}
                slidesPerView={1.1}
                spaceBetween={12}
                pagination={{ clickable: true }}
                style={{ paddingBottom: 36 }}
              >
                {chapters.map((chapter) => (
                  <SwiperSlide key={chapter.id}>
                    <Link to="/chapters" style={{ textDecoration: 'none', display: 'block' }}>
                      <ChapterCard chapter={chapter} />
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div
              className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
              data-fade-stagger
            >
              {chapters.map((chapter) => (
                <Link key={chapter.id} to="/chapters" style={{ textDecoration: 'none' }}>
                  <ChapterCard chapter={chapter} />
                </Link>
              ))}
            </div>
          </>
        )}

        <ButtonPrimary asChild className="md:hidden mt-8 w-full">
          <Link to="/chapters">
            View all chapters
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </Link>
        </ButtonPrimary>
      </div>
    </section>
  )
}
