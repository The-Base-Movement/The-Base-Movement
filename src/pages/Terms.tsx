import { FileText, Scale, Info, CheckCircle } from 'lucide-react'

export default function Terms() {
  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-stone-950 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Please read these terms carefully before joining the movement</p>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-950 mb-2">Membership Agreement</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                By joining The Base, you agree to support the movement's objectives of promoting civic engagement and youth empowerment. You commit to upholding the values of integrity, accountability, and national development.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-950 mb-2">Code of Conduct</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Members are expected to engage in constructive dialogue and represent the movement with dignity. Any form of hate speech, violence, or illegal activity will result in immediate termination of membership.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-950 mb-2">Platform Usage</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your member portal is for personal use only. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-stone-950 mb-3">Commitments</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0"></span>
                <span>Support movement activities and events</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0"></span>
                <span>Promote the values of The Base within your community</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-950 mt-1.5 shrink-0"></span>
                <span>Engage respectfully with other members</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                <span>Uphold the principles of 'Ghana First'</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 text-center pt-4">
            Last updated: April 2026. By continuing to use the portal, you agree to these terms.
          </p>
        </div>
      </div>
    </div>
  )
}
