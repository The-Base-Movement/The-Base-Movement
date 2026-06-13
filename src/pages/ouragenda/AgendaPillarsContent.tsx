import { useEffect, useRef } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, A11y } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/pagination'
import { type AgendaPillar } from './agendaData'
import { formatAgendaNumber } from './agendaNumber'

interface AgendaPillarsContentProps {
  pillars: AgendaPillar[]
  activeSection: string
  onSelect: (id: string) => void
}

function PillarBody({ pillar }: { pillar: AgendaPillar }) {
  const aimNumber = formatAgendaNumber(pillar.number)

  return (
    <>
      {/* Watermark + header */}
      <div
        className="pillar-header-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 20,
          alignItems: 'start',
          marginBottom: 32,
        }}
      >
        <div
          className="pillar-watermark"
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 'clamp(56px, 7vw, 88px)',
            letterSpacing: '-0.05em',
            lineHeight: 1,
            opacity: 0.07,
            color: pillar.color,
            userSelect: 'none',
          }}
        >
          {aimNumber}
        </div>
        <div style={{ paddingTop: 8 }}>
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: pillar.color,
              display: 'block',
              marginBottom: 10,
            }}
          >
            Aim {aimNumber}
          </span>
          <h2
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 'clamp(1.4rem, 2.5vw, 2rem)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              margin: '0 0 12px',
              color: 'hsl(var(--on-surface))',
            }}
          >
            {pillar.title}
          </h2>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 15,
              lineHeight: 1.7,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            {pillar.summary}
          </p>
        </div>
      </div>

      {/* Objectives */}
      <div
        className="pillar-objectives-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
        }}
      >
        {pillar.objectives.map((obj, idx) => (
          <div
            key={idx}
            style={{
              background: 'hsl(var(--container-low))',
              borderRadius: 'var(--radius-md)',
              padding: '18px 20px',
              borderLeft: `3px solid ${pillar.color}`,
            }}
          >
            <h3
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
                letterSpacing: '-0.005em',
                margin: '0 0 12px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              {obj.title}
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
              }}
            >
              {obj.items.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 5,
                      height: 5,
                      marginTop: 7,
                      borderRadius: '50%',
                      background: pillar.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      lineHeight: 1.65,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}

export function AgendaPillarsContent({
  pillars,
  activeSection,
  onSelect,
}: AgendaPillarsContentProps) {
  const activeIndex = pillars.findIndex((p) => p.id === activeSection)
  const activePillar = pillars[activeIndex] ?? pillars[0]
  const canPrev = activeIndex > 0
  const canNext = activeIndex < pillars.length - 1
  const swiperRef = useRef<SwiperType | null>(null)

  // Sync swiper when activeSection changes from desktop tabs/cards
  useEffect(() => {
    if (swiperRef.current && activeIndex >= 0) {
      swiperRef.current.slideTo(activeIndex)
    }
  }, [activeIndex])

  if (!activePillar) return null

  return (
    <div id="pillar-panel" style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}>
      {/* ── DESKTOP: tab-switched panel ── */}
      <div className="agenda-panel-desktop">
        <div
          style={{
            background: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderTop: `3px solid ${activePillar.color}`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
            padding: 'clamp(28px, 4vw, 48px)',
            transition: 'border-top-color 0.25s ease',
          }}
        >
          <PillarBody pillar={activePillar} />
        </div>

        {/* Prev / Next */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            gap: 12,
          }}
        >
          <button
            onClick={() => canPrev && onSelect(pillars[activeIndex - 1].id)}
            disabled={!canPrev}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
              background: 'transparent',
              cursor: canPrev ? 'pointer' : 'default',
              opacity: canPrev ? 1 : 0.3,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (canPrev) {
                e.currentTarget.style.background = 'hsl(var(--container-low))'
                e.currentTarget.style.color = 'hsl(var(--on-surface))'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'hsl(var(--on-surface-muted))'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            {canPrev && (
              <span>
                {formatAgendaNumber(pillars[activeIndex - 1].number)}.{' '}
                {pillars[activeIndex - 1].title.slice(0, 28)}
                {pillars[activeIndex - 1].title.length > 28 ? '…' : ''}
              </span>
            )}
          </button>

          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              letterSpacing: '0.05em',
            }}
          >
            {activeIndex + 1} / {pillars.length}
          </span>

          <button
            onClick={() => canNext && onSelect(pillars[activeIndex + 1].id)}
            disabled={!canNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--border))',
              background: 'transparent',
              cursor: canNext ? 'pointer' : 'default',
              opacity: canNext ? 1 : 0.3,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (canNext) {
                e.currentTarget.style.background = 'hsl(var(--container-low))'
                e.currentTarget.style.color = 'hsl(var(--on-surface))'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'hsl(var(--on-surface-muted))'
            }}
          >
            {canNext && (
              <span>
                {formatAgendaNumber(pillars[activeIndex + 1].number)}.{' '}
                {pillars[activeIndex + 1].title.slice(0, 28)}
                {pillars[activeIndex + 1].title.length > 28 ? '…' : ''}
              </span>
            )}
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </button>
        </div>
      </div>

      {/* ── MOBILE: horizontal Swiper ── */}
      <div className="agenda-panel-mobile">
        <Swiper
          modules={[Pagination, A11y]}
          slidesPerView={1}
          spaceBetween={16}
          autoHeight
          pagination={{ clickable: true }}
          a11y={{ enabled: true }}
          onSwiper={(s) => {
            swiperRef.current = s
          }}
          onSlideChange={(s) => onSelect(pillars[s.activeIndex]?.id || '')}
          initialSlide={activeIndex >= 0 ? activeIndex : 0}
          style={{ paddingBottom: 48 }}
          className="pillar-swiper"
        >
          {pillars.map((pillar, index) => (
            <SwiperSlide key={pillar.id}>
              <div
                style={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderTop: `3px solid ${pillar.color}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 18px',
                }}
              >
                <PillarBody pillar={pillar} />

                {/* Slide footer */}
                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Aim {index + 1} of {pillars.length}
                  </span>
                  {index < pillars.length - 1 && (
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 10,
                        color: pillar.color,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Swipe →
                    </span>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .agenda-panel-desktop { display: block; }
        .agenda-panel-mobile  { display: none; }
        @media (max-width: 640px) {
          .agenda-panel-desktop { display: none; }
          .agenda-panel-mobile  { display: block; }
        }
        .pillar-swiper .swiper-pagination { bottom: 16px; }
        .pillar-swiper .swiper-pagination-bullet {
          background: hsl(var(--border));
          opacity: 1;
          width: 7px;
          height: 7px;
        }
        .pillar-swiper .swiper-pagination-bullet-active {
          background: hsl(var(--primary));
          width: 20px;
          border-radius: var(--radius-pill);
        }
        @media (max-width: 640px) {
          .pillar-objectives-grid { grid-template-columns: 1fr !important; }
          .pillar-watermark { display: none !important; }
          .pillar-header-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
