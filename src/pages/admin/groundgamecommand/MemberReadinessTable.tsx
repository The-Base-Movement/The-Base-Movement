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
              fontWeight: 'var(--font-weight-normal, 400)',
              marginTop: 2,
            }}
          >
            Polling station codes submitted by members — use this to coordinate election-day
            logistics by constituency.
          </p>
        </div>
      </div>

      {/* Readiness KPIs — horizontal scroll slider */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollbarWidth: 'none',
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
              flex: '0 0 160px',
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
                fontWeight: 'var(--font-weight-medium, 500)',
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
                fontWeight: 'var(--font-weight-medium, 500)',
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
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans'",
              fontSize: 12,
              fontWeight: 'var(--font-weight-medium, 500)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>
        <select
          value={readinessFilter}
          onChange={(e) =>
            setReadinessFilter(
              e.target.value as 'ALL' | 'VERIFIED_VOTER' | 'IN_PROGRESS' | 'UNVERIFIED'
            )
          }
          style={{
            height: 34,
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
            fontFamily: "'Public Sans'",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 12,
            color: 'hsl(var(--on-surface))',
            background: 'hsl(var(--background))',
            padding: '0 10px',
            boxSizing: 'border-box',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="ALL">All statuses</option>
          <option value="VERIFIED_VOTER">Verified</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="UNVERIFIED">Unverified</option>
        </select>
      </div>

      {/* Table — desktop */}
      <div className="desktop-only">
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
                      fontWeight: 'var(--font-weight-medium, 500)',
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
                      fontWeight: 'var(--font-weight-normal, 400)',
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
                          i < filteredVoterRegs.length - 1
                            ? '1px solid hsl(var(--border))'
                            : 'none',
                      }}
                    >
                      <td
                        style={{
                          padding: '11px 18px',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12.5,
                        }}
                      >
                        {r.member_name}
                      </td>
                      <td
                        style={{
                          padding: '11px 18px',
                          fontSize: 11.5,
                          color: 'hsl(var(--on-surface-muted))',
                          fontWeight: 'var(--font-weight-normal, 400)',
                        }}
                      >
                        {r.registration_number || '—'}
                      </td>
                      <td
                        style={{
                          padding: '11px 18px',
                          fontSize: 11.5,
                          fontWeight: 'var(--font-weight-normal, 400)',
                        }}
                      >
                        {r.chapter || (
                          <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '11px 18px',
                          fontSize: 11.5,
                          fontWeight: 'var(--font-weight-normal, 400)',
                        }}
                      >
                        {r.constituency || (
                          <span style={{ color: 'hsl(var(--on-surface-muted))' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '11px 18px' }}>
                        {r.polling_station_id ? (
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 12,
                              background: 'hsl(var(--container-low))',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-xs)',
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
                              fontWeight: 'var(--font-weight-normal, 400)',
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
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            Showing {filteredVoterRegs.length} of {voterRegs.length} records
          </div>
        )}
      </div>

      {/* Card list — mobile */}
      <div className="mobile-only">
        {filteredVoterRegs.length === 0 ? (
          <p
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {voterRegs.length === 0
              ? 'No members have submitted a polling station code yet.'
              : 'No results match your search.'}
          </p>
        ) : (
          filteredVoterRegs.map((r, i) => {
            const isStationAgent = pollingAgentMemberIds.has(r.user_id)
            return (
              <div
                key={r.id}
                style={{
                  padding: '12px 16px',
                  borderBottom:
                    i < filteredVoterRegs.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                {/* Row 1: name + reg / status pill */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {r.member_name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: 2,
                      }}
                    >
                      {r.registration_number || '—'}
                    </div>
                  </div>
                  <span
                    className={
                      r.registration_status === 'VERIFIED_VOTER'
                        ? 'pill pill-ok'
                        : r.registration_status === 'IN_PROGRESS'
                          ? 'pill pill-warn'
                          : 'pill pill-mute'
                    }
                    style={{ fontSize: 9.5, flexShrink: 0 }}
                  >
                    {r.registration_status === 'VERIFIED_VOTER'
                      ? 'Verified'
                      : r.registration_status === 'IN_PROGRESS'
                        ? 'In progress'
                        : 'Unverified'}
                  </span>
                </div>
                {/* Row 2: polling station code / appoint button */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <div>
                    {r.polling_station_id ? (
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 11.5,
                          background: 'hsl(var(--container-low))',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-xs)',
                          letterSpacing: '.04em',
                        }}
                      >
                        {r.polling_station_id}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'hsl(var(--on-surface-muted))',
                          fontWeight: 'var(--font-weight-normal, 400)',
                        }}
                      >
                        No code submitted
                      </span>
                    )}
                  </div>
                  {r.polling_station_id &&
                    (isStationAgent ? (
                      <span className="pill pill-ok" style={{ fontSize: 9.5, flexShrink: 0 }}>
                        Station agent
                      </span>
                    ) : (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{
                          fontSize: 10.5,
                          padding: '3px 10px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                        onClick={() => openStationModal(r)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                          add
                        </span>
                        Appoint
                      </button>
                    ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
