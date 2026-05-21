import { Children, type ReactNode } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface OfficerCardSliderProps {
  children: ReactNode
}

export function OfficerCardSlider({ children }: OfficerCardSliderProps) {
  return (
    <div style={{ paddingBottom: '60px', position: 'relative' }}>
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
            style={{ width: 'auto', height: 'auto', display: 'flex', alignItems: 'stretch' }}
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
