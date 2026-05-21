import { Link } from 'react-router-dom'
import { ButtonPrimary } from '@/components/buttons/ButtonPrimary'
import { ButtonAccent } from '@/components/buttons/ButtonAccent'

export function PlatformsSection() {
  return (
    <section aria-labelledby="platforms-heading" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8">
        <h2 id="platforms-heading" className="sr-only">
          Our Platforms
        </h2>
        <div className="grid md:grid-cols-2 gap-10 md:gap-24" data-fade-stagger>
          <div className="border-t-[4px] border-primary pt-8">
            <h3 className="text-[22px] md:text-[32px] font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight leading-tight">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>
                place
              </span>
              For Citizens in Ghana.
            </h3>
            <p className="text-base text-muted-foreground mb-8 leading-relaxed font-body-md">
              Get involved in your district. Join your local branch, take part in community
              activity, and support practical action for jobs and development.
            </p>
            <ButtonPrimary asChild className="w-full sm:w-auto">
              <Link to="/register?platform=GHANA">
                Join Base Ghana
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  arrow_forward
                </span>
              </Link>
            </ButtonPrimary>
          </div>

          <div className="border-t-[4px] border-accent pt-8">
            <h3 className="text-[22px] md:text-[32px] font-meta font-bold text-on-surface mb-4 flex items-center gap-3 tracking-tight leading-tight">
              <span className="material-symbols-outlined text-accent" style={{ fontSize: 28 }}>
                language
              </span>
              For Ghanaians Abroad.
            </h3>
            <p className="text-base text-muted-foreground mb-8 leading-relaxed font-body-md">
              Stay connected to home and support national development from abroad through your
              skills, networks, and commitment to Ghana's future.
            </p>
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
    </section>
  )
}
