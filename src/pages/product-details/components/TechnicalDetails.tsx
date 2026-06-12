interface TechnicalDetailsProps {
  specifications: Record<string, string | number | boolean | null>
}

export function TechnicalDetails({ specifications }: TechnicalDetailsProps) {
  if (!specifications || Object.keys(specifications).length === 0) {
    return null
  }

  return (
    <section className="mt-16 md:mt-24 grid md:grid-cols-2 gap-8 md:gap-16 items-start">
      <div className="space-y-8">
        <h2 className="font-h2 text-h3 text-stone-900">Technical details</h2>
        <div className="grid gap-4">
          {Object.entries(specifications).map(([key, value]) => (
            <div key={key} className="flex justify-between py-4 border-b border-stone-100">
              <span className="text-micro font-bold text-stone-400 tracking-tight">{key}</span>
              <span className="text-xs font-bold text-stone-900">{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[var(--brand-black)] p-12 text-white relative overflow-hidden">
        <h3 className="font-h3 text-lg tracking-tight mb-6 relative z-10">
          Movement quality standard
        </h3>
        <p className="text-xs text-stone-400 leading-relaxed mb-8 relative z-10">
          Every item in the movement catalog undergoes strict quality control. We ensure that all
          materials are ethically sourced and designed to withstand the rigors of field
          mobilization.
        </p>
        <ul className="space-y-4 relative z-10">
          <li className="flex items-center gap-3 text-micro font-bold tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Durable field-ready fabric
          </li>
          <li className="flex items-center gap-3 text-micro font-bold tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Authentic movement branding
          </li>
          <li className="flex items-center gap-3 text-micro font-bold tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" /> Supporting local production
          </li>
        </ul>
        <span
          className="material-symbols-outlined absolute -bottom-10 -right-10 -rotate-12 text-white/5"
          style={{ fontSize: 192 }}
        >
          shopping_bag
        </span>
      </div>
    </section>
  )
}
