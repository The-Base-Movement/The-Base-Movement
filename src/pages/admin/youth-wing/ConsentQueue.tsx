import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  youthWingService,
  type YouthWingDirectoryRow,
  type YouthWingStatus,
} from '@/services/youthWingService'
import { YOUTH_STATUS_META, youthKpiBar } from './shared'

/**
 * Guardian-consent verification queue for the Youth Wing (14-17). Deliberately
 * separate from the adult KYC queue: adults are verified against a Ghana Card or
 * Voter ID, minors are verified by confirming consent with the guardian on the
 * number they gave. Nothing here touches public.users.
 */

const TABS: YouthWingStatus[] = ['PENDING_CONSENT', 'ACTIVE', 'REJECTED', 'GRADUATED']

const cellStyle: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: 'hsl(var(--on-surface))',
  borderBottom: '1px solid hsl(var(--border))',
  textAlign: 'left',
  verticalAlign: 'top',
}

const headStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 10,
  fontWeight: 'var(--font-weight-medium, 500)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'hsl(var(--on-surface-muted))',
  borderBottom: '1px solid hsl(var(--border))',
  textAlign: 'left',
}

export default function AdminYouthWingConsentQueue() {
  const [members, setMembers] = useState<YouthWingDirectoryRow[]>([])
  const [tab, setTab] = useState<YouthWingStatus>('PENDING_CONSENT')
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setMembers(await youthWingService.listDirectory())
    } catch (error) {
      toast.error((error as Error)?.message || 'Failed to load Youth Wing records.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load()
  }, [load])

  const counts = useMemo(
    () =>
      members.reduce<Record<string, number>>((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1
        return acc
      }, {}),
    [members]
  )

  const rows = useMemo(() => members.filter((m) => m.status === tab), [members, tab])

  async function approve(m: YouthWingDirectoryRow) {
    setBusyId(m.id)
    try {
      await youthWingService.approve(m.id)
      toast.success(`${m.membership_number} activated.`)
      await load()
    } catch (error) {
      toast.error((error as Error)?.message || 'Could not activate this record.')
    } finally {
      setBusyId(null)
    }
  }

  async function reject(m: YouthWingDirectoryRow) {
    const reason = window.prompt(`Why was consent not confirmed for ${m.membership_number}?`)
    if (reason === null) return
    setBusyId(m.id)
    try {
      await youthWingService.reject(m.id, reason.trim())
      toast.success(`${m.membership_number} marked not activated.`)
      await load()
    } catch (error) {
      toast.error((error as Error)?.message || 'Could not update this record.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Guardian consent queue"
        icon="verified_user"
        description="Youth Wing activation depends on a guardian confirming consent by phone. This is not identity verification: no Ghana Card or Voter ID is collected for under-18s."
      />

      <div className="kpis" style={{ marginBottom: 22 }}>
        {TABS.map((key) => (
          <div
            key={key}
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
                background: youthKpiBar(key),
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
              {YOUTH_STATUS_META[key].label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
              }}
            >
              {counts[key] || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          className="ph"
          style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--border))', gap: 8 }}
        >
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              className={`btn btn-sm ${tab === key ? 'btn-active-tab' : 'btn-inactive-tab'}`}
              onClick={() => setTab(key)}
            >
              {YOUTH_STATUS_META[key].label}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
            <thead>
              <tr>
                <th style={headStyle}>Member no.</th>
                <th style={headStyle}>Youth</th>
                <th style={headStyle}>Location</th>
                <th style={headStyle}>Guardian</th>
                <th style={headStyle}>Consent given</th>
                <th style={headStyle}>Status</th>
                <th style={headStyle} />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td style={cellStyle} colSpan={7}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td style={{ ...cellStyle, color: 'hsl(var(--on-surface-muted))' }} colSpan={7}>
                    Nothing here.
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.id}>
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>{m.membership_number}</td>
                    <td style={cellStyle}>
                      {m.full_name}
                      <div style={{ fontSize: 11.5, color: 'hsl(var(--on-surface-muted))' }}>
                        Age {m.age}
                        {m.gender ? ` · ${m.gender}` : ''}
                        {m.education_level ? ` · ${m.education_level}` : ''}
                        {m.school_name ? ` · ${m.school_name}` : ''}
                      </div>
                    </td>
                    <td style={cellStyle}>{m.region || m.country}</td>
                    <td style={cellStyle}>
                      {m.guardian_name}
                      <div style={{ fontSize: 11.5, color: 'hsl(var(--on-surface-muted))' }}>
                        {m.guardian_relationship} · {m.guardian_phone}
                      </div>
                    </td>
                    <td style={{ ...cellStyle, fontSize: 11.5 }}>
                      {m.consent_at ? new Date(m.consent_at).toLocaleString() : '—'}
                    </td>
                    <td style={cellStyle}>
                      <span className={`pill ${YOUTH_STATUS_META[m.status]?.pill ?? 'pill-mute'}`}>
                        {YOUTH_STATUS_META[m.status]?.label ?? m.status}
                      </span>
                      {m.rejection_reason && (
                        <div style={{ fontSize: 11.5, color: 'hsl(var(--on-surface-muted))' }}>
                          {m.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                      {m.is_over_age ? (
                        <span style={{ fontSize: 11.5, color: 'hsl(var(--on-surface-muted))' }}>
                          Over age
                        </span>
                      ) : (
                        <>
                          {m.status !== 'ACTIVE' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              disabled={busyId === m.id}
                              onClick={() => approve(m)}
                            >
                              Consent confirmed
                            </button>
                          )}{' '}
                          {m.status !== 'REJECTED' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-dest"
                              disabled={busyId === m.id}
                              onClick={() => reject(m)}
                            >
                              Not confirmed
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
