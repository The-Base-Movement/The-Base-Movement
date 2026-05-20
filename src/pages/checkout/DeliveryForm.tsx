import React from 'react'
import type { Region } from '@/services/adminService'

interface DeliveryFormProps {
  formData: {
    fullName: string
    email: string
    phone: string
    address: string
    country: string
    stateProvince: string
    region: string
  }
  isDiaspora: boolean
  dbCountries: { name: string; is_diaspora: boolean }[]
  dbRegions: Region[]
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function DeliveryForm({
  formData,
  isDiaspora,
  dbCountries,
  dbRegions,
  onChange,
}: DeliveryFormProps) {
  return (
    <div className="bg-white border border-stone-200 p-8 rounded-sm shadow-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[var(--brand-green)]/10 rounded-full flex items-center justify-center">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'var(--brand-green)' }}
          >
            local_shipping
          </span>
        </div>
        <h2 className="font-h3 text-xl text-stone-900">1. Delivery Information</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">
            Full name
          </label>
          <input
            aria-label="Enter your full name"
            id="input-9f4084"
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={onChange}
            className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">
            Email address
          </label>
          <input
            aria-label="email@example.com"
            id="input-94b596"
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={onChange}
            className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">
            Phone number
          </label>
          <input
            aria-label="+233 00 000 0000"
            id="input-6781fb"
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={onChange}
            className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
            placeholder="+233 00 000 0000"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">
            Shipping address
          </label>
          <input
            aria-label="House Number, Street Name"
            id="input-5705f2"
            type="text"
            name="address"
            required
            value={formData.address}
            onChange={onChange}
            className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
            placeholder="House Number, Street Name"
          />
        </div>
        <div>
          <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">
            Country
          </label>
          <select
            id="select-5d78b8"
            name="country"
            value={formData.country}
            onChange={onChange}
            className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm appearance-none"
          >
            {dbCountries.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
            {dbCountries.length === 0 && <option value="Ghana">Ghana</option>}
          </select>
        </div>
        {isDiaspora ? (
          <div>
            <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">
              State / Province
            </label>
            <input
              aria-label="State or Province"
              id="input-c53526"
              type="text"
              name="stateProvince"
              value={formData.stateProvince}
              onChange={onChange}
              className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm"
              placeholder="State or Province"
            />
          </div>
        ) : (
          <div>
            <label className="block text-micro font-bold text-stone-900 tracking-tight mb-2">
              Region
            </label>
            <select
              id="select-12f928"
              name="region"
              value={formData.region}
              onChange={onChange}
              className="w-full h-12 bg-stone-50 border-stone-200 focus:border-[var(--brand-green)] focus:ring-1 focus:ring-[var(--brand-green)] transition-all px-4 rounded-sm text-sm appearance-none"
            >
              {dbRegions.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
              {dbRegions.length === 0 && <option value="Greater Accra">Greater Accra</option>}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
