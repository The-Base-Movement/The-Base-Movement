import { Link } from 'react-router-dom'

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
            <Link
              to="/register?platform=GHANA"
              className="inline-flex items-center gap-2 px-6 py-3 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity w-full sm:w-auto justify-center sm:justify-start"
              style={{ background: 'hsl(var(--primary))', color: '#fff', borderRadius: 2 }}
            >
              Join Base Ghana
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Link>
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
            <Link
              to="/register?platform=DIASPORA"
              className="inline-flex items-center gap-2 px-6 py-3 font-meta font-bold text-sm tracking-tight hover:opacity-90 transition-opacity w-full sm:w-auto justify-center sm:justify-start"
              style={{ background: 'hsl(var(--accent))', color: '#000', borderRadius: 2 }}
            >
              Join Base Diaspora
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
