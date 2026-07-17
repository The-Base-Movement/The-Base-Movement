import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { usePageLabel } from '@/contexts/PageLabelContext'
import {
  organizationalStructureService,
  roleMatchesStructureFilters,
  type OrgParentGroup,
  type OrganizationalStructureData,
  type RoleNode,
} from '@/services/organizationalStructureService'
import { COMMITTEE_LANES, ROLE_PARENT_GROUPS } from '@/lib/roleCatalog'
import type { CommitteeLane, RoleScopeType } from '@/lib/roleCatalog'
import { adminService } from '@/services/adminService'
import { useITLayout } from './ITLayoutContext'
import type React from 'react'

const PARENT_COLORS: Record<OrgParentGroup, string> = {
  BOARD: 'hsl(var(--destructive))',
  'NATIONAL ICT': 'hsl(var(--primary))',
  'SECURITY / INTEL': 'hsl(var(--accent))',
  NCC: 'hsl(142 72% 32%)',
  'DIASPORA AFFAIRS': 'hsl(187 85% 42%)',
  RCC: 'hsl(155 70% 34%)',
  CCC: 'hsl(44 86% 48%)',
  'Polling Stations': 'hsl(var(--on-surface-muted))',
}

const PARENT_ICONS: Record<OrgParentGroup, string> = {
  BOARD: 'crown',
  'NATIONAL ICT': 'desktop_windows',
  'SECURITY / INTEL': 'shield',
  NCC: 'verified_user',
  'DIASPORA AFFAIRS': 'public',
  RCC: 'travel_explore',
  CCC: 'groups',
  'Polling Stations': 'account_balance',
}

const LANE_COLORS: Record<CommitteeLane, string> = {
  'Operations & Organising': 'hsl(208 92% 48%)',
  'Media & Communications': 'hsl(187 85% 42%)',
  'Finance & Fundraising': 'hsl(145 70% 34%)',
  'Research & Policy': 'hsl(266 80% 58%)',
  'Appointment, Discipline & Welfare': 'hsl(336 84% 54%)',
}

const SCOPE_OPTIONS: RoleScopeType[] = ['national', 'region', 'constituency', 'polling_station']
const ALL_PARENT_GROUPS: OrgParentGroup[] = [...ROLE_PARENT_GROUPS, 'Polling Stations']
const LEVEL_FLOW = [
  { label: 'Board', detail: 'Governance and final approval' },
  { label: 'National Level', detail: 'National ICT, Security / Intel, Diaspora Affairs and NCC' },
  { label: 'Regional Level', detail: 'RCC supervision across regions' },
  { label: 'Constituency Level', detail: 'CCC coordination and grassroots operations' },
  { label: 'Polling Stations', detail: 'Ground-level reporting and verification' },
]

const formatNumber = (value: number | null) =>
  value === null ? 'Not configured' : value.toLocaleString()

const withAlpha = (color: string, alpha: number) =>
  color.startsWith('hsl(var(')
    ? color.replace('))', `) / ${alpha})`)
    : color.replace(')', ` / ${alpha})`)

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  borderRadius: 'var(--radius-pill)',
  padding: '4px 8px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--surface-muted, var(--surface)) / 0.72)',
  color: 'hsl(var(--on-surface-muted))',
  fontSize: 11,
  fontWeight: 'var(--font-weight-medium, 500)',
  lineHeight: 1,
}

const compactInputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 38,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--surface))',
  color: 'hsl(var(--on-surface))',
  padding: '0 12px',
  fontSize: 13,
  outline: 'none',
}

function KPI({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: string
  color: string
}) {
  return (
    <div className="panel" style={{ padding: '16px 18px 16px 22px', position: 'relative' }}>
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color }}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(var(--on-surface-muted))',
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {label}
        </p>
        <span className="material-symbols-outlined" style={{ fontSize: 17, color, opacity: 0.7 }}>
          {icon}
        </span>
      </div>
      <p
        style={{
          margin: '10px 0 0',
          color: 'hsl(var(--on-surface))',
          fontSize: 'var(--kpi-num-size)',
          fontWeight: 'var(--font-weight-medium, 500)',
        }}
      >
        {value}
      </p>
    </div>
  )
}

function RoleChip({ role, onSelect }: { role: RoleNode; onSelect: (role: RoleNode) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        minWidth: 0,
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
        background: 'hsl(var(--surface) / 0.9)',
        color: 'hsl(var(--on-surface))',
        padding: '7px 8px',
        textAlign: 'left',
        cursor: 'pointer',
        boxShadow: '0 10px 24px hsl(var(--background) / 0.16)',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = PARENT_COLORS[role.parentGroup]
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = 'hsl(var(--border))'
      }}
    >
      <span
        style={{ fontSize: 11, fontWeight: 'var(--font-weight-medium, 500)', lineHeight: 1.25 }}
      >
        {role.label}
      </span>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        <span style={{ ...badgeStyle, padding: '3px 6px', fontSize: 10 }}>
          {role.permissions.length} perms
        </span>
        <span style={{ ...badgeStyle, padding: '3px 6px', fontSize: 10 }}>
          {role.scopeType.replace('_', ' ')}
        </span>
        {role.protected && (
          <span style={{ ...badgeStyle, padding: '3px 6px', fontSize: 10 }}>Protected</span>
        )}
        {role.requires2fa && (
          <span style={{ ...badgeStyle, padding: '3px 6px', fontSize: 10 }}>2FA</span>
        )}
      </span>
    </button>
  )
}

function Connector({ label }: { label?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 34,
        color: 'hsl(var(--on-surface-muted))',
      }}
    >
      <div
        style={{
          width: 2,
          height: 28,
          background: 'linear-gradient(180deg, hsl(var(--primary)), hsl(var(--border)))',
          position: 'relative',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            position: 'absolute',
            left: -9,
            bottom: -12,
            fontSize: 20,
            color: 'hsl(var(--primary))',
          }}
        >
          keyboard_arrow_down
        </span>
      </div>
      {label && <span style={{ fontSize: 10, marginTop: 8 }}>{label}</span>}
    </div>
  )
}

function EmptyNode({ label = 'No matching roles' }: { label?: string }) {
  return (
    <div
      style={{
        border: '1px dashed hsl(var(--border))',
        borderRadius: 'var(--radius-sm)',
        padding: 12,
        color: 'hsl(var(--on-surface-muted))',
        fontSize: 12,
        textAlign: 'center',
      }}
    >
      {label}
    </div>
  )
}

function ParentGroupNode({
  group,
  roles,
  children,
  compact = false,
  viewMode = 'expanded',
  meta,
  onSelect,
}: {
  group: OrgParentGroup
  roles: RoleNode[]
  children?: React.ReactNode
  compact?: boolean
  viewMode?: 'compact' | 'expanded'
  meta?: React.ReactNode
  onSelect: (role: RoleNode) => void
}) {
  const color = PARENT_COLORS[group]
  const visibleRoles = viewMode === 'compact' ? roles.slice(0, 3) : roles
  const hiddenRoleCount = roles.length - visibleRoles.length
  return (
    <section
      style={{
        border: `1px solid ${color}`,
        borderRadius: 'var(--radius-lg)',
        background:
          'linear-gradient(180deg, hsl(var(--surface) / 0.98), hsl(var(--surface) / 0.76))',
        boxShadow: `0 0 0 1px hsl(var(--background) / 0.32), 0 16px 40px ${withAlpha(color, 0.18)}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: compact ? '12px 14px' : '14px 16px',
          borderBottom: '1px solid hsl(var(--border))',
          background: `linear-gradient(90deg, ${withAlpha(color, 0.2)}, transparent)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="material-symbols-outlined"
            style={{
              width: 32,
              height: 32,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--background) / 0.45)',
              color,
              fontSize: 20,
            }}
          >
            {PARENT_ICONS[group]}
          </span>
          <div>
            <p
              style={{
                margin: 0,
                color: 'hsl(var(--on-surface))',
                fontSize: compact ? 15 : 20,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              {group}
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginTop: 4,
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 11,
              }}
            >
              <span>
                {roles.length} visible role{roles.length === 1 ? '' : 's'}
              </span>
              {meta && (
                <>
                  <span aria-hidden="true">•</span>
                  <span>{meta}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <span style={badgeStyle}>Parent group</span>
      </div>

      <div style={{ padding: compact ? 12 : 16 }}>
        {children ?? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
              gap: 8,
            }}
          >
            {roles.length > 0 ? (
              <>
                {visibleRoles.map((role) => (
                  <RoleChip key={`${group}-${role.name}`} role={role} onSelect={onSelect} />
                ))}
                {hiddenRoleCount > 0 && (
                  <div
                    style={{
                      border: '1px dashed hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      padding: '7px 8px',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 11,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    +{hiddenRoleCount} more
                  </div>
                )}
              </>
            ) : (
              <EmptyNode />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function CommitteeLaneNode({
  lane,
  roles,
  viewMode,
  onSelect,
}: {
  lane: CommitteeLane
  roles: RoleNode[]
  viewMode: 'compact' | 'expanded'
  onSelect: (role: RoleNode) => void
}) {
  const color = LANE_COLORS[lane]
  const visibleRoles = viewMode === 'compact' ? roles.slice(0, 3) : roles
  const hiddenRoleCount = roles.length - visibleRoles.length
  return (
    <div
      style={{
        border: `1px solid ${color}`,
        borderRadius: 'var(--radius-md)',
        background: 'hsl(var(--background) / 0.16)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderBottom: '1px solid hsl(var(--border))',
          background: `linear-gradient(90deg, ${withAlpha(color, 0.18)}, transparent)`,
        }}
      >
        <p
          style={{
            margin: 0,
            color: 'hsl(var(--on-surface))',
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
          }}
        >
          {lane}
        </p>
        <span style={{ ...badgeStyle, padding: '3px 6px', fontSize: 10 }}>{roles.length}</span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(108px, 1fr))',
          gap: 7,
          padding: 9,
        }}
      >
        {roles.length > 0 ? (
          <>
            {visibleRoles.map((role) => (
              <RoleChip key={`${lane}-${role.name}`} role={role} onSelect={onSelect} />
            ))}
            {hiddenRoleCount > 0 && (
              <div
                style={{
                  border: '1px dashed hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  padding: '7px 8px',
                  color: 'hsl(var(--on-surface-muted))',
                  fontSize: 11,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                +{hiddenRoleCount} more
              </div>
            )}
          </>
        ) : (
          <EmptyNode />
        )}
      </div>
    </div>
  )
}

function LaneGroupNode({
  group,
  level,
  count,
  lanes,
  roles,
  viewMode,
  onSelect,
}: {
  group: Extract<OrgParentGroup, 'NCC' | 'RCC' | 'CCC'>
  level: string
  count?: string
  lanes: Array<{ lane: CommitteeLane; roles: RoleNode[] }>
  roles: RoleNode[]
  viewMode: 'compact' | 'expanded'
  onSelect: (role: RoleNode) => void
}) {
  const meta = count ? `${level} • ${count}` : level

  return (
    <ParentGroupNode
      group={group}
      roles={roles}
      compact
      viewMode={viewMode}
      meta={meta}
      onSelect={onSelect}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
          gap: 10,
          alignItems: 'start',
        }}
      >
        {lanes.length > 0 ? (
          lanes.map((lane) => (
            <CommitteeLaneNode
              key={`${group}-${lane.lane}`}
              lane={lane.lane}
              roles={lane.roles}
              viewMode={viewMode}
              onSelect={onSelect}
            />
          ))
        ) : (
          <EmptyNode />
        )}
      </div>
    </ParentGroupNode>
  )
}

function HierarchyMap({
  groups,
  counts,
  viewMode,
  onViewModeChange,
  onSelect,
}: {
  groups: OrganizationalStructureData['groups']
  counts: OrganizationalStructureData['counts']
  viewMode: 'compact' | 'expanded'
  onViewModeChange: (mode: 'compact' | 'expanded') => void
  onSelect: (role: RoleNode) => void
}) {
  const byGroup = new Map(groups.map((group) => [group.group, group]))
  const board = byGroup.get('BOARD')
  const ict = byGroup.get('NATIONAL ICT')
  const security = byGroup.get('SECURITY / INTEL')
  const diaspora = byGroup.get('DIASPORA AFFAIRS')
  const ncc = byGroup.get('NCC')
  const rcc = byGroup.get('RCC')
  const ccc = byGroup.get('CCC')
  const polling = byGroup.get('Polling Stations')

  return (
    <section
      className="panel"
      style={{
        padding: 18,
        marginBottom: 18,
        overflow: 'hidden',
        background:
          'radial-gradient(circle at top left, hsl(var(--primary) / 0.12), transparent 28%), hsl(var(--surface))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
          >
            schema
          </span>
          <div>
            <p
              style={{
                margin: 0,
                color: 'hsl(var(--on-surface))',
                fontSize: 16,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              Command Structure Map
            </p>
            <p style={{ margin: '3px 0 0', color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
              Board connects to NCC. National ICT, Security / Intel and Diaspora Affairs feed into
              down through RCC, CCC and polling stations.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['compact', 'expanded'] as const).map((mode) => (
            <button
              key={mode}
              className={`btn btn-sm ${viewMode === mode ? 'btn-primary' : 'btn-outline'}`}
              type="button"
              onClick={() => onViewModeChange(mode)}
            >
              {mode === 'compact' ? 'Compact View' : 'Expanded View'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', justifyItems: 'center', gap: 0 }}>
        <div style={{ width: 'min(100%, 760px)' }}>
          {board ? (
            <ParentGroupNode
              group="BOARD"
              roles={board.roles}
              viewMode={viewMode}
              onSelect={onSelect}
            />
          ) : (
            <EmptyNode label="Board has no matching roles" />
          )}
        </div>

        <Connector label="Board to NCC" />

        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 14,
            alignItems: 'start',
            position: 'relative',
          }}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <div
              style={{
                border: '1px dashed hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span>Support systems feed into NCC</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                arrow_forward
              </span>
            </div>
            {ict ? (
              <ParentGroupNode
                group="NATIONAL ICT"
                roles={ict.roles}
                compact
                viewMode={viewMode}
                onSelect={onSelect}
              />
            ) : (
              <EmptyNode label="National ICT has no matching roles" />
            )}
            {security ? (
              <ParentGroupNode
                group="SECURITY / INTEL"
                roles={security.roles}
                compact
                viewMode={viewMode}
                onSelect={onSelect}
              />
            ) : (
              <EmptyNode label="Security / Intel has no matching roles" />
            )}
            {diaspora ? (
              <ParentGroupNode
                group="DIASPORA AFFAIRS"
                roles={diaspora.roles}
                compact
                viewMode={viewMode}
                onSelect={onSelect}
              />
            ) : (
              <EmptyNode label="Diaspora Affairs has no matching roles" />
            )}
          </div>
          {ncc ? (
            <LaneGroupNode
              group="NCC"
              level="National Level"
              lanes={ncc.lanes}
              roles={ncc.roles}
              viewMode={viewMode}
              onSelect={onSelect}
            />
          ) : (
            <EmptyNode label="NCC has no matching roles" />
          )}
        </div>

        <Connector label="NCC to RCC" />

        <div style={{ width: '100%' }}>
          {rcc ? (
            <LaneGroupNode
              group="RCC"
              level="Regional Level"
              count={
                counts.regions === null
                  ? 'Regions not configured'
                  : `${counts.regions.toLocaleString()} Regions`
              }
              lanes={rcc.lanes}
              roles={rcc.roles}
              viewMode={viewMode}
              onSelect={onSelect}
            />
          ) : (
            <EmptyNode label="RCC has no matching roles" />
          )}
        </div>

        <Connector />

        <div style={{ width: '100%' }}>
          {ccc ? (
            <LaneGroupNode
              group="CCC"
              level="Constituency Level"
              count={
                counts.constituencies === null
                  ? 'Constituencies not configured'
                  : `${counts.constituencies.toLocaleString()} Constituencies`
              }
              lanes={ccc.lanes}
              roles={ccc.roles}
              viewMode={viewMode}
              onSelect={onSelect}
            />
          ) : (
            <EmptyNode label="CCC has no matching roles" />
          )}
        </div>

        <Connector />

        <div style={{ width: 'min(100%, 760px)' }}>
          {polling ? (
            <ParentGroupNode group="Polling Stations" roles={polling.roles} onSelect={onSelect}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 0.75fr) minmax(0, 1fr)',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    border: `1px solid ${PARENT_COLORS['Polling Stations']}`,
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                    background: 'hsl(var(--background) / 0.2)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: 'hsl(var(--on-surface))',
                      fontSize: 22,
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {counts.pollingStations === null
                      ? 'Polling Stations'
                      : `${counts.pollingStations.toLocaleString()} Polling Stations`}
                  </p>
                  <p
                    style={{
                      margin: '5px 0 0',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 13,
                    }}
                  >
                    Grassroots Level
                  </p>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
                    gap: 8,
                  }}
                >
                  {polling.roles.length > 0 ? (
                    <>
                      {(viewMode === 'compact' ? polling.roles.slice(0, 4) : polling.roles).map(
                        (role) => (
                          <RoleChip key={`polling-${role.name}`} role={role} onSelect={onSelect} />
                        )
                      )}
                      {viewMode === 'compact' && polling.roles.length > 4 && (
                        <div
                          style={{
                            border: '1px dashed hsl(var(--border))',
                            borderRadius: 'var(--radius-sm)',
                            padding: '7px 8px',
                            color: 'hsl(var(--on-surface-muted))',
                            fontSize: 11,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          +{polling.roles.length - 4} more
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyNode />
                  )}
                </div>
              </div>
            </ParentGroupNode>
          ) : (
            <EmptyNode label="Polling Station roles have no matches" />
          )}
        </div>
      </div>
    </section>
  )
}

function RoleDetailPanel({
  role,
  canEdit,
  onClose,
}: {
  role: RoleNode | null
  canEdit: boolean
  onClose: () => void
}) {
  if (!role) {
    return null
  }

  return (
    <aside className="panel" style={{ padding: 18, position: 'sticky', top: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 5px',
              fontSize: 17,
              color: 'hsl(var(--on-surface))',
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            {role.label}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            {role.name}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={onClose}
          aria-label="Close role details"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            close
          </span>
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
        <span style={badgeStyle}>{role.parentGroup}</span>
        {role.committeeLane && <span style={badgeStyle}>{role.committeeLane}</span>}
        <span style={badgeStyle}>{role.scopeType.replace('_', ' ')}</span>
        <span style={badgeStyle}>{role.is_system ? 'Catalog role' : 'Custom role'}</span>
        {role.protected && <span style={badgeStyle}>Protected</span>}
        {role.requires2fa && <span style={badgeStyle}>2FA required</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
        <KPI
          label="Permissions"
          value={role.permissions.length}
          icon="key"
          color={PARENT_COLORS[role.parentGroup]}
        />
        <KPI
          label="Assigned users"
          value={role.assignedUsersCount ?? 'Not configured'}
          icon="group"
          color="hsl(var(--accent))"
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <p
          style={{
            margin: '0 0 8px',
            color: 'hsl(var(--on-surface))',
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Permission list
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {role.permissions.length === 0 ? (
            <span style={badgeStyle}>No permissions configured</span>
          ) : (
            role.permissions.map((permission) => (
              <span key={`${permission.action}-${permission.resource}`} style={badgeStyle}>
                {permission.action.replaceAll('_', ' ')} · {permission.resource}
              </span>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
        <Link className="btn btn-outline btn-sm" to="/admin/roles">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            manage_accounts
          </span>
          Roles Manager
        </Link>
        {canEdit && (
          <Link
            className="btn btn-primary btn-sm"
            to={`/admin/roles?role=${encodeURIComponent(role.name)}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              edit
            </span>
            Edit role
          </Link>
        )}
      </div>
    </aside>
  )
}

export default function OrganizationalStructureRoadmap() {
  const { setCurrentLabel } = usePageLabel()
  const [data, setData] = useState<OrganizationalStructureData | null>(null)
  const [selectedRole, setSelectedRole] = useState<RoleNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [parent, setParent] = useState<OrgParentGroup | 'all'>('all')
  const [lane, setLane] = useState<CommitteeLane | 'all'>('all')
  const [scope, setScope] = useState<RoleScopeType | 'all'>('all')
  const [protectedOnly, setProtectedOnly] = useState(false)
  const [twoFactorOnly, setTwoFactorOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)

  useEffect(() => {
    setCurrentLabel('Organizational Structure & Road Mapping')
  }, [setCurrentLabel])

  useITLayout(
    'Organizational Structure & Road Mapping',
    'account_tree',
    'Board -> National Level -> Regional Level -> Constituency Level -> Polling Stations'
  )

  useEffect(() => {
    let cancelled = false
    organizationalStructureService
      .getDashboardData()
      .then((payload) => {
        if (cancelled) return
        setData(payload)
        setSelectedRole(null)
      })
      .catch((err) => {
        console.error('[OrganizationalStructure] Failed to load:', err)
        if (!cancelled) setError('Unable to load organizational structure data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const canEditRoles = adminService.can('VIEW_AUDIT_LOGS', 'SYSTEM')

  const filteredGroups = useMemo(() => {
    if (!data) return []
    return data.groups
      .map((group) => {
        const roles = group.roles.filter((role) =>
          roleMatchesStructureFilters(role, {
            search,
            parent,
            lane,
            scope,
            protectedOnly,
            twoFactorOnly,
          })
        )
        const lanes = group.lanes
          .map((laneNode) => ({
            ...laneNode,
            roles: laneNode.roles.filter((role) =>
              roleMatchesStructureFilters(role, {
                search,
                parent,
                lane,
                scope,
                protectedOnly,
                twoFactorOnly,
              })
            ),
          }))
          .filter((laneNode) => laneNode.roles.length > 0)

        return { ...group, roles, lanes }
      })
      .filter((group) => group.roles.length > 0)
  }, [data, lane, parent, protectedOnly, scope, search, twoFactorOnly])

  const hasFilters =
    search.trim() ||
    parent !== 'all' ||
    lane !== 'all' ||
    scope !== 'all' ||
    protectedOnly ||
    twoFactorOnly

  const parentAnalytics = useMemo(() => {
    if (!data) return []
    return data.groups.map((group) => ({
      name: group.group,
      value: group.roles.length,
      color: PARENT_COLORS[group.group],
    }))
  }, [data])

  const securityAnalytics = useMemo(() => {
    if (!data) return []
    const roles = data.groups.flatMap((group) => group.roles)
    return [
      {
        name: '2FA required',
        value: roles.filter((role) => role.requires2fa).length,
        color: 'hsl(var(--primary))',
      },
      {
        name: 'Protected',
        value: roles.filter((role) => role.protected).length,
        color: 'hsl(var(--destructive))',
      },
      {
        name: 'Standard',
        value: roles.filter((role) => !role.requires2fa && !role.protected).length,
        color: 'hsl(var(--on-surface-muted))',
      },
    ].filter((item) => item.value > 0)
  }, [data])

  const clearFilters = () => {
    setSearch('')
    setParent('all')
    setLane('all')
    setScope('all')
    setProtectedOnly(false)
    setTwoFactorOnly(false)
  }

  if (loading) {
    return (
      <div className="main">
        <div className="panel" style={{ padding: 24, color: 'hsl(var(--on-surface-muted))' }}>
          Loading organizational structure…
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="main">
        <div className="panel" style={{ padding: 24 }}>
          <p style={{ margin: 0, color: 'hsl(var(--destructive))' }}>
            {error ?? 'Organizational structure is unavailable.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="main">
      <section className="panel" style={{ padding: 22, marginBottom: 22 }}>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}
        >
          <div style={{ maxWidth: 760 }}>
            <p
              style={{
                margin: '0 0 8px',
                color: 'hsl(var(--on-surface))',
                fontSize: 20,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              Board → National Level → Regional Level → Constituency Level → Polling Stations
            </p>
            <p
              style={{
                margin: 0,
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              This dashboard connects parent groups, committee lanes, role scopes, permissions,
              protected status, 2FA requirements and the polling station structure from the current
              role catalog and database-backed operational counts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Link className="btn btn-outline btn-sm" to="/admin/roles">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                manage_accounts
              </span>
              Roles Manager
            </Link>
            <Link className="btn btn-outline btn-sm" to="/admin/settings">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                admin_panel_settings
              </span>
              Settings
            </Link>
          </div>
        </div>
      </section>

      <section className="panel" style={{ padding: 16, marginBottom: 22 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 10,
          }}
        >
          {LEVEL_FLOW.map((level, index) => (
            <div
              key={level.label}
              style={{
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                background: 'hsl(var(--surface))',
                position: 'relative',
                minHeight: 92,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 'var(--radius-pill)',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'hsl(var(--primary) / 0.12)',
                    color: 'hsl(var(--primary))',
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {index + 1}
                </span>
                <p
                  style={{
                    margin: 0,
                    color: 'hsl(var(--on-surface))',
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {level.label}
                </p>
              </div>
              <p style={{ margin: 0, color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
                {level.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div
        className="kpis"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 22 }}
      >
        <KPI
          label="Total Parent Groups"
          value={data.counts.parentGroups}
          icon="account_tree"
          color="hsl(var(--primary))"
        />
        <KPI
          label="Total Roles"
          value={data.counts.roles}
          icon="badge"
          color="hsl(var(--on-surface))"
        />
        <KPI
          label="Committee Lanes"
          value={data.counts.committeeLanes}
          icon="view_week"
          color="hsl(var(--accent))"
        />
        <KPI
          label="Protected Roles"
          value={data.counts.protectedRoles}
          icon="lock"
          color="hsl(var(--destructive))"
        />
        <KPI
          label="2FA Required Roles"
          value={data.counts.twoFactorRoles}
          icon="verified_user"
          color="hsl(var(--primary))"
        />
        <KPI
          label="Total Permissions"
          value={data.counts.permissions}
          icon="key"
          color="hsl(var(--accent))"
        />
        <KPI
          label="RCC / Regions"
          value={formatNumber(data.counts.regions)}
          icon="map"
          color="hsl(155 70% 34%)"
        />
        <KPI
          label="CCC / Constituencies"
          value={formatNumber(data.counts.constituencies)}
          icon="location_on"
          color="hsl(44 86% 48%)"
        />
        <KPI
          label="Polling Stations"
          value={formatNumber(data.counts.pollingStations)}
          icon="ballot"
          color="hsl(var(--on-surface-muted))"
        />
      </div>

      <section className="panel" style={{ padding: 16, marginBottom: 22 }}>
        <div style={{ marginBottom: 10 }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search roles by name, code, or description"
            style={compactInputStyle}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <select
            value={parent}
            onChange={(event) => setParent(event.target.value as OrgParentGroup | 'all')}
            style={compactInputStyle}
          >
            <option value="all">All parent groups</option>
            {ALL_PARENT_GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <select
            value={lane}
            onChange={(event) => setLane(event.target.value as CommitteeLane | 'all')}
            style={compactInputStyle}
          >
            <option value="all">All committee lanes</option>
            {COMMITTEE_LANES.map((laneOption) => (
              <option key={laneOption} value={laneOption}>
                {laneOption}
              </option>
            ))}
          </select>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as RoleScopeType | 'all')}
            style={compactInputStyle}
          >
            <option value="all">All scopes</option>
            {SCOPE_OPTIONS.map((scopeOption) => (
              <option key={scopeOption} value={scopeOption}>
                {scopeOption.replace('_', ' ')}
              </option>
            ))}
          </select>
          <label style={{ ...badgeStyle, cursor: 'pointer', minHeight: 38 }}>
            <input
              type="checkbox"
              checked={protectedOnly}
              onChange={(event) => setProtectedOnly(event.target.checked)}
            />
            Protected
          </label>
          <label style={{ ...badgeStyle, cursor: 'pointer', minHeight: 38 }}>
            <input
              type="checkbox"
              checked={twoFactorOnly}
              onChange={(event) => setTwoFactorOnly(event.target.checked)}
            />
            2FA
          </label>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            Clear
          </button>
        </div>
      </section>

      <HierarchyMap
        groups={filteredGroups}
        counts={data.counts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSelect={setSelectedRole}
      />

      {selectedRole && (
        <div style={{ maxWidth: 920, margin: '0 auto 18px' }}>
          <RoleDetailPanel
            role={selectedRole}
            canEdit={canEditRoles}
            onClose={() => setSelectedRole(null)}
          />
        </div>
      )}

      <section className="panel" style={{ padding: 0, marginBottom: 18, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowAnalytics((value) => !value)}
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            color: 'hsl(var(--on-surface))',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
            >
              analytics
            </span>
            <span style={{ fontSize: 15, fontWeight: 'var(--font-weight-medium, 500)' }}>
              Analytics
            </span>
          </span>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {showAnalytics ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        {showAnalytics && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
              padding: '0 18px 18px',
            }}
          >
            <div className="panel" style={{ padding: 18 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: 'hsl(var(--on-surface))',
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    Role Distribution
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 12,
                    }}
                  >
                    Roles grouped by parent structure.
                  </p>
                </div>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
                >
                  donut_large
                </span>
              </div>
              <div style={{ height: 220, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={parentAnalytics}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {parentAnalytics.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {parentAnalytics.map((entry) => (
                  <span key={entry.name} style={badgeStyle}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 'var(--radius-pill)',
                        background: entry.color,
                      }}
                    />
                    {entry.name}: {entry.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="panel" style={{ padding: 18 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      color: 'hsl(var(--on-surface))',
                      fontSize: 15,
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    Security Posture
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 12,
                    }}
                  >
                    Elevated, protected and standard role mix.
                  </p>
                </div>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--accent))' }}
                >
                  verified_user
                </span>
              </div>
              <div style={{ height: 220, marginTop: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={securityAnalytics}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {securityAnalytics.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {securityAnalytics.map((entry) => (
                  <span key={entry.name} style={badgeStyle}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 'var(--radius-pill)',
                        background: entry.color,
                      }}
                    />
                    {entry.name}: {entry.value}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowRoadmap((value) => !value)}
          style={{
            width: '100%',
            border: 0,
            background: 'transparent',
            color: 'hsl(var(--on-surface))',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
            >
              route
            </span>
            <span style={{ fontSize: 16, fontWeight: 'var(--font-weight-medium, 500)' }}>
              Road Mapping
            </span>
          </span>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            {showRoadmap ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        {showRoadmap && (
          <div style={{ padding: '0 18px 18px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 12,
              }}
            >
              {data.roadmap.map((node) => (
                <div
                  key={node.group}
                  style={{
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    background: 'hsl(var(--surface))',
                    borderTop: `3px solid ${PARENT_COLORS[node.group]}`,
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 10px',
                      color: 'hsl(var(--on-surface))',
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                    }}
                  >
                    {node.group}
                  </p>
                  <div style={{ display: 'grid', gap: 7 }}>
                    {node.items.map((item) => (
                      <div
                        key={item}
                        style={{
                          display: 'flex',
                          gap: 8,
                          color: 'hsl(var(--on-surface-muted))',
                          fontSize: 12,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 14, color: PARENT_COLORS[node.group] }}
                        >
                          check_circle
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
