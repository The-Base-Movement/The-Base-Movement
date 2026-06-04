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
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-bold, 700)',
    color: 'hsl(var(--on-surface))',
    letterSpacing: '-0.005em',
    marginBottom: 8,
    fontFamily: "'Public Sans', sans-serif",
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    background: 'hsl(var(--container-low))',
    border: '1px solid hsl(var(--border))',
    outline: 'none',
    boxSizing: 'border-box',
    padding: '0 16px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    fontFamily: "'Public Sans', sans-serif",
    color: 'hsl(var(--on-surface))',
    transition: 'border-color 0.15s ease',
  }

  return (
    <div
      className="panel"
      style={{
        padding: 24,
        background: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: 'hsl(var(--primary) / 10%)',
            borderRadius: 'var(--radius-pill)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
          >
            local_shipping
          </span>
        </div>
        <h2
          className="font-h3 text-xl"
          style={{
            margin: 0,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-semibold, 600)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          1. Delivery Information
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        <div style={{ gridColumn: 'span 2' }}>
          <label htmlFor="input-9f4084" style={labelStyle}>
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
            style={inputStyle}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label htmlFor="input-94b596" style={labelStyle}>
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
            style={inputStyle}
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label htmlFor="input-6781fb" style={labelStyle}>
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
            style={inputStyle}
            placeholder="+233 00 000 0000"
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label htmlFor="input-5705f2" style={labelStyle}>
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
            style={inputStyle}
            placeholder="House Number, Street Name"
          />
        </div>
        <div>
          <label htmlFor="select-5d78b8" style={labelStyle}>
            Country
          </label>
          <select
            id="select-5d78b8"
            name="country"
            value={formData.country}
            onChange={onChange}
            style={{ ...inputStyle, paddingRight: 40 }}
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
            <label htmlFor="input-c53526" style={labelStyle}>
              State / Province
            </label>
            <input
              aria-label="State or Province"
              id="input-c53526"
              type="text"
              name="stateProvince"
              value={formData.stateProvince}
              onChange={onChange}
              style={inputStyle}
              placeholder="State or Province"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="select-12f928" style={labelStyle}>
              Region
            </label>
            <select
              id="select-12f928"
              name="region"
              value={formData.region}
              onChange={onChange}
              style={{ ...inputStyle, paddingRight: 40 }}
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
