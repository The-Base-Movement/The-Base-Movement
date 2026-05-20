interface ContactInfoPanelProps {
  contactEmail: string
}

export function ContactInfoPanel({ contactEmail }: ContactInfoPanelProps) {
  return (
    <div className="lg:col-span-2 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight">
          Get in touch
        </h2>
        <p className="text-slate-600 mb-8 leading-relaxed text-sm md:text-base">
          Whether you're in Ghana or the Diaspora, your voice matters to this movement. Let us know
          how you'd like to contribute.
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        <div className="bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-[var(--brand-green)]"
              style={{ fontSize: 24 }}
            >
              mail
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-micro font-bold tracking-tight text-slate-400 mb-1 font-meta">
              Email
            </p>
            <p className="text-charcoal-dark font-medium text-sm md:text-base truncate">
              {contactEmail}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-[var(--brand-green)]"
              style={{ fontSize: 24 }}
            >
              phone
            </span>
          </div>
          <div>
            <p className="text-micro font-bold tracking-tight text-slate-400 mb-1 font-meta">
              Phone
            </p>
            <p className="text-charcoal-dark font-medium text-sm md:text-base">
              Contact via email for inquiries
            </p>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-[var(--brand-green)]"
              style={{ fontSize: 24 }}
            >
              location_on
            </span>
          </div>
          <div>
            <p className="text-micro font-bold tracking-tight text-slate-400 mb-1 font-meta">
              Location
            </p>
            <p className="text-charcoal-dark font-medium text-sm md:text-base">
              Ghana & Global Diaspora
            </p>
          </div>
        </div>

        {/* Headquarters Image */}
        <div className="overflow-hidden border border-slate-200 shadow-sm group bg-white">
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src="/branding/party-headquarters-image.webp"
              alt="The Base Party Headquarters"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              decoding="async"
              loading="lazy"
            />
          </div>
          <div className="p-5 border-t border-slate-100">
            <p className="text-micro font-meta font-bold text-[var(--brand-green)] tracking-tight">
              Official headquarters
            </p>
            <p className="text-xs text-slate-500 mt-2 font-body-md leading-relaxed">
              Our central hub in Accra, serving as the heart of movement operations and community
              engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
