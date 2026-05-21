import { Children, useState, useEffect, type ReactNode } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const SLIDER_MIN = 5

interface OfficerCardSliderProps {
  children: ReactNode
  count?: number
}

const HorizontalRail = () => (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: '5%',
      right: '5%',
      height: 0,
      borderTop: '2px dashed hsl(var(--on-surface-muted))',
      opacity: 0.35,
      pointerEvents: 'none',
    }}
  />
)

export function OfficerCardSlider({ children, count }: OfficerCardSliderProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const childCount = count ?? Children.count(children)
  const useSlider = isMobile || childCount >= SLIDER_MIN

  if (!useSlider) {
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 24,
          padding: '0 20px',
        }}
      >
        <HorizontalRail />
        {Children.map(children, (child) => (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>{child}</div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '60px', position: 'relative' }}>
      <HorizontalRail />
      <Swiper
        modules={[Navigation, Autoplay, Pagination]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop={true}
        spaceBetween={24}
        breakpoints={{
          0: { slidesPerView: 1 },
          768: { slidesPerView: 'auto' },
        }}
        style={{ overflow: 'visible' }}
        className="officials-swiper"
      >
        {Children.map(children, (child) => (
          <SwiperSlide
            style={{ width: 'auto', height: 'auto', display: 'flex', alignItems: 'flex-start' }}
          >
            {child}
          </SwiperSlide>
        ))}
      </Swiper>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .officials-swiper {
          padding: 0 20px;
        }
        .officials-swiper .swiper-button-next,
        .officials-swiper .swiper-button-prev {
          color: hsl(var(--primary));
          background: #fff;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .officials-swiper .swiper-button-next::after,
        .officials-swiper .swiper-button-prev::after {
          font-size: 11px;
          font-weight: bold;
        }
        .officials-swiper .swiper-pagination {
          bottom: 0;
        }
        .officials-swiper .swiper-pagination-bullet-active {
          background: hsl(var(--primary));
        }
        @media (max-width: 767px) {
          .officials-swiper {
            padding: 0 48px;
          }
          .officials-swiper .swiper-slide {
            width: 100% !important;
            display: flex !important;
            justify-content: center;
          }
        }
      `,
        }}
      />
    </div>
  )
}
