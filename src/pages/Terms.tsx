import { Scale, Info, CheckCircle } from 'lucide-react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Helmet } from 'react-helmet-async'

export default function Terms() {
  return (
    <main className="bg-surface-warm font-body-md min-h-screen pb-24">
      <Helmet>
        <title>Terms of Service | The Base Movement</title>
        <meta name="description" content="Official terms and membership agreement for The Base Movement." />
      </Helmet>

      {/* Hero */}
      <div className="bg-charcoal-dark text-white pt-24 pb-16 border-b-4 border-brand-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-[1280px] mx-auto px-8 relative z-10">
          <Breadcrumbs />
          <p className="font-meta text-warm-gold tracking-tight text-xs mb-3 mt-6">Member Governance</p>
          <h1 className="font-meta font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-4">
            Terms of <span className="text-brand-green">service</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl font-body-md">
            The institutional framework and membership agreement that governs participation in The Base Movement.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="max-w-4xl">
          <div className="flow" style={{ '--flow-space': '3rem' } as React.CSSProperties}>
            
            <section className="bg-white p-8 md:p-12 border border-slate-200 shadow-sm">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-brand-green/10 rounded-none flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6 text-brand-green" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight">Membership agreement</h2>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base prose-standard">
                    By joining The Base, you agree to support the movement's objectives of promoting civic engagement and youth empowerment. You commit to upholding the values of integrity, accountability, and national development. This agreement constitutes a formal commitment to the principles of 'Ghana First'.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 md:p-12 border border-slate-200 shadow-sm">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-warm-gold/10 rounded-none flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6 text-warm-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight">Code of conduct</h2>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base prose-standard">
                    Members are expected to engage in constructive dialogue and represent the movement with dignity at all times. Any form of hate speech, violence, or illegal activity will result in immediate termination of membership and potential restriction from movement spaces.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 md:p-12 border border-slate-200 shadow-sm">
              <div className="flex gap-6">
                <div className="w-12 h-12 bg-charcoal-dark/10 rounded-none flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6 text-charcoal-dark" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-charcoal-dark mb-4 font-meta tracking-tight">Platform usage & security</h2>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base prose-standard">
                    Your member portal is for personal use only. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Unauthorized attempts to access movement data or disrupt platform operations will be met with institutional and legal action.
                  </p>
                </div>
              </div>
            </section>

            <div className="bg-charcoal-dark p-8 md:p-12 border-l-4 border-warm-gold text-white">
              <h3 className="font-meta font-bold text-xl tracking-tight mb-6">Institutional commitments</h3>
              <ul className="space-y-4">
                {[
                  'Support movement activities and local chapter events',
                  'Promote the values of The Base within your digital and local community',
                  'Engage respectfully with other members and movement leadership',
                  'Maintain the integrity of movement information and internal dispatches'
                ].map((commitment, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-warm-gold mt-2 shrink-0"></span>
                    <span className="text-sm text-slate-400">{commitment}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-slate-400 pt-8 border-t border-slate-200">
              Last updated: April 2026. By continuing to use the portal, you agree to these institutional terms.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
