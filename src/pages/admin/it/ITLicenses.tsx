import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useITLayout } from './ITLayoutContext'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'Domain' | 'Hosting' | 'SaaS' | 'API'
type BillingCycle = 'Monthly' | 'Yearly'
type LicenseStatus = 'Active' | 'Inactive' | 'Cancelled'

interface License {
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

type LicenseFormData = Omit<License, 'id' | 'created_at'>

const EMPTY_FORM: LicenseFormData = {
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

const CATEGORIES: Category[] = ['Domain', 'Hosting', 'SaaS', 'API']
const DONUT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  '#6366f1',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function annualCost(l: License) {
  return l.billing_cycle === 'Yearly' ? l.cost : l.cost * 12
}

function monthlyCost(l: License) {
  return l.billing_cycle === 'Monthly' ? l.cost : l.cost / 12
}

function daysUntilRenewal(renewalDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const renewal = new Date(renewalDate)
  renewal.setHours(0, 0, 0, 0)
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function fmtCost(cost: number, cycle: BillingCycle) {
  return `GH₵ ${cost.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${cycle === 'Monthly' ? 'mo' : 'yr'}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtMoney(n: number) {
  return `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Input style ──────────────────────────────────────────────────────────────

const inputSt: React.CSSProperties = {
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

const labelSt: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  color: 'hsl(var(--on-surface-muted))',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 6,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ITLicenses() {
  useITLayout('Licenses', 'license', 'Track software subscriptions, domains, and renewals.')

  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'All'>('All')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All')
  const [modal, setModal] = useState<{
    mode: 'add' | 'edit'
    data: LicenseFormData
    id?: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<License | null>(null)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<License | null>(null)
  const [saving, setSaving] = useState(false)

  const loadLicenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('it_licenses')
      .select('*')
      .order('renewal_date', { ascending: true })
    if (error) {
      toast.error('Failed to load licenses')
      return
    }
    setLicenses((data ?? []) as License[])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLicenses()
  }, [loadLicenses])

  // ── Derived values ──
  const active = useMemo(() => licenses.filter((l) => l.status === 'Active'), [licenses])

  const kpis = useMemo(() => {
    const totalCount = licenses.filter((l) => l.status !== 'Cancelled').length
    const monthlySpend = active.reduce((s, l) => s + monthlyCost(l), 0)
    const annualSpend = active.reduce((s, l) => s + annualCost(l), 0)
    const expiringSoon = active.filter((l) => {
      const d = daysUntilRenewal(l.renewal_date)
      return d >= 0 && d <= 30
    }).length
    return [
      { label: 'Total Licenses', value: totalCount, bar: 'hsl(var(--on-surface))' },
      { label: 'Monthly Spend', value: fmtMoney(monthlySpend), bar: 'hsl(var(--primary))' },
      { label: 'Annual Spend', value: fmtMoney(annualSpend), bar: 'hsl(var(--accent))' },
      { label: 'Expiring ≤ 30 days', value: expiringSoon, bar: 'hsl(var(--destructive))' },
    ]
  }, [licenses, active])

  const donutData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const l of active) totals[l.category] = (totals[l.category] ?? 0) + annualCost(l)
    const grand = Object.values(totals).reduce((s, v) => s + v, 0)
    return Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: grand > 0 ? Math.round((amount / grand) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [active])

  const filtered = useMemo(
    () =>
      licenses.filter((l) => {
        if (statusFilter !== 'All' && l.status !== statusFilter) return false
        if (categoryFilter !== 'All' && l.category !== categoryFilter) return false
        return true
      }),
    [licenses, statusFilter, categoryFilter]
  )

  // ── Mutations ──
  async function handleSave() {
    const d = modal!.data
    if (!d.software_name.trim()) {
      toast.error('Software name is required')
      return
    }
    if (!d.vendor.trim()) {
      toast.error('Vendor is required')
      return
    }
    if (!d.renewal_date) {
      toast.error('Renewal date is required')
      return
    }
    if (d.cost <= 0) {
      toast.error('Cost must be greater than 0')
      return
    }

    setSaving(true)
    const payload = {
      software_name: d.software_name.trim(),
      vendor: d.vendor.trim(),
      category: d.category,
      cost: d.cost,
      billing_cycle: d.billing_cycle,
      renewal_date: d.renewal_date,
      auto_renew: d.auto_renew,
      status: d.status,
      url: d.url?.trim() || null,
      notes: d.notes?.trim() || null,
    }
    const { error } =
      modal!.mode === 'add'
        ? await supabase.from('it_licenses').insert(payload)
        : await supabase.from('it_licenses').update(payload).eq('id', modal!.id!)
    setSaving(false)
    if (error) {
      toast.error('Failed to save license')
      return
    }
    toast.success(modal!.mode === 'add' ? 'License added' : 'License updated')
    setModal(null)
    await loadLicenses()
  }

  async function handleSoftDelete() {
    if (!deleteTarget) return
    setSaving(true)
    const { error } = await supabase
      .from('it_licenses')
      .update({ status: 'Cancelled' })
      .eq('id', deleteTarget.id)
    setSaving(false)
    if (error) {
      toast.error('Failed to cancel license')
      return
    }
    toast.success(`${deleteTarget.software_name} cancelled`)
    setDeleteTarget(null)
    await loadLicenses()
  }

  async function handleHardDelete() {
    if (!hardDeleteTarget) return
    setSaving(true)
    const { error } = await supabase.from('it_licenses').delete().eq('id', hardDeleteTarget.id)
    setSaving(false)
    if (error) {
      toast.error('Failed to delete license')
      return
    }
    toast.success(`${hardDeleteTarget.software_name} permanently deleted`)
    setHardDeleteTarget(null)
    await loadLicenses()
  }

  function patchModal(patch: Partial<LicenseFormData>) {
    setModal((m) => (m ? { ...m, data: { ...m.data, ...patch } } : null))
  }

  // ── Render ──
  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      {/* KPI strip */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {loading ? '—' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + table layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: donutData.length ? '260px 1fr' : '1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Donut chart */}
        {donutData.length > 0 && (
          <div className="panel" style={{ padding: 20 }}>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Annual Spend by Category
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => fmtMoney(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 12 }}>
              {donutData.map((item, i) => (
                <div
                  key={item.category}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 0',
                    fontSize: 12,
                    borderBottom:
                      i < donutData.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: DONUT_COLORS[i % DONUT_COLORS.length],
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: 'hsl(var(--on-surface))' }}>{item.category}</span>
                  </div>
                  <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table panel */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Filters + Add button */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              background: 'hsl(var(--container-low))',
            }}
          >
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(['All', 'Active', 'Inactive', 'Cancelled'] as const).map((s) => (
                <button
                  key={s}
                  className={
                    statusFilter === s ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'
                  }
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as Category | 'All')}
                style={{
                  height: 30,
                  padding: '0 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                  fontFamily: "'Public Sans', sans-serif",
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <option value="All">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setModal({ mode: 'add', data: { ...EMPTY_FORM } })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                add
              </span>
              Add License
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <p
              style={{
                padding: 20,
                margin: 0,
                fontSize: 13,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 13,
              }}
            >
              No licenses found.
              {statusFilter === 'All' && categoryFilter === 'All'
                ? ' Add one to get started.'
                : ' Try adjusting the filters.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'hsl(var(--container-low))' }}>
                    {[
                      'Software',
                      'Category',
                      'Cost',
                      'Renewal Date',
                      'Auto-renew',
                      'Status',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: 10,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'hsl(var(--on-surface-muted))',
                          borderBottom: '1px solid hsl(var(--border))',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => {
                    const days = l.status === 'Active' ? daysUntilRenewal(l.renewal_date) : Infinity
                    const isUrgent = days <= 7
                    const isWarning = days <= 30
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 'var(--font-weight-medium, 500)',
                              color: 'hsl(var(--on-surface))',
                            }}
                          >
                            {l.software_name}
                            {l.url && (
                              <a
                                href={l.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  marginLeft: 6,
                                  color: 'hsl(var(--primary))',
                                  verticalAlign: 'middle',
                                }}
                              >
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 13 }}
                                >
                                  open_in_new
                                </span>
                              </a>
                            )}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {l.vendor}
                          </p>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span className="pill pill-mute" style={{ fontSize: 10 }}>
                            {l.category}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 16px',
                            whiteSpace: 'nowrap',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {fmtCost(l.cost, l.billing_cycle)}
                        </td>
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                color: isWarning
                                  ? 'hsl(var(--destructive))'
                                  : 'hsl(var(--on-surface))',
                              }}
                            >
                              {isWarning && (
                                <span
                                  className="material-symbols-outlined"
                                  style={{ fontSize: 13, verticalAlign: 'middle', marginRight: 3 }}
                                >
                                  warning
                                </span>
                              )}
                              {fmtDate(l.renewal_date)}
                            </span>
                            {isUrgent && (
                              <span className="pill pill-err" style={{ fontSize: 9 }}>
                                Expires soon
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 16,
                              color: l.auto_renew ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                            }}
                          >
                            {l.auto_renew ? 'check_circle' : 'cancel'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span
                            className={
                              l.status === 'Active'
                                ? 'pill pill-ok'
                                : l.status === 'Inactive'
                                  ? 'pill pill-mute'
                                  : 'pill pill-err'
                            }
                          >
                            {l.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-outline btn-sm"
                              title="Edit"
                              onClick={() =>
                                setModal({
                                  mode: 'edit',
                                  id: l.id,
                                  data: {
                                    software_name: l.software_name,
                                    vendor: l.vendor,
                                    category: l.category,
                                    cost: l.cost,
                                    billing_cycle: l.billing_cycle,
                                    renewal_date: l.renewal_date,
                                    auto_renew: l.auto_renew,
                                    status: l.status,
                                    url: l.url ?? '',
                                    notes: l.notes ?? '',
                                  },
                                })
                              }
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                                edit
                              </span>
                            </button>
                            <button
                              className={
                                l.status === 'Cancelled'
                                  ? 'btn btn-dest btn-sm'
                                  : 'btn btn-outline-dest btn-sm'
                              }
                              title={
                                l.status === 'Cancelled' ? 'Permanently delete' : 'Cancel license'
                              }
                              onClick={() =>
                                l.status === 'Cancelled'
                                  ? setHardDeleteTarget(l)
                                  : setDeleteTarget(l)
                              }
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                                {l.status === 'Cancelled' ? 'delete_forever' : 'cancel'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {modal &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
              onClick={() => setModal(null)}
            />
            <div
              style={{
                position: 'relative',
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: 560,
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                fontFamily: "'Public Sans', sans-serif",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {modal.mode === 'add' ? 'Add License' : 'Edit License'}
                </h3>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelSt} htmlFor="lic-name">
                      Software Name *
                    </label>
                    <input
                      id="lic-name"
                      name="licName"
                      type="text"
                      autoComplete="off"
                      value={modal.data.software_name}
                      onChange={(e) => patchModal({ software_name: e.target.value })}
                      placeholder="e.g. Vercel"
                      style={inputSt}
                    />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="lic-vendor">
                      Vendor *
                    </label>
                    <input
                      id="lic-vendor"
                      name="licVendor"
                      type="text"
                      autoComplete="off"
                      value={modal.data.vendor}
                      onChange={(e) => patchModal({ vendor: e.target.value })}
                      placeholder="e.g. Vercel Inc."
                      style={inputSt}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelSt} htmlFor="lic-category">
                      Category *
                    </label>
                    <select
                      id="lic-category"
                      name="licCategory"
                      value={modal.data.category}
                      onChange={(e) => patchModal({ category: e.target.value as Category })}
                      style={inputSt}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="lic-status">
                      Status *
                    </label>
                    <select
                      id="lic-status"
                      name="licStatus"
                      value={modal.data.status}
                      onChange={(e) => patchModal({ status: e.target.value as LicenseStatus })}
                      style={inputSt}
                    >
                      {(['Active', 'Inactive', 'Cancelled'] as LicenseStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelSt} htmlFor="lic-cost">
                      Cost (GH₵) *
                    </label>
                    <input
                      id="lic-cost"
                      name="licCost"
                      type="number"
                      min="0"
                      step="0.01"
                      autoComplete="off"
                      value={modal.data.cost || ''}
                      onChange={(e) => patchModal({ cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      style={inputSt}
                    />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="lic-cycle">
                      Billing Cycle *
                    </label>
                    <select
                      id="lic-cycle"
                      name="licCycle"
                      value={modal.data.billing_cycle}
                      onChange={(e) =>
                        patchModal({ billing_cycle: e.target.value as BillingCycle })
                      }
                      style={inputSt}
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    alignItems: 'end',
                  }}
                >
                  <div>
                    <label style={labelSt} htmlFor="lic-renewal">
                      Renewal Date *
                    </label>
                    <input
                      id="lic-renewal"
                      name="licRenewal"
                      type="date"
                      autoComplete="off"
                      value={modal.data.renewal_date}
                      onChange={(e) => patchModal({ renewal_date: e.target.value })}
                      style={inputSt}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 2 }}>
                    <input
                      id="lic-autorenew"
                      name="licAutoRenew"
                      type="checkbox"
                      checked={modal.data.auto_renew}
                      onChange={(e) => patchModal({ auto_renew: e.target.checked })}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: 'hsl(var(--primary))',
                        cursor: 'pointer',
                      }}
                    />
                    <label
                      htmlFor="lic-autorenew"
                      style={{ fontSize: 13, color: 'hsl(var(--on-surface))', cursor: 'pointer' }}
                    >
                      Auto-renew
                    </label>
                  </div>
                </div>
                <div>
                  <label style={labelSt} htmlFor="lic-url">
                    URL (billing portal)
                  </label>
                  <input
                    id="lic-url"
                    name="licUrl"
                    type="url"
                    autoComplete="off"
                    value={modal.data.url ?? ''}
                    onChange={(e) => patchModal({ url: e.target.value })}
                    placeholder="https://billing.example.com"
                    style={inputSt}
                  />
                </div>
                <div>
                  <label style={labelSt} htmlFor="lic-notes">
                    Notes
                  </label>
                  <textarea
                    id="lic-notes"
                    name="licNotes"
                    autoComplete="off"
                    value={modal.data.notes ?? ''}
                    onChange={(e) => patchModal({ notes: e.target.value })}
                    rows={3}
                    placeholder="Account email, seat count, login details…"
                    style={{ ...inputSt, padding: '8px 12px', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                }}
              >
                <button
                  className="btn btn-outline"
                  onClick={() => setModal(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : modal.mode === 'add' ? 'Add License' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Soft-delete confirm */}
      {deleteTarget &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
              onClick={() => setDeleteTarget(null)}
            />
            <div
              style={{
                position: 'relative',
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: 400,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--destructive))',
                  }}
                >
                  Cancel License
                </h3>
              </div>
              <div style={{ padding: 24 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.6,
                  }}
                >
                  Mark <strong>{deleteTarget.software_name}</strong> as Cancelled? It will be kept
                  in history but hidden from Active/Inactive views.
                </p>
              </div>
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setDeleteTarget(null)}
                  disabled={saving}
                >
                  Keep
                </button>
                <button
                  className="btn btn-dest btn-sm"
                  onClick={handleSoftDelete}
                  disabled={saving}
                >
                  {saving ? 'Cancelling…' : 'Cancel License'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Hard-delete confirm */}
      {hardDeleteTarget &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }}
              onClick={() => setHardDeleteTarget(null)}
            />
            <div
              style={{
                position: 'relative',
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: 400,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'hsl(var(--destructive))',
                  }}
                >
                  Permanently Delete
                </h3>
              </div>
              <div style={{ padding: 24 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1.6,
                  }}
                >
                  Permanently delete <strong>{hardDeleteTarget.software_name}</strong>? This cannot
                  be undone.
                </p>
              </div>
              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setHardDeleteTarget(null)}
                  disabled={saving}
                >
                  Keep
                </button>
                <button
                  className="btn btn-dest btn-sm"
                  onClick={handleHardDelete}
                  disabled={saving}
                >
                  {saving ? 'Deleting…' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
