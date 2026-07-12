import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { royaltyPointsService } from '@/services/royaltyPointsService'
import type { RoyaltyPointsAdminData, RoyaltyPointsSource } from '@/types/royaltyPoints'

const FONT = "'Public Sans', sans-serif"

const SOURCE_LABELS: Record<RoyaltyPointsSource, string> = {
  referral_registration: 'Referral — registration',
  referral_verification: 'Referral — verification',
  store_purchase: 'Store purchase',
  monthly_dues: 'Monthly dues',
  donation: 'Donation',
  rally_attendance: 'Rally attendance',
  manual_adjustment: 'Manual adjustment',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: FONT,
  display: 'block',
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  height: 34,
  width: '100%',
  padding: '0 10px',
  borderRadius: 'var(--radius-xs)',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--background))',
  color: 'hsl(var(--on-surface))',
  fontSize: 13,
  fontFamily: FONT,
  boxSizing: 'border-box',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  fontWeight: 'var(--font-weight-medium, 500)',
  borderBottom: '1px solid hsl(var(--border))',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12.5,
  fontFamily: FONT,
  color: 'hsl(var(--on-surface))',
  borderBottom: '1px solid hsl(var(--border))',
  whiteSpace: 'nowrap',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Finance settings card for the five Royalty Points earning rates. */
function RatesPanel({
  settings,
  onSaved,
}: {
  settings: NonNullable<RoyaltyPointsAdminData['settings']> | null
  onSaved: () => void
}) {
  // Parent remounts this panel (via key) once settings load, so state can
  // initialize straight from props.
  const [referralReg, setReferralReg] = useState(() =>
    String(settings?.referralRegistrationPoints ?? 50)
  )
  const [referralVer, setReferralVer] = useState(() =>
    String(settings?.referralVerificationPoints ?? 25)
  )
  const [storeRate, setStoreRate] = useState(() => String(settings?.storePointsPerGhs ?? 1))
  const [duesRate, setDuesRate] = useState(() => String(settings?.monthlyDuesPointsPerGhs ?? 1))
  const [donationRate, setDonationRate] = useState(() =>
    String(settings?.donationPointsPerGhs ?? 1)
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const values = {
      referralRegistrationPoints: Number(referralReg),
      referralVerificationPoints: Number(referralVer),
      storePointsPerGhs: Number(storeRate),
      monthlyDuesPointsPerGhs: Number(duesRate),
      donationPointsPerGhs: Number(donationRate),
    }
    if (Object.values(values).some((v) => !Number.isFinite(v) || v < 0)) {
      setError('All rates must be zero or greater.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await royaltyPointsService.updateSettings(values)
      toast.success('Earning rates saved.')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the rates.')
    } finally {
      setSaving(false)
    }
  }

  const fields: [string, string, (v: string) => void][] = [
    ['Referral registration (pts)', referralReg, setReferralReg],
    ['Referral verification (pts)', referralVer, setReferralVer],
    ['Store (pts per GH₵)', storeRate, setStoreRate],
    ['Monthly dues (pts per GH₵)', duesRate, setDuesRate],
    ['Donations (pts per GH₵)', donationRate, setDonationRate],
  ]

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div className="ph" style={{ padding: 0, marginBottom: 14, border: 'none' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontFamily: FONT }}>Earning Rates</h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: FONT,
            }}
          >
            Financial awards round down to whole points. Rate changes never recalculate past awards.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {fields.map(([label, value, set]) => (
          <div key={label}>
            <label htmlFor={`rate-${label}`} style={labelStyle}>
              {label}
            </label>
            <input
              id={`rate-${label}`}
              aria-label={label}
              type="number"
              min={0}
              step="0.01"
              value={value}
              onChange={(e) => set(e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {error && (
        <p
          style={{
            margin: '0 0 12px',
            fontSize: 12,
            color: 'hsl(var(--destructive))',
            fontFamily: FONT,
          }}
        >
          {error}
        </p>
      )}

      <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          save
        </span>
        Save rates
      </button>
    </div>
  )
}

/** Manual add/deduct dialog with member lookup and a mandatory reason. */
function AdjustModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<
    { id: string; name: string; registrationNumber: string }[]
  >([])
  const [member, setMember] = useState<{ id: string; name: string } | null>(null)
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      if (member || query.trim().length < 2) {
        setResults([])
        return
      }
      royaltyPointsService
        .searchMembers(query)
        .then(setResults)
        .catch(() => setResults([]))
    }, 250)
    return () => clearTimeout(t)
  }, [query, member])

  const handleSubmit = async () => {
    const amount = Number(points)
    if (!member) {
      setError('Select a member first.')
      return
    }
    if (!Number.isInteger(amount) || amount === 0) {
      setError('The adjustment must be a non-zero whole number.')
      return
    }
    if (!reason.trim()) {
      setError('A reason is required.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await royaltyPointsService.adjustMemberPoints(member.id, amount, reason.trim())
      toast.success(`${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} points.`)
      onDone()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'The adjustment failed.')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Manual points adjustment"
        style={{
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid hsl(var(--border))',
          padding: 20,
          width: 'min(420px, calc(100vw - 32px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontFamily: FONT }}>
          Manual points adjustment
        </h3>

        <label htmlFor="adjust-member" style={labelStyle}>
          Member
        </label>
        {member ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              fontSize: 13,
              fontFamily: FONT,
            }}
          >
            <span>{member.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setMember(null)}>
              Change
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              id="adjust-member"
              aria-label="Search member"
              placeholder="Name or registration number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={inputStyle}
            />
            {results.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setMember({ id: r.id, name: r.name })
                      setQuery('')
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: 12.5,
                      fontFamily: FONT,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {r.name}{' '}
                    <span style={{ color: 'hsl(var(--on-surface-muted))' }}>
                      {r.registrationNumber}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <label htmlFor="adjust-points" style={labelStyle}>
          Points (negative to deduct)
        </label>
        <input
          id="adjust-points"
          aria-label="Points"
          type="number"
          step={1}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        <label htmlFor="adjust-reason" style={labelStyle}>
          Reason (required)
        </label>
        <textarea
          id="adjust-reason"
          aria-label="Reason"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{
            ...inputStyle,
            height: 'auto',
            padding: 10,
            resize: 'vertical',
            marginBottom: 12,
          }}
        />

        {error && (
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 12,
              color: 'hsl(var(--destructive))',
              fontFamily: FONT,
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSubmit}>
            Apply adjustment
          </button>
        </div>
      </div>
    </div>
  )
}

/** Finance management page for the Royalty Points system. */
export default function RoyaltyPoints() {
  const [data, setData] = useState<RoyaltyPointsAdminData | null>(null)
  const [loading, setLoading] = useState(true)
  const [balanceSearch, setBalanceSearch] = useState('')
  const [ledgerSearch, setLedgerSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | RoyaltyPointsSource>('all')
  const [adjusting, setAdjusting] = useState(false)

  // Loading starts true; the refresh button re-arms it in the event handler.
  const load = useCallback(() => {
    royaltyPointsService
      .getAdminData()
      .then(setData)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Could not load Royalty Points data.')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refresh = () => {
    setLoading(true)
    load()
  }

  const balances = useMemo(() => {
    const q = balanceSearch.trim().toLowerCase()
    const rows = data?.balances ?? []
    if (!q) return rows
    return rows.filter(
      (b) => b.name.toLowerCase().includes(q) || b.registrationNumber.toLowerCase().includes(q)
    )
  }, [data, balanceSearch])

  const ledger = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase()
    let rows = data?.ledger ?? []
    if (sourceFilter !== 'all') rows = rows.filter((l) => l.sourceType === sourceFilter)
    if (q) {
      rows = rows.filter(
        (l) =>
          (l.name ?? '').toLowerCase().includes(q) ||
          (l.registrationNumber ?? '').toLowerCase().includes(q) ||
          (l.reason ?? '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [data, ledgerSearch, sourceFilter])

  const summary = data?.summary

  return (
    <div className="main">
      <AdminPageHeader
        title="Royalty Points"
        icon="workspace_premium"
        description="Members earn points automatically from referrals, store purchases, monthly dues, and donations. Manage earning rates, balances, and manual adjustments."
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={refresh} disabled={loading}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                refresh
              </span>
              Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setAdjusting(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                tune
              </span>
              Manual adjustment
            </button>
          </>
        }
      />

      <div className="kpis">
        <TacticalKPI
          label="Points issued"
          value={loading ? '—' : (summary?.totalPoints ?? 0).toLocaleString()}
          description="All-time net points"
          variant="green"
        />
        <TacticalKPI
          label="Members with points"
          value={loading ? '—' : (summary?.membersWithPoints ?? 0).toLocaleString()}
          description="Positive balances"
          variant="gold"
        />
        <TacticalKPI
          label="Issued this month"
          value={loading ? '—' : (summary?.pointsThisMonth ?? 0).toLocaleString()}
          description="Net points this month"
          variant="black"
        />
        <TacticalKPI
          label="Manual adjustments"
          value={loading ? '—' : (summary?.manualAdjustments ?? 0).toLocaleString()}
          description="Finance corrections"
          variant="red"
        />
      </div>

      <RatesPanel
        key={data?.settings ? 'loaded' : 'init'}
        settings={data?.settings ?? null}
        onSaved={load}
      />

      <div className="panel" style={{ padding: 20, marginTop: 16 }}>
        <div className="ph" style={{ padding: 0, marginBottom: 14, border: 'none' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 13, fontFamily: FONT }}>Member Balances</h3>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: FONT,
              }}
            >
              Net points per member, highest first.
            </p>
          </div>
          <input
            aria-label="Search balances"
            placeholder="Search name or reg no…"
            value={balanceSearch}
            onChange={(e) => setBalanceSearch(e.target.value)}
            style={{ ...inputStyle, width: 220 }}
          />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Member</th>
                <th style={thStyle}>Reg. No</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Balance</th>
                <th style={thStyle}>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {balances.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, color: 'hsl(var(--on-surface-muted))' }}>
                    {loading ? 'Loading…' : 'No member balances yet.'}
                  </td>
                </tr>
              )}
              {balances.map((b) => (
                <tr key={b.userId}>
                  <td style={tdStyle}>{b.name}</td>
                  <td style={{ ...tdStyle, color: 'hsl(var(--on-surface-muted))' }}>
                    {b.registrationNumber}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'right',
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {b.balance.toLocaleString()}
                  </td>
                  <td style={tdStyle}>{formatDate(b.lastActivity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ padding: 20, marginTop: 16 }}>
        <div className="ph" style={{ padding: 0, marginBottom: 14, border: 'none' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 13, fontFamily: FONT }}>Points Ledger</h3>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: FONT,
              }}
            >
              Every award and adjustment, newest first.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              aria-label="Filter by source"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              style={{ ...inputStyle, width: 180 }}
            >
              <option value="all">All sources</option>
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              aria-label="Search ledger"
              placeholder="Search…"
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              style={{ ...inputStyle, width: 180 }}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Member</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Points</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, color: 'hsl(var(--on-surface-muted))' }}>
                    {loading ? 'Loading…' : 'No ledger entries yet.'}
                  </td>
                </tr>
              )}
              {ledger.map((l) => (
                <tr key={l.id}>
                  <td style={tdStyle}>
                    {l.name ?? '—'}{' '}
                    <span style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 11 }}>
                      {l.registrationNumber ?? ''}
                    </span>
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: 'right',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: l.points < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))',
                    }}
                  >
                    {l.points > 0 ? `+${l.points.toLocaleString()}` : l.points.toLocaleString()}
                  </td>
                  <td style={tdStyle}>
                    <span
                      className={`pill ${l.sourceType === 'manual_adjustment' ? 'pill-warn' : 'pill-ok'}`}
                    >
                      {l.sourceType ? SOURCE_LABELS[l.sourceType] : 'Legacy'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'normal', maxWidth: 260 }}>
                    {l.reason ?? '—'}
                  </td>
                  <td style={tdStyle}>{formatDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {adjusting && (
        <AdjustModal
          onClose={() => setAdjusting(false)}
          onDone={() => {
            setAdjusting(false)
            load()
          }}
        />
      )}
    </div>
  )
}
