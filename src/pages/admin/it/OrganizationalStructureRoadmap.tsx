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
  RCC: 'hsl(155 70% 34%)',
  CCC: 'hsl(44 86% 48%)',
  'Polling Stations': 'hsl(var(--on-surface-muted))',
}

const SCOPE_OPTIONS: RoleScopeType[] = ['national', 'region', 'constituency', 'polling_station']
const ALL_PARENT_GROUPS: OrgParentGroup[] = [...ROLE_PARENT_GROUPS, 'Polling Stations']
const LEVEL_FLOW = [
  { label: 'Board', detail: 'Governance and final approval' },
  { label: 'National Level', detail: 'National ICT, Security / Intel and NCC' },
  { label: 'Regional Level', detail: 'RCC supervision across regions' },
  { label: 'Constituency Level', detail: 'CCC coordination and grassroots operations' },
  { label: 'Polling Stations', detail: 'Ground-level reporting and verification' },
]

const formatNumber = (value: number | null) =>
  value === null ? 'Not configured' : value.toLocaleString()

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

function RoleCard({ role, onSelect }: { role: RoleNode; onSelect: (role: RoleNode) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className="panel"
      style={{
        width: '100%',
        textAlign: 'left',
        padding: 12,
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        borderColor: 'hsl(var(--border))',
        transition: 'transform 160ms ease, border-color 160ms ease, background 160ms ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-1px)'
        event.currentTarget.style.borderColor = PARENT_COLORS[role.parentGroup]
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)'
        event.currentTarget.style.borderColor = 'hsl(var(--border))'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 5px',
              color: 'hsl(var(--on-surface))',
              fontSize: 13,
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            {role.label}
          </p>
          <p style={{ margin: 0, color: 'hsl(var(--on-surface-muted))', fontSize: 11 }}>
            {role.scopeType.replace('_', ' ')} scope
          </p>
        </div>
        <span style={{ ...badgeStyle, flexShrink: 0 }}>{role.permissions.length}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {role.protected && <span style={badgeStyle}>Protected</span>}
        {role.requires2fa && <span style={badgeStyle}>2FA required</span>}
        {role.committeeLane && <span style={badgeStyle}>{role.committeeLane}</span>}
      </div>
    </button>
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
    return (
      <aside className="panel" style={{ padding: 18, position: 'sticky', top: 16 }}>
        <div
          style={{
            minHeight: 220,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <div>
            <span className="material-symbols-outlined" style={{ fontSize: 36, opacity: 0.55 }}>
              touch_app
            </span>
            <p style={{ margin: '8px 0 0', fontSize: 13 }}>
              Select a role card to inspect scope, security and permissions.
            </p>
          </div>
        </div>
      </aside>
    )
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
        setSelectedRole(payload.groups.flatMap((group) => group.roles)[0] ?? null)
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

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              <p style={{ margin: '4px 0 0', color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
                Roles grouped by parent structure.
              </p>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
            >
              analytics
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              <p style={{ margin: '4px 0 0', color: 'hsl(var(--on-surface-muted))', fontSize: 12 }}>
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
      </section>

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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: 18 }}>
          {filteredGroups.map((group, index) => (
            <section
              key={group.group}
              className="panel"
              style={{
                padding: 18,
                borderLeft: `4px solid ${PARENT_COLORS[group.group]}`,
                position: 'relative',
              }}
            >
              {index < filteredGroups.length - 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 22,
                    bottom: -18,
                    width: 2,
                    height: 18,
                    background: 'hsl(var(--border))',
                  }}
                />
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 'var(--radius-sm)',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'hsl(var(--surface))',
                      border: `1px solid ${PARENT_COLORS[group.group]}`,
                      color: PARENT_COLORS[group.group],
                      fontSize: 20,
                    }}
                  >
                    {group.group === 'Polling Stations' ? 'ballot' : 'account_tree'}
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
                      {group.group}
                    </p>
                    <p
                      style={{
                        margin: '3px 0 0',
                        color: 'hsl(var(--on-surface-muted))',
                        fontSize: 12,
                      }}
                    >
                      {group.roles.length} visible role{group.roles.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <span style={badgeStyle}>View parent group details</span>
              </div>

              {group.lanes.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: 12,
                  }}
                >
                  {group.lanes.map((laneNode) => (
                    <div
                      key={laneNode.lane}
                      style={{
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-md)',
                        padding: 12,
                        background: 'hsl(var(--surface))',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            color: 'hsl(var(--on-surface))',
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
                          }}
                        >
                          {laneNode.lane}
                        </p>
                        <span style={badgeStyle}>{laneNode.roles.length}</span>
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        {laneNode.roles.map((role) => (
                          <RoleCard key={role.name} role={role} onSelect={setSelectedRole} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: 10,
                  }}
                >
                  {group.roles.map((role) => (
                    <RoleCard
                      key={`${group.group}-${role.name}`}
                      role={role}
                      onSelect={setSelectedRole}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}

          <section className="panel" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 22, color: 'hsl(var(--primary))' }}
              >
                route
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Road Mapping
              </p>
            </div>
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
          </section>
        </div>

        <RoleDetailPanel
          role={selectedRole}
          canEdit={canEditRoles}
          onClose={() => setSelectedRole(null)}
        />
      </div>
    </div>
  )
}
