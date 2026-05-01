import { Shield, Lock, Eye, Server } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--brand-red)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-[var(--brand-red)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--brand-black)] mb-2">Privacy Agreement</h1>
          <p className="text-gray-600">How we protect and handle your data</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-[var(--brand-red)]/10 rounded-full flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-[var(--brand-red)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--brand-black)] mb-2">Data Protection</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                The Base is committed to protecting your personal information. We collect only the data necessary for membership administration and movement coordination. All information is stored securely and accessed only by authorized personnel.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-[var(--brand-gold)]/10 rounded-full flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-[var(--brand-gold)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--brand-black)] mb-2">Information We Collect</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                We collect your name, contact details, location, and platform preference to connect you with the appropriate chapter and keep you informed about movement activities. Optional information helps us understand our membership better.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-[var(--brand-green)]/10 rounded-full flex items-center justify-center shrink-0">
              <Server className="w-5 h-5 text-[var(--brand-green)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--brand-black)] mb-2">Data Storage</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your data is stored on secure servers with encryption. We do not sell, rent, or share your personal information with third parties for marketing purposes. Your information is used solely for The Base membership administration and internal communication.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-[var(--brand-black)] mb-3">Your Rights</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-red)] mt-1.5 shrink-0"></span>
                <span>Request access to your personal data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-gold)] mt-1.5 shrink-0"></span>
                <span>Request correction of inaccurate information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#000000] mt-1.5 shrink-0"></span>
                <span>Request deletion of your data (right to be forgotten)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-green)] mt-1.5 shrink-0"></span>
                <span>Opt out of communications at any time</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 text-center pt-4">
            Last updated: April 2026. If you have questions about this privacy agreement, please <a href="/contact" className="text-[var(--brand-green)] hover:underline">contact us</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
