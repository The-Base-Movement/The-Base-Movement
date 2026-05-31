import { useNavigate } from 'react-router-dom'
import { type Member, adminService } from '@/services/adminService'
import MemberListCard from '@/components/admin/MemberListCard'

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
  color: 'hsl(var(--on-surface-muted))',
  fontFamily: "'Public Sans', sans-serif",
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid hsl(var(--border))',
  verticalAlign: 'middle',
}

interface MembersTableProps {
  members: Member[]
  isLoading: boolean
  searchTerm: string
  selectedIds: Set<string>
  lowBandwidthMode: boolean
  currentPage: number
  totalMembers: number
  itemsPerPage: number
  totalPages: number
  onToggleSelectAll: () => void
  onToggleSelect: (id: string) => void
  onViewAudit: (m: Member) => void
  onVerify: (id: string, name: string) => void
  onPrevPage: () => void
  onNextPage: () => void
}

export function MembersTable({
  members,
  isLoading,
  searchTerm,
  selectedIds,
  lowBandwidthMode,
  currentPage,
  totalMembers,
  itemsPerPage,
  totalPages,
  onToggleSelectAll,
  onToggleSelect,
  onViewAudit,
  onVerify,
  onPrevPage,
  onNextPage,
}: MembersTableProps) {
  const navigate = useNavigate()
  const startIndex = (currentPage - 1) * itemsPerPage

  return (
    <div className="panel" style={{ marginBottom: 14, overflow: 'hidden' }}>
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table className="members-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: 'hsl(var(--container-low))',
                borderBottom: '1px solid hsl(var(--border))',
              }}
            >
              <th style={{ ...thStyle, width: 40 }}>
                <input
                  name="name-4e22c5"
                  id="input-4e22c5"
                  type="checkbox"
                  checked={selectedIds.size === members.length && members.length > 0}
                  onChange={onToggleSelectAll}
                  style={{ cursor: 'pointer' }}
                  aria-label="Select all members"
                />
              </th>
              <th style={thStyle}>Member</th>
              <th style={thStyle}>Contact</th>
              <th style={thStyle}>Location</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td style={tdStyle} />
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: 'hsl(var(--border))',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            width: 120,
                            height: 11,
                            background: 'hsl(var(--border))',
                            borderRadius: 3,
                            marginBottom: 6,
                          }}
                        />
                        <div
                          style={{
                            width: 80,
                            height: 9,
                            background: 'hsl(var(--border))',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 100,
                        height: 10,
                        background: 'hsl(var(--border))',
                        borderRadius: 3,
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 90,
                        height: 10,
                        background: 'hsl(var(--border))',
                        borderRadius: 3,
                      }}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        width: 60,
                        height: 20,
                        background: 'hsl(var(--border))',
                        borderRadius: 99,
                      }}
                    />
                  </td>
                  <td style={tdStyle} />
                </tr>
              ))
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 36,
                      color: 'hsl(var(--border))',
                      display: 'block',
                      marginBottom: 10,
                    }}
                  >
                    {searchTerm ? 'search_off' : 'group'}
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                    }}
                  >
                    {searchTerm ? `No results for "${searchTerm}"` : 'No members yet'}
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 11.5,
                      color: 'hsl(var(--on-surface-muted))',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-normal, 400)',
                    }}
                  >
                    {searchTerm
                      ? 'Try adjusting your search terms.'
                      : 'Add the first member to get started.'}
                  </p>
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  style={!lowBandwidthMode ? { transition: 'background .15s' } : {}}
                  onMouseEnter={(e) => {
                    if (!lowBandwidthMode)
                      (e.currentTarget as HTMLElement).style.background =
                        'hsl(var(--container-low))'
                  }}
                  onMouseLeave={(e) => {
                    if (!lowBandwidthMode) (e.currentTarget as HTMLElement).style.background = ''
                  }}
                >
                  <td style={tdStyle}>
                    <input
                      name={`select-member-${member.id}`}
                      id={`input-select-${member.id}`}
                      type="checkbox"
                      checked={selectedIds.has(member.id)}
                      onChange={() => onToggleSelect(member.id)}
                      style={{ cursor: 'pointer' }}
                      aria-label={`Select ${member.name}`}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          border: '2px solid hsl(var(--border))',
                          overflow: 'hidden',
                          background: '#f1f5ee',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            decoding="async"
                            loading="lazy"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <span
                            style={{
                              fontFamily: "'Public Sans', sans-serif",
                              fontWeight: 'var(--font-weight-medium, 500)',
                              fontSize: 13,
                              color: 'hsl(var(--on-surface-muted))',
                            }}
                          >
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .substring(0, 2)}
                          </span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-medium, 500)',
                            fontSize: 13,
                          }}
                        >
                          {member.name}
                        </p>
                        <span
                          style={{
                            fontSize: 10.5,
                            color: 'hsl(var(--on-surface-muted))',
                            fontFamily: "'Public Sans', sans-serif",
                            fontWeight: 'var(--font-weight-normal, 400)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {member.id.substring(0, 12).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                      }}
                    >
                      {member.email || '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        marginTop: 2,
                      }}
                    >
                      {member.phone || '—'}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                      }}
                    >
                      {member.region || '—'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        marginTop: 2,
                      }}
                    >
                      {member.constituency || '—'}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span
                      className={
                        member.status === 'Active' || member.status === 'Approved'
                          ? 'pill pill-ok'
                          : member.status === 'Pending'
                            ? 'pill pill-warn'
                            : 'pill pill-err'
                      }
                    >
                      {member.status}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4,
                      }}
                    >
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Audit history"
                        onClick={() => onViewAudit(member)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                          history
                        </span>
                      </button>
                      {member.status === 'Pending' &&
                        adminService.can('VERIFY_MEMBER', 'MEMBERS') && (
                          <button
                            className="btn btn-ghost btn-sm"
                            title="Quick verify"
                            onClick={() => onVerify(member.id, member.name)}
                            style={{ color: '#a87d10' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                              verified_user
                            </span>
                          </button>
                        )}
                      <button
                        className="btn btn-ghost btn-sm"
                        title="View profile"
                        onClick={() => navigate(`/admin/members/${member.id}`)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                          open_in_new
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="mobile-only">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'hsl(var(--border))',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      width: 130,
                      height: 11,
                      background: 'hsl(var(--border))',
                      borderRadius: 3,
                      marginBottom: 7,
                    }}
                  />
                  <div
                    style={{
                      width: 90,
                      height: 9,
                      background: 'hsl(var(--border))',
                      borderRadius: 3,
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 52,
                    height: 20,
                    background: 'hsl(var(--border))',
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          ))
        ) : members.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 36,
                color: 'hsl(var(--border))',
                display: 'block',
                marginBottom: 10,
              }}
            >
              {searchTerm ? 'search_off' : 'group'}
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13,
              }}
            >
              {searchTerm ? `No results for "${searchTerm}"` : 'No members yet'}
            </p>
          </div>
        ) : (
          members.map((member) => (
            <MemberListCard
              key={member.id}
              member={member}
              isSelected={selectedIds.has(member.id)}
              onToggleSelect={onToggleSelect}
              onView={(m) => navigate(`/admin/members/${m.id}`)}
              onAudit={onViewAudit}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      <div
        className="pagination-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-normal, 400)',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {members.length > 0
            ? `Showing ${startIndex + 1}–${Math.min(startIndex + itemsPerPage, totalMembers)} of ${totalMembers}`
            : 'No records'}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={currentPage === 1}
            onClick={onPrevPage}
          >
            ← Previous
          </button>
          <span
            style={{
              fontSize: 11,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            {currentPage} / {totalPages || 1}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={onNextPage}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}
