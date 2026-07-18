/**
 * Import Sync Page Component
 * -------------------------------------------------------------
 * Read-only monitor for the automated member auth-provisioning pipeline.
 * Each bulk import triggers `backfill-auth` (auto mode); every run that does
 * work is logged to `import_audit`. This page surfaces those runs, the current
 * provisioning backlog, and high-confidence duplicate members (shared phone/email).
 */

import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import type { ImportAuditRecord } from '@/services/adminService'

// Format ISO timestamps into British standard format
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ImportSync() {
  const [runs, setRuns] = useState<ImportAuditRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRuns(await adminService.getImportAudits())
    } catch {
      // RLS blocks non-admins; fail silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(), 0)
    return () => clearTimeout(timer)
  }, [load])

  const totalProvisioned = runs.reduce((sum, r) => sum + (r.provisioned ?? 0), 0)
  const latest = runs[0]
  const unlinked = latest?.report?.unlinked_total
  const dupGroups = latest?.report?.dup_contact_groups
  const dupList = latest?.report?.dup_contact ?? []

  const kpis = [
    { label: 'Sync Runs', value: runs.length, bar: 'hsl(var(--on-surface))' },
    { label: 'Accounts Provisioned', value: totalProvisioned, bar: 'hsl(var(--primary))' },
    { label: 'Unlinked (latest)', value: unlinked ?? '—', bar: 'hsl(var(--accent))' },
    { label: 'Duplicate Members', value: dupGroups ?? '—', bar: 'hsl(var(--destructive))' },
  ]

  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Import Sync
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>
            Automated auth-account provisioning for bulk member imports
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* KPIs */}
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
              {loading
                ? '—'
                : typeof kpi.value === 'number'
                  ? kpi.value.toLocaleString()
                  : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Runs table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div
          className="ph"
          style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Sync Runs
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Only runs that provisioned or failed accounts are recorded
            </p>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 14,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 28,
                display: 'block',
                marginBottom: 8,
                animation: 'spin 1s linear infinite',
              }}
            >
              progress_activity
            </span>
            Loading sync history…
          </div>
        ) : runs.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 14,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 36, display: 'block', marginBottom: 8 }}
            >
              sync
            </span>
            No sync runs yet — they appear here after the next bulk import
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'hsl(var(--container-low))' }}>
                  {[
                    'When',
                    'Source',
                    'Provisioned',
                    'By Phone',
                    'By Email',
                    'Failed',
                    'Unlinked',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
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
                {runs.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: i < runs.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'hsl(var(--on-surface))',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDateTime(r.ran_at)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="pill pill-mute">{r.source ?? 'auto'}</span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {r.provisioned.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'hsl(var(--on-surface-muted))' }}>
                      {r.via_phone.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'hsl(var(--on-surface-muted))' }}>
                      {r.via_email.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color:
                          r.failed > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {r.failed.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'hsl(var(--on-surface-muted))' }}>
                      {r.report?.unlinked_total ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Duplicate members (from the latest run's report) */}
      {!loading && dupList.length > 0 && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            className="ph"
            style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Duplicate Members
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                High-confidence — members sharing the same phone or email
              </p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'hsl(var(--container-low))' }}>
                  {['Match', 'Shared Value', 'Count', 'Registration Numbers'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
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
                {dupList.map((d, i) => (
                  <tr
                    key={`${d.by}-${d.key}`}
                    style={{
                      borderBottom:
                        i < dupList.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`pill ${d.by === 'email' ? 'pill-warn' : 'pill-mute'}`}>
                        {d.by}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        color: 'hsl(var(--on-surface))',
                        wordBreak: 'break-all',
                      }}
                    >
                      {d.key}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {d.count}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'hsl(var(--on-surface-muted))' }}>
                      {(d.regs ?? []).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
