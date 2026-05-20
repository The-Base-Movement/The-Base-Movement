type VoterRow = {
  id: string
  user_id: string
  registration_status: 'UNVERIFIED' | 'IN_PROGRESS' | 'VERIFIED_VOTER'
  polling_station_id: string | null
  member_name: string
  registration_number: string
  chapter: string | null
  constituency: string | null
  region: string | null
  created_at: string
}

interface MemberReadinessTableProps {
  voterRegs: VoterRow[]
  filteredVoterRegs: VoterRow[]
  submittedCount: number
  verifiedCount: number
  inProgressCount: number
  unverifiedCount: number
  readinessSearch: string
  setReadinessSearch: (val: string) => void
  readinessFilter: 'ALL' | 'VERIFIED_VOTER' | 'IN_PROGRESS' | 'UNVERIFIED'
  setReadinessFilter: (val: 'ALL' | 'VERIFIED_VOTER' | 'IN_PROGRESS' | 'UNVERIFIED') => void
  pollingAgentMemberIds: Set<string>
  openStationModal: (row: VoterRow) => void
}

export function MemberReadinessTable({
  voterRegs,
  filteredVoterRegs,
  submittedCount,
  verifiedCount,
  inProgressCount,
  unverifiedCount,
  readinessSearch,
  setReadinessSearch,
  readinessFilter,
  setReadinessFilter,
  pollingAgentMemberIds,
  openStationModal,
}: MemberReadinessTableProps) {
  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <div className="ph">
        <div>
          <h3>Member readiness</h3>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans'",
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            Polling station codes submitted by members — use this to coordinate election-day
            logistics by constituency.
          </p>
        </div>
      </div>

      {/* Readiness KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10,
          padding: '14px 18px 18px',
        }}
      >
        {[
          { label: 'Codes submitted', value: submittedCount, bar: 'hsl(var(--primary))' },
          { label: 'Verified voters', value: verifiedCount, bar: 'hsl(var(--primary))' },
          { label: 'In progress', value: inProgressCount, bar: 'hsl(var(--accent))' },
          { label: 'Unverified', value: unverifiedCount, bar: 'hsl(var(--on-surface-muted))' },
        ].map((k) => (
          <div
            key={k.label}
            className="panel"
            style={{
              padding: '14px 16px 14px 20px',
              position: 'relative',
              overflow: 'hidden',
              margin: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: k.bar,
              }}
            />
            <div
              style={{
                fontFamily: "'Public Sans'",
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: '-.02em',
                lineHeight: 1,
              }}
            >
              {k.value}
            </div>
            <div
              style={{
                fontFamily: "'Public Sans'",
                fontWeight: 700,
                fontSize: 10.5,
                color: 'hsl(var(--on-surface-muted))',
                marginTop: 4,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}
            >
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div
        style={{
          padding: '0 18px 14px',
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 16,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            search
          </span>
          <input
            id="readiness-search"
            name="readinessSearch"
            aria-label="Search members by name, reg number, chapter or constituency"
            value={readinessSearch}
            onChange={(e) => setReadinessSearch(e.target.value)}
            placeholder="Search name, reg#, chapter, constituency…"
            style={{
              width: '100%',
              paddingLeft: 34,
              paddingRight: 12,
              height: 34,
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              fontFamily: "'Public Sans'",
              fontSize: 12,
              fontWeight: 700,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        {(['ALL', 'VERIFIED_VOTER', 'IN_PROGRESS', 'UNVERIFIED'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setReadinessFilter(f)}
            style={{
              padding: '5px 14px',
              borderRadius: 99,
              border: '1px solid hsl(var(--border))',
              fontFamily: "'Public Sans'",
              fontWeight: 800,
              fontSize: 10.5,
              cursor: 'pointer',
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              background: readinessFilter === f ? 'hsl(var(--primary))' : 'transparent',
              color: readinessFilter === f ? '#fff' : 'hsl(var(--on-surface-muted))',
              transition: 'all .15s',
            }}
          >
            {f === 'ALL'
              ? 'All'
              : f === 'VERIFIED_VOTER'
                ? 'Verified'
                : f === 'IN_PROGRESS'
                  ? 'In progress'
                  : 'Unverified'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Public Sans'" }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid hsl(var(--border))',
                background: 'hsl(var(--container-low))',
              }}
            >
              {[
                'Member',
                'Reg #',
                'Chapter',
                'Constituency',
                'Polling station code',
                'Status',
                '',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '9px 18px',
                    textAlign: 'left',
                    fontWeight: 800,
                    fontSize: 10,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredVoterRegs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '32px 18px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {voterRegs.length === 0
                    ? 'No members have submitted a polling station code yet.'
                    : 'No results match your search.'}
                </td>
              </tr>
            ) : (
              filteredVoterRegs.map((r, i) => {
                const isStationAgent = pollingAgentMemberIds.has(r.user_id)
                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom:
                        i < filteredVoterRegs.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    }}
                  >
                    <td style={{ padding: '11px 18px', fontWeight: 800, fontSize: 12.5 }}>
                      {r.member_name}
                    </td>
                    <td
                      style={{
                        padding: '11px 18px',
                        fontSize: 11.5,
                        color: 'hsl(var(--on-surface-muted))',
                        fontWeight: 700,
                      }}
                    >
                      {r.registration_number || '—'}
                    </td>
                    <td style={{ padding: '11px 18px', fontSize: 11.5, fontWeight: 700 }}>
                      {r.chapter || (
                        <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 18px', fontSize: 11.5, fontWeight: 700 }}>
                      {r.constituency || (
                        <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 18px' }}>
                      {r.polling_station_id ? (
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: 12,
                            background: 'hsl(var(--container-low))',
                            padding: '3px 8px',
                            borderRadius: 4,
                            letterSpacing: '.04em',
                          }}
                        >
                          {r.polling_station_id}
                        </span>
                      ) : (
                        <span
                          style={{
                            color: 'hsl(var(--on-surface-muted))',
                            fontSize: 11.5,
                            fontWeight: 700,
                          }}
                        >
                          Not submitted
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '11px 18px' }}>
                      <span
                        className={
                          r.registration_status === 'VERIFIED_VOTER'
                            ? 'pill pill-ok'
                            : r.registration_status === 'IN_PROGRESS'
                              ? 'pill pill-warn'
                              : 'pill pill-mute'
                        }
                        style={{ fontSize: 9.5 }}
                      >
                        {r.registration_status === 'VERIFIED_VOTER'
                          ? 'Verified'
                          : r.registration_status === 'IN_PROGRESS'
                            ? 'In progress'
                            : 'Unverified'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 18px' }}>
                      {r.polling_station_id &&
                        (isStationAgent ? (
                          <span className="pill pill-ok" style={{ fontSize: 9.5 }}>
                            Station agent
                          </span>
                        ) : (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: 10.5, padding: '3px 10px', whiteSpace: 'nowrap' }}
                            onClick={() => openStationModal(r)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                              add
                            </span>
                            Appoint
                          </button>
                        ))}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredVoterRegs.length > 0 && (
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid hsl(var(--border))',
            fontFamily: "'Public Sans'",
            fontWeight: 700,
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Showing {filteredVoterRegs.length} of {voterRegs.length} records
        </div>
      )}
    </div>
  )
}
