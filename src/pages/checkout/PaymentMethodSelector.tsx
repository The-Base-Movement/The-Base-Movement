interface PaymentMethodSelectorProps {
  paymentMethod: 'momo' | 'card'
  onSelect: (method: 'momo' | 'card') => void
}

export function PaymentMethodSelector({ paymentMethod, onSelect }: PaymentMethodSelectorProps) {
  return (
    <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[var(--brand-green)]/10 rounded-full flex items-center justify-center">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'var(--brand-green)' }}
          >
            credit_card
          </span>
        </div>
        <h2 className="font-h3 text-xl text-stone-900">2. Payment Method</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onSelect('momo')}
          className={`flex items-center gap-4 p-6 border rounded-sm transition-all text-left ${
            paymentMethod === 'momo'
              ? 'border-[var(--brand-green)] bg-[var(--brand-green)]/5 ring-1 ring-[var(--brand-green)]'
              : 'border-stone-200 hover:border-stone-300 bg-stone-50'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'momo' ? 'bg-[var(--brand-green)] text-white' : 'bg-stone-200 text-stone-500'}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              smartphone
            </span>
          </div>
          <div>
            <p className="font-bold text-stone-900 text-sm">Mobile money</p>
            <p className="text-micro text-stone-500 tracking-tight">MTN, Telecel, AT money</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelect('card')}
          className={`flex items-center gap-4 p-6 border rounded-sm transition-all text-left ${
            paymentMethod === 'card'
              ? 'border-[var(--brand-green)] bg-[var(--brand-green)]/5 ring-1 ring-[var(--brand-green)]'
              : 'border-stone-200 hover:border-stone-300 bg-stone-50'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'card' ? 'bg-[var(--brand-green)] text-white' : 'bg-stone-200 text-stone-500'}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              credit_card
            </span>
          </div>
          <div>
            <p className="font-bold text-stone-900 text-sm">Credit / debit card</p>
            <p className="text-micro text-stone-500 tracking-tight">Visa, Mastercard, AMEX</p>
          </div>
        </button>
      </div>

      {paymentMethod === 'momo' && (
        <div className="mt-8 p-6 bg-stone-50 border border-stone-100 rounded-sm">
          <label className="block text-micro font-bold text-stone-900 tracking-tight mb-4">
            Select network
          </label>
          <div className="flex flex-wrap gap-4">
            {['MTN', 'Telecel', 'AT Money'].map((network) => (
              <label key={network} className="flex items-center gap-2 cursor-pointer group">
                <input
                  id="input-4964d2"
                  type="radio"
                  name="network"
                  className="w-4 h-4 text-[var(--brand-green)] focus:ring-[var(--brand-green)]"
                />
                <span className="text-xs font-bold text-stone-600 group-hover:text-stone-900 tracking-tight">
                  {network}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-6">
            <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">
              MoMo number
            </label>
            <input
              aria-label="Enter your mobile number"
              name="name-94ad78"
              id="input-94ad78"
              type="tel"
              className="w-full h-12 bg-white border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
              placeholder="Enter your mobile number"
            />
          </div>
        </div>
      )}
    </div>
  )
}
