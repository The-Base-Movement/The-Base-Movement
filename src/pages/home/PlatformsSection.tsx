import { Link } from 'react-router-dom'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'
import { ButtonAccent } from '@/components/buttons/ButtonAccent'

export function PlatformsSection() {
  return (
    <section
      aria-labelledby="platforms-heading"
      className="py-20 md:py-28 bg-surface-warm border-y border-border/60"
    >
      <div className="page-container">
        <div className="mb-12 max-w-xl">
          <span className="text-[10px] font-medium tracking-[0.08em] uppercase text-primary font-meta block mb-2">
            Membership Pathways
          </span>
          <h2
            id="platforms-heading"
            className="text-2xl md:text-3xl font-meta font-medium text-on-surface tracking-tight leading-tight"
          >
            Two equal tracks. One unified mission for Ghana.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16" data-fade-stagger>
          <div className="border-t-2 border-primary pt-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 26 }}>
                  place
                </span>
                <h3 className="text-xl md:text-2xl font-meta font-medium text-on-surface tracking-tight">
                  For Citizens in Ghana
                </h3>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed font-body-md">
                Get involved directly in your constituency. Participate in grassroots organizing,
                civic training, and practical action for jobs and national development.
              </p>
            </div>
            <div>
              <ButtonPrimary asChild className="w-full sm:w-auto">
                <Link to="/register?platform=GHANA">
                  Join Base Ghana
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                </Link>
              </ButtonPrimary>
            </div>
          </div>

          <div className="border-t-2 border-accent pt-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-accent" style={{ fontSize: 26 }}>
                  language
                </span>
                <h3 className="text-xl md:text-2xl font-meta font-medium text-on-surface tracking-tight">
                  For Ghanaians Abroad
                </h3>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed font-body-md">
                Stay connected to home and mobilize from abroad. Deploy your skills, professional
                networks, and international support into Ghana's future.
              </p>
            </div>
            <div>
              <ButtonAccent asChild className="w-full sm:w-auto">
                <Link to="/register?platform=DIASPORA">
                  Join Base Diaspora
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                </Link>
              </ButtonAccent>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
