import { useState, useMemo } from 'react'
import type { ChapterDonation } from './types'
import { SortToggle } from '@/components/ui/SortToggle'

interface HubDonationsListProps {
  donations: ChapterDonation[]
  canSeePhone?: boolean
}

function firstName(full: string) {
  return full.split(' ')[0] || full
}

function maskPhone(phone: string) {
  if (phone.length <= 4) return '••••'
  return phone.slice(0, -4).replace(/./g, '•') + phone.slice(-4)
}

function donationStatusClass(status: string) {
  if (status === 'Verified') return 'pill-ok'
  if (status === 'Pending') return 'pill-warn'
  return 'pill-mute'
}

export function HubDonationsList({ donations, canSeePhone = false }: HubDonationsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const sortedDonations = useMemo(() => {
    const list = donations.filter((d) => {
      const q = searchQuery.toLowerCase()
      return (
        !q ||
        d.full_name.toLowerCase().includes(q) ||
        (d.reference && d.reference.toLowerCase().includes(q)) ||
        d.phone.includes(q)
      )
    })
    return list.sort((a, b) => {
      const nameA = a.full_name || ''
      const nameB = b.full_name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [donations, searchQuery, sortOrder])
  const searchBar = (
    <div
      style={{
        padding: '12px 18px',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'relative', flex: 1 }}>
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            color: 'hsl(var(--on-surface-muted))',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        >
          search
        </span>
        <input
          aria-label="Search by donor, phone, or reference"
          name="donationSearch"
          id="hub-donation-search"
          type="text"
          placeholder="Search by donor, phone, or reference..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            height: 38,
            paddingLeft: 38,
            paddingRight: 12,
            background: 'hsl(var(--container-low))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-xs)',
            fontSize: 13,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <SortToggle value={sortOrder} onChange={setSortOrder} />
    </div>
  )

  const emptyState = (
    <div
      style={{
        padding: '48px 18px',
        textAlign: 'center',
        fontSize: 13,
        color: 'hsl(var(--on-surface-muted))',
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      {donations.length === 0
        ? 'No donations from chapter members yet.'
        : 'No donations match your search.'}
    </div>
  )

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      {searchBar}
      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead
            style={{
              background: 'hsl(var(--container-low))',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <tr>
              {['Donor', 'Amount', 'Method', 'Reference', 'Date / Time', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '11px 18px',
                    textAlign: 'left',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 9,
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedDonations.length === 0 ? (
              <tr>
                <td colSpan={6}>{emptyState}</td>
              </tr>
            ) : (
              sortedDonations.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '12px 18px' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {firstName(d.full_name)}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {canSeePhone ? d.phone : maskPhone(d.phone)}
                    </p>
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                      fontFamily: "'Public Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`GH₵ ${Number(d.amount).toLocaleString()}`}
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {d.payment_method}
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontFamily: 'monospace',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {d.reference || '—'}
                  </td>
                  <td
                    style={{
                      padding: '12px 18px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {new Date(d.created_at).toLocaleDateString('en-GB')}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                        opacity: 0.7,
                      }}
                    >
                      {new Date(d.created_at).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </td>
                  <td style={{ padding: '12px 18px' }}>
                    <span className={`pill ${donationStatusClass(d.status)}`}>{d.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="mobile-only">
        {sortedDonations.length === 0 ? (
          emptyState
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sortedDonations.map((d) => (
              <div
                key={d.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid hsl(var(--border))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {/* Top row: name + amount */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {firstName(d.full_name)}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {canSeePhone ? d.phone : maskPhone(d.phone)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                      fontFamily: "'Public Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {`GH₵ ${Number(d.amount).toLocaleString()}`}
                  </span>
                </div>

                {/* Bottom row: date + method + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {new Date(d.created_at).toLocaleDateString('en-GB')}{' '}
                    {new Date(d.created_at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    · {d.payment_method}
                  </span>
                  <span className={`pill ${donationStatusClass(d.status)}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
