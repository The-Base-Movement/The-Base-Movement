import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade, Pagination } from 'swiper/modules'
import { Link } from 'react-router-dom'
import { Button } from '@/components/buttons/ui/neon-button'
import { adminService } from '@/services/adminService'
import { MALE_AVATAR } from '@/lib/avatar'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'

interface Leader {
  id: string
  name: string
  role: string
  avatar_url: string | null
}

const FALLBACK: Leader = {
  id: 'fallback',
  name: '',
  role: '',
  avatar_url: MALE_AVATAR,
}

export function LeaderSlider() {
  const [leaders, setLeaders] = useState<Leader[]>([FALLBACK])

  useEffect(() => {
    adminService.getAboutOfficials().then((data) => {
      if (data.length > 0) setLeaders(data)
    })
  }, [])

  const multiple = leaders.length > 1
  // Swiper loop needs enough slides or it silently disables and stops on the last
  // one. Duplicate the set until there are at least 4 so the loop runs infinitely.
  const slides = multiple
    ? Array.from({ length: Math.ceil(4 / leaders.length) }, () => leaders).flat()
    : leaders

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* Outer wrapper — carries both the drop shadow and the decorative offset border via box-shadow */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 12,
          boxShadow: [
            '-10px 10px 0 0 hsl(var(--primary) / 0.2)', // decorative offset border
            '0 20px 48px -8px rgba(0,0,0,0.18)', // main drop shadow
          ].join(', '),
        }}
      >
        {/* Frame — clips the image, must NOT have overflow:hidden on the shadow wrapper above */}
        <div
          style={{
            width: '100%',
            aspectRatio: '7/9',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <Swiper
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            loop={multiple}
            loopAdditionalSlides={1}
            autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={multiple ? { clickable: true } : false}
            style={{ width: '100%', height: '100%' }}
            className="leader-swiper"
          >
            {slides.map((leader, i) => (
              <SwiperSlide key={`${leader.id}-${i}`}>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={leader.avatar_url || FALLBACK.avatar_url!}
                    alt={leader.name || 'Leadership'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {leader.name && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 45%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '14px 16px 40px',
                        gap: 3,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 14,
                          color: '#fff',
                          margin: 0,
                        }}
                      >
                        {leader.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-normal, 400)',
                          fontSize: 10,
                          color: 'hsl(var(--accent))',
                          margin: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                        }}
                      >
                        {leader.role}
                      </p>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Floating dots — outside the clipping frame */}
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: 'hsl(var(--accent))',
            opacity: 0.75,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -16,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'hsl(var(--primary))',
            opacity: 0.65,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* CTA */}
      <Link to="/officers" style={{ textDecoration: 'none' }}>
        <Button variant="outline" size="sm">
          Meet our leaders
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            arrow_forward
          </span>
        </Button>
      </Link>

      <style>{`
        .leader-swiper { width: 100%; height: 100%; }
        .leader-swiper .swiper-pagination { bottom: 12px; }
        .leader-swiper .swiper-pagination-bullet { background: rgba(255,255,255,0.45); opacity: 1; width: 6px; height: 6px; }
        .leader-swiper .swiper-pagination-bullet-active { background: hsl(var(--accent)); width: 16px; border-radius: 999px; }
      `}</style>
    </div>
  )
}
