import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination } from 'swiper/modules'
import { cn } from '@/lib/utils'
import { type BlogPost } from '@/services/adminService'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'
import { Skeleton } from '@/components/states'

interface LatestUpdatesSectionProps {
  latestPosts: BlogPost[]
}

export function LatestUpdatesSection({ latestPosts }: LatestUpdatesSectionProps) {
  return (
    <section
      aria-labelledby="updates-heading"
      className="pt-16 md:pt-24 pb-16 md:pb-32 bg-background"
    >
      <div className="page-container">
        <div className="flex justify-between items-end mb-10 md:mb-12" data-fade>
          <div>
            <span className="text-primary font-medium tracking-tight text-micro mb-3 block">
              Updates
            </span>
            <h2
              id="updates-heading"
              className="text-2xl md:text-3xl font-meta font-medium text-on-surface tracking-tight"
            >
              Latest updates
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Stories from our communities, branches, and partners.
            </p>
            <div className={cn('bl', 'mt-4')}>
              <div />
              <div />
              <div />
            </div>
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
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
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
                  <SwiperSlide key={post.id}>
                    <Link to={`/blog/${post.slug}`} className="group block">
                      <div className="aspect-[16/10] overflow-hidden mb-3 border border-border/60 bg-muted">
                        {post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                            <span className="text-micro font-semibold text-muted-foreground/80 tracking-tight">
                              The Base
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-micro font-meta font-medium text-primary tracking-tight">
                          {post.category}
                        </span>
                        <span className="text-micro text-muted-foreground font-meta">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                      <h3 className="text-base font-meta font-medium text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            <div
              className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
              data-fade-stagger
            >
              {latestPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
                  <div className="aspect-[16/10] overflow-hidden mb-4 md:mb-6 border border-border/60 bg-muted">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                        <span className="text-micro font-semibold text-muted-foreground/80 tracking-tight">
                          The Base
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-micro font-meta font-medium text-primary tracking-tight">
                      {post.category}
                    </span>
                    <span className="text-micro text-muted-foreground font-meta">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : ''}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-meta font-medium text-on-surface tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </Link>
              ))}
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
