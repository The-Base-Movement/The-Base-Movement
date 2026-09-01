import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import { type BlogPost } from '@/services/adminService'
import { BlogPostCard } from '@/components/BlogPostCard'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'
import { Skeleton } from '@/components/states'

interface LatestUpdatesSectionProps {
  latestPosts: BlogPost[]
}

export function LatestUpdatesSection({ latestPosts }: LatestUpdatesSectionProps) {
  return (
    <section
      aria-labelledby="updates-heading"
      className="py-20 md:py-28 bg-surface-warm border-t border-border/60"
    >
      <div className="page-container">
        <div className="flex justify-between items-end mb-12" data-fade>
          <div>
            <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-primary font-meta block mb-2">
              Latest Movement News
            </span>
            <h2
              id="updates-heading"
              className="text-2xl md:text-4xl font-meta font-medium text-on-surface tracking-tight"
            >
              Latest updates
            </h2>
            <p className="text-sm text-muted-foreground mt-2 font-body-md">
              Stories from our communities, networks, and partners.
            </p>
          </div>
          <Link
            to="/blog"
            className="hidden md:inline-flex items-center gap-2 text-primary font-meta font-medium tracking-tight text-xs hover:underline"
          >
            View all news
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </Link>
        </div>

        {latestPosts.length === 0 ? (
          <div className="blog-card-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton variant="img" style={{ aspectRatio: '16/10', height: 'auto' }} />
                <Skeleton variant="text-md" width="75%" />
                <Skeleton variant="text-sm" width="50%" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="sm:hidden -mx-5 px-5">
              <Swiper
                modules={[Pagination]}
                slidesPerView={1.1}
                spaceBetween={14}
                pagination={{ clickable: true }}
                style={{ paddingBottom: 36 }}
              >
                {latestPosts.map((post) => (
                  <SwiperSlide key={post.id} style={{ height: 'auto' }}>
                    <BlogPostCard post={post} baseUrl="/blog" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* .blog-card-grid holds cards at 310px and drops columns rather than
                narrowing them, so it needs a plain wrapper to hide on mobile --
                Tailwind's `hidden` would fight its `display: grid`. */}
            <div className="hidden sm:block">
              <div className="blog-card-grid" data-fade-stagger>
                {latestPosts.map((post) => (
                  <BlogPostCard key={post.id} post={post} baseUrl="/blog" />
                ))}
              </div>
            </div>
          </>
        )}

        <ButtonPrimary asChild className="md:hidden mt-10 w-full">
          <Link to="/blog">
            View all news
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_forward
            </span>
          </Link>
        </ButtonPrimary>
      </div>
    </section>
  )
}
