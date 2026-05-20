import { Children, type ReactNode } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

interface OfficerCardSliderProps {
  children: ReactNode
}

export function OfficerCardSlider({ children }: OfficerCardSliderProps) {
  return (
    <div style={{ paddingBottom: '60px', position: 'relative' }}>
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={24}
        slidesPerView="auto"
        loop={true}
        style={{ padding: '0 20px', overflow: 'visible' }}
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
        .officials-swiper .swiper-button-next, .officials-swiper .swiper-button-prev {
          color: hsl(var(--primary));
          background: #fff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .officials-swiper .swiper-button-next::after, .officials-swiper .swiper-button-prev::after {
          font-size: 16px;
          font-weight: bold;
        }
      `,
        }}
      />
    </div>
  )
}
