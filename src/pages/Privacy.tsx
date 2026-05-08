import { Lock, Eye, Server } from 'lucide-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Helmet } from 'react-helmet-async'

export default function Privacy() {
  return (
    <main className="bg-surface-warm font-body-md min-h-screen pb-24">
      <Helmet>
        <title>Privacy Policy | The Base Movement</title>
        <meta name="description" content="How we protect and handle your data at The Base Movement." />
      </Helmet>

      {/* Hero */}
      <div className="bg-charcoal-dark text-white pt-24 pb-16 border-b-4 border-brand-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-[1280px] mx-auto px-8 relative z-10">
          <Breadcrumbs />
          <p className="font-meta text-warm-gold tracking-tight text-[12px] mb-3 mt-6">Institutional Integrity</p>
          <h1 className="font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4">
            Privacy <span className="text-brand-green">policy</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl font-body-md">
            Our commitment to data sovereignty and the absolute protection of our members' digital footprint.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="max-w-4xl">
          <div className="flow" style={{ '--flow-space': '3rem' } as React.CSSProperties}>
            
            <section className="bg-white p-8 md:p-12 border border-slate-200 shadow-sm">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-brand-green/10 rounded-none flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-brand-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight">Data protection</h2>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base prose-standard">
                    The Base is committed to protecting your personal information. We collect only the data necessary for membership administration and movement coordination. All information is stored securely and accessed only by authorized personnel. We believe in data sovereignty and ensure that your information remains within the movement's secure infrastructure.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 md:p-12 border border-slate-200 shadow-sm">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-warm-gold/10 rounded-none flex items-center justify-center shrink-0">
                  <Eye className="w-6 h-6 text-warm-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight">Information we collect</h2>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base prose-standard">
                    We collect your name, contact details, location, and platform preference to connect you with the appropriate chapter and keep you informed about movement activities. This data allows us to provide a tailored experience and ensures that our mobilization efforts are targeted and effective. Optional information helps us understand our membership demographics better.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 md:p-12 border border-slate-200 shadow-sm">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-charcoal-dark/10 rounded-none flex items-center justify-center shrink-0">
                  <Server className="w-6 h-6 text-charcoal-dark" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight">Data storage & security</h2>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base prose-standard">
                    Your data is stored on secure servers with industrial-grade encryption. We do not sell, rent, or share your personal information with third parties for marketing purposes. Your information is used solely for The Base membership administration, internal communication, and verified movement activities.
                  </p>
                </div>
              </div>
            </section>

            <div className="bg-charcoal-dark p-8 md:p-12 border-l-4 border-warm-gold text-white">
              <h3 className="font-meta font-bold text-xl tracking-tight mb-6">Your institutional rights</h3>
              <ul className="space-y-4">
                {[
                  'Request access to your personal data profile',
                  'Request correction of inaccurate information',
                  'Request deletion of your data (right to be forgotten)',
                  'Opt out of non-essential communications at any time'
                ].map((right, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-warm-gold mt-2 shrink-0"></span>
                    <span className="text-sm text-slate-400">{right}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-slate-400 pt-8 border-t border-slate-200">
              Last updated: April 2026. If you have questions about this privacy agreement, please <a href="/contact" className="text-brand-green hover:underline">contact our communications desk</a>.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
