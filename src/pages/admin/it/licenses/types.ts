import type React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Category = 'Domain' | 'Hosting' | 'SaaS' | 'API'
export type BillingCycle = 'Monthly' | 'Yearly'
export type LicenseStatus = 'Active' | 'Inactive' | 'Cancelled'

export interface License {
  id: string
  software_name: string
  vendor: string
  category: Category
  cost: number
  billing_cycle: BillingCycle
  renewal_date: string
  auto_renew: boolean
  status: LicenseStatus
  url: string | null
  notes: string | null
  created_at: string
}

export type LicenseFormData = Omit<License, 'id' | 'created_at'>

// ─── Constants ────────────────────────────────────────────────────────────────

export const EMPTY_FORM: LicenseFormData = {
  software_name: '',
  vendor: '',
  category: 'SaaS',
  cost: 0,
  billing_cycle: 'Yearly',
  renewal_date: '',
  auto_renew: false,
  status: 'Active',
  url: '',
  notes: '',
}

export const CATEGORIES: Category[] = ['Domain', 'Hosting', 'SaaS', 'API']
export const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  '#6366f1',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function annualCost(l: License) {
  return l.billing_cycle === 'Yearly' ? l.cost : l.cost * 12
}

export function monthlyCost(l: License) {
  return l.billing_cycle === 'Monthly' ? l.cost : l.cost / 12
}

export function daysUntilRenewal(renewalDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const renewal = new Date(renewalDate)
  renewal.setHours(0, 0, 0, 0)
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function fmtCost(cost: number, cycle: BillingCycle) {
  return `GH₵ ${cost.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${cycle === 'Monthly' ? 'mo' : 'yr'}`
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtMoney(n: number) {
  return `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Input styles ──────────────────────────────────────────────────────────────

export const inputSt: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid hsl(var(--border))',
  fontSize: 13,
  fontFamily: "'Public Sans', sans-serif",
  boxSizing: 'border-box',
  background: 'hsl(var(--background))',
  color: 'hsl(var(--on-surface))',
}

export const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 6,
}
