interface ContactInfoPanelProps {
  contactEmail: string
  contactPhone?: string
  contactAddress?: string
  contactAddressUrl?: string
}

export function ContactInfoPanel({
  contactEmail,
  contactPhone,
  contactAddress,
  contactAddressUrl,
}: ContactInfoPanelProps) {
  return (
    <div className="lg:col-span-2 space-y-8">
      <div>
        <h2 className="text-2xl font-medium text-charcoal-dark mb-4 font-meta tracking-tight">
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
            <p className="text-micro font-medium tracking-tight text-slate-400 mb-1 font-meta">
              Email
            </p>
            <div className="text-charcoal-dark font-medium text-sm md:text-base truncate">
              {contactEmail ? (
                <a
                  href={`mailto:${contactEmail}`}
                  className="hover:text-[var(--brand-green)] hover:underline transition-colors"
                >
                  {contactEmail}
                </a>
              ) : (
                'Contact via email for inquiries'
              )}
            </div>
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
            <p className="text-micro font-medium tracking-tight text-slate-400 mb-1 font-meta">
              Phone
            </p>
            <div className="text-charcoal-dark font-medium text-sm md:text-base">
              {contactPhone
                ? contactPhone.split(',').map((phone, i) => (
                    <div key={i} className={i > 0 ? 'mt-1' : ''}>
                      <a
                        href={`tel:${phone.trim().replace(/\s+/g, '')}`}
                        className="hover:text-[var(--brand-green)] hover:underline transition-colors"
                      >
                        {phone.trim()}
                      </a>
                    </div>
                  ))
                : 'Phone lines opening soon'}
            </div>
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
            <p className="text-micro font-medium tracking-tight text-slate-400 mb-1 font-meta">
              Location
            </p>
            <div className="text-charcoal-dark font-medium text-sm md:text-base">
              {contactAddress ? (
                contactAddressUrl ? (
                  <a
                    href={contactAddressUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--brand-green)] hover:underline transition-colors"
                  >
                    {contactAddress}
                  </a>
                ) : (
                  contactAddress
                )
              ) : (
                'Ghana & Global Diaspora'
              )}
            </div>
          </div>
        </div>

        {/* Location Map */}
        <div className="overflow-hidden border border-slate-200 shadow-sm bg-white">
          <div className="aspect-[16/9] w-full bg-slate-100">
            <iframe
              title="Headquarters Location"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                contactAddress || 'Accra, Ghana'
              )}&output=embed`}
              allowFullScreen
              loading="lazy"
            />
          </div>
          <div className="p-5 border-t border-slate-100">
            <p className="text-micro font-meta font-medium text-[var(--brand-green)] tracking-tight">
              Official headquarters
            </p>
            <p className="text-xs text-slate-500 mt-2 font-body-md leading-relaxed">
              Our central hub, serving as the heart of movement operations and community engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
