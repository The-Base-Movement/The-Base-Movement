/**
 * OfficerCardSlider Component
 * -------------------------------------------------------------
 * Container for a group of `OfficerCard` elements.
 * Automatically switches between two layouts:
 * - Flex-wrap grid: used when the screen is desktop-width AND there are fewer
 *   than `SLIDER_MIN` (5) cards.
 * - Swiper carousel: used on mobile (< 768 px) OR when there are ≥ 5 cards.
 *   The carousel auto-plays every 5 s and shows clickable pagination dots.
 *
 * A decorative `HorizontalRail` (dashed top line) is rendered in both modes,
 * serving as the visual "rail" from which officer lanyard cards hang.
 */

import { Children, useState, useEffect, type ReactNode } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const SLIDER_MIN = 3

interface OfficerCardSliderProps {
  children: ReactNode
  count?: number
}

const HorizontalRail = () => (
  <div
    style={{
      position: 'absolute',
      top: 16,
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
    <div style={{ paddingBottom: '60px', position: 'relative', paddingTop: '16px' }}>
      <HorizontalRail />
      <Swiper
        modules={[Autoplay, Pagination]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        loop={false}
        spaceBetween={24}
        breakpoints={{
          0: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
        }}
        style={{ overflow: 'hidden', paddingTop: '16px', marginTop: '-16px' }}
        className="officials-swiper"
      >
        {Children.map(children, (child) => (
          <SwiperSlide style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
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
        .officials-swiper .swiper-pagination {
          bottom: 0;
        }
        .officials-swiper .swiper-pagination-bullet-active {
          background: hsl(var(--primary));
        }
        .officials-swiper .swiper-slide {
          height: auto;
        }
        @media (max-width: 767px) {
          .officials-swiper {
            padding: 0 20px;
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
