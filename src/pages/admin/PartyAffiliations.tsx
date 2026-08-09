import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  partyAffiliationService,
  type PartyAffiliationSummary,
  type PartyAffiliationStat,
} from '@/services/partyAffiliationService'
import { toast } from 'sonner'

interface PartyFormData {
  id?: string
  name: string
  code: string
  fullLabel: string
  color: string
  logoUrl: string
  sortOrder: number
}

const PRESET_COLORS = [
  '#1d4ed8', // Deep Blue (NPP)
  '#15803d', // Green (NDC)
  '#dc2626', // Red (CPP)
  '#eab308', // Gold / Yellow (NF)
  '#9333ea', // Purple (GUM)
  '#ea580c', // Orange (APC)
  '#06b6d4', // Cyan (GFP)
  '#059669', // Emerald (GCPP)
  '#d97706', // Amber (LPG)
  '#4f46e5', // Indigo (NDP)
]

export default function PartyAffiliations() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<PartyAffiliationSummary | null>(null)

  // Filters state
  const [platform, setPlatform] = useState<'ALL' | 'GHANA' | 'DIASPORA'>('ALL')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  const [formData, setFormData] = useState<PartyFormData>({
    name: '',
    code: '',
    fullLabel: '',
    color: PRESET_COLORS[0],
    logoUrl: '',
    sortOrder: 10,
  })

  // Reset location filter whenever platform changes
  const handlePlatformChange = (newPlatform: 'ALL' | 'GHANA' | 'DIASPORA') => {
    setIsLoading(true)
    setPlatform(newPlatform)
    setSelectedLocation('')
  }

  const handleLocationChange = (loc: string) => {
    setIsLoading(true)
    setSelectedLocation(loc)
  }

  const fetchSummary = useCallback(async () => {
    try {
      const summary = await partyAffiliationService.getPartyAffiliationSummary({
        platform,
        regionOrCountry: selectedLocation,
      })
      setData(summary)
    } catch {
      toast.error('Failed to load party affiliation statistics')
    } finally {
      setIsLoading(false)
    }
  }, [platform, selectedLocation])

  const handleRefreshClick = () => {
    setIsLoading(true)
    fetchSummary()
  }

  useEffect(() => {
    let active = true
    partyAffiliationService
      .getPartyAffiliationSummary({
        platform,
        regionOrCountry: selectedLocation,
      })
      .then((summary) => {
        if (active) {
          setData(summary)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Failed to load party affiliation statistics')
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [platform, selectedLocation])

  // Filter party stats by search query
  const filteredPartyStats = useMemo(() => {
    if (!data) return []
    if (!searchQuery.trim()) return data.partyStats
    const q = searchQuery.toLowerCase().trim()
    return data.partyStats.filter(
      (p) => p.partyName.toLowerCase().includes(q) || p.abbreviation.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  // Recharts Bar Data
  const barChartData = useMemo(() => {
    return filteredPartyStats.map((p) => ({
      name: p.abbreviation,
      fullTitle: p.partyName,
      members: p.totalMembers,
      color: p.color,
    }))
  }, [filteredPartyStats])

  // Recharts Pie/Donut Data
  const pieChartData = useMemo(() => {
    return filteredPartyStats
      .filter((p) => p.totalMembers > 0)
      .map((p) => ({
        name: p.abbreviation,
        value: p.totalMembers,
        percentage: p.percentage,
        color: p.color,
      }))
  }, [filteredPartyStats])

  const locationOptions = useMemo(() => {
    if (!data) return []
    if (platform === 'GHANA') return data.availableGhanaRegions
    if (platform === 'DIASPORA') return data.availableDiasporaCountries
    return []
  }, [data, platform])

  // Modal Handlers
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      code: '',
      fullLabel: '',
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
      logoUrl: '',
      sortOrder: (data?.partyStats.length || 10) + 1,
    })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (p: PartyAffiliationStat) => {
    setFormData({
      id: p.id,
      name: p.partyName.split('—')[0]?.trim() || p.partyName,
      code: p.abbreviation,
      fullLabel: p.partyName,
      color: p.color,
      logoUrl: p.logoUrl || '',
      sortOrder: 10,
    })
    setIsModalOpen(true)
  }

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP)')
      return
    }

    try {
      setIsUploadingLogo(true)
      const url = await partyAffiliationService.uploadPartyLogo(file)
      setFormData((prev) => ({ ...prev, logoUrl: url }))
      toast.success('Logo uploaded successfully!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Logo upload failed'
      toast.error(msg)
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Party / CSO name is required')
      return
    }
    if (!formData.code.trim()) {
      toast.error('Party / CSO code (abbreviation) is required')
      return
    }

    try {
      setIsSaving(true)
      const fullLabel =
        formData.fullLabel.trim() ||
        `${formData.name.trim()} — ${formData.code.trim().toUpperCase()}`

      if (formData.id) {
        await partyAffiliationService.updateParty(formData.id, {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          full_label: fullLabel,
          logo_url: formData.logoUrl.trim() || null,
          color: formData.color,
          sort_order: formData.sortOrder,
        })
        toast.success(`Updated "${formData.name}" successfully!`)
      } else {
        await partyAffiliationService.createParty({
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          full_label: fullLabel,
          logo_url: formData.logoUrl.trim() || null,
          color: formData.color,
          sort_order: formData.sortOrder,
        })
        toast.success(`Created party / CSO "${formData.name}" successfully!`)
      }

      setIsModalOpen(false)
      fetchSummary()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save party / CSO'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteParty = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the party directory?`)) {
      return
    }

    try {
      await partyAffiliationService.deleteParty(id)
      toast.success(`Deleted "${name}"`)
      fetchSummary()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete party'
      toast.error(msg)
    }
  }

  return (
    <div className="admin-page-container space-y-6">
      <AdminPageHeader
        title="Party affiliations / CSO analytics"
        icon="how_to_vote"
        description="Strategic distribution and member affiliation intelligence across political parties in Ghana and the Diaspora."
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleOpenAddModal}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                add
              </span>
              Add Party / CSO
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleRefreshClick}
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 15,
                  ...(isLoading ? { animation: 'spin 1s linear infinite' } : {}),
                }}
              >
                {isLoading ? 'sync' : 'refresh'}
              </span>
              {isLoading ? 'Refreshing…' : 'Refresh analytics'}
            </button>
          </div>
        }
      />

      {/* KPI Strip */}
      <div className="kpis grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="panel p-4 border-l-4 border-[hsl(var(--primary))]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-muted mb-1">
            Total Affiliated Members
          </div>
          <div
            className="font-bold text-on-surface"
            style={{ fontSize: 'var(--kpi-num-size, 28px)' }}
          >
            {data ? data.totalAffiliated.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-on-surface-muted mt-1">
            Out of {data ? data.totalMembers.toLocaleString() : 0} registered members
          </div>
        </div>

        <div className="panel p-4 border-l-4 border-[hsl(var(--accent))]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-muted mb-1">
            Top Affiliated Party
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {data?.partyStats[0]?.logoUrl ? (
              <img
                src={data.partyStats[0].logoUrl}
                alt={data.partyStats[0].partyName}
                className="w-7 h-7 object-contain rounded shrink-0 bg-white/10 p-0.5"
              />
            ) : null}
            <div
              className="font-bold text-on-surface truncate"
              style={{ fontSize: 'var(--kpi-num-size, 22px)' }}
            >
              {data?.topParty
                ? data.topParty.name.split('—')[1]?.trim() || data.topParty.name
                : '—'}
            </div>
          </div>
          <div className="text-xs text-on-surface-muted mt-1">
            {data?.topParty
              ? `${data.topParty.count.toLocaleString()} members (${data.topParty.percentage}%)`
              : 'No affiliation data'}
          </div>
        </div>

        <div className="panel p-4 border-l-4 border-blue-500">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-muted mb-1">
            Network Distribution
          </div>
          <div
            className="font-bold text-on-surface flex items-baseline gap-2"
            style={{ fontSize: 'var(--kpi-num-size, 24px)' }}
          >
            <span>{data ? data.ghanaTotal.toLocaleString() : '—'}</span>
            <span className="text-xs text-on-surface-muted font-normal">Ghana</span>
            <span className="text-sm font-normal text-on-surface-muted">/</span>
            <span>{data ? data.diasporaTotal.toLocaleString() : '—'}</span>
            <span className="text-xs text-on-surface-muted font-normal">Diaspora</span>
          </div>
          <div className="text-xs text-on-surface-muted mt-1">
            Ghana Network vs Diaspora Network
          </div>
        </div>

        <div className="panel p-4 border-l-4 border-emerald-500">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-muted mb-1">
            Affiliation Rate
          </div>
          <div
            className="font-bold text-on-surface"
            style={{ fontSize: 'var(--kpi-num-size, 28px)' }}
          >
            {data ? `${data.affiliationRate}%` : '—'}
          </div>
          <div className="text-xs text-on-surface-muted mt-1">
            Members with explicitly disclosed party background
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel p-4 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Platform Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold uppercase text-on-surface-muted tracking-wider">
              Network:
            </span>
            <div className="inline-flex rounded-md p-1 bg-container-low border border-border">
              {(['ALL', 'GHANA', 'DIASPORA'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePlatformChange(p)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    platform === p
                      ? 'bg-primary text-white font-semibold shadow-sm'
                      : 'text-on-surface-muted hover:text-on-surface'
                  }`}
                >
                  {p === 'ALL' ? 'All Networks' : p === 'GHANA' ? 'Ghana' : 'Diaspora'}
                </button>
              ))}
            </div>
          </div>

          {/* Cascading Location Filter */}
          {platform !== 'ALL' && locationOptions.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="select-party-location-filter"
                className="text-xs font-semibold uppercase text-on-surface-muted tracking-wider"
              >
                {platform === 'GHANA' ? 'Region:' : 'Country:'}
              </label>
              <select
                id="select-party-location-filter"
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="h-9 px-3 py-1 bg-container-low border border-border rounded text-xs font-medium text-on-surface outline-none focus:border-primary"
              >
                <option value="">
                  {platform === 'GHANA' ? 'All 16 Regions' : 'All Diaspora Countries'}
                </option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-64">
          <span
            className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-muted"
            style={{ fontSize: 16 }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search party name or code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 bg-container-low border border-border rounded text-xs font-medium text-on-surface outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="panel p-5 lg:col-span-2 flex flex-col justify-between">
          <div className="ph mb-4 flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-semibold text-on-surface">
                Member Distribution by Party
              </h3>
              <p className="text-xs text-on-surface-muted">
                Comparative breakdown of member affiliations
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-2xl text-on-surface-muted">
                sync
              </span>
              <span className="text-xs text-on-surface-muted">Loading chart data…</span>
            </div>
          ) : barChartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-on-surface-muted">
              No party data found for the selected filter criteria.
            </div>
          ) : (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--on-surface-muted))"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--on-surface-muted))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      color: 'hsl(var(--on-surface))',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [`${val.toLocaleString()} members`, 'Affiliates']}
                    labelFormatter={(label) => {
                      const item = barChartData.find((d) => d.name === label)
                      return item ? item.fullTitle : label
                    }}
                  />
                  <Bar dataKey="members" radius={[4, 4, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pie/Donut Chart */}
        <div className="panel p-5 flex flex-col justify-between">
          <div className="ph mb-4 flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-base font-semibold text-on-surface">Affiliation Market Share</h3>
              <p className="text-xs text-on-surface-muted">Proportional breakdown by party</p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-2xl text-on-surface-muted">
                sync
              </span>
              <span className="text-xs text-on-surface-muted">Loading chart data…</span>
            </div>
          ) : pieChartData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-xs text-on-surface-muted">
              No affiliation data available.
            </div>
          ) : (
            <div className="h-72 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      color: 'hsl(var(--on-surface))',
                      fontSize: '12px',
                    }}
                    formatter={(val: number, _name, item) => [
                      `${val.toLocaleString()} members (${item.payload.percentage}%)`,
                      'Share',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Party Breakdown Table */}
      <div className="panel overflow-hidden">
        <div className="ph p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-on-surface">
              Party Affiliation / CSO Directory & Breakdown
            </h3>
            <div className="meta text-xs text-on-surface-muted">
              Ranked list of political parties, CSOs, and member totals
            </div>
          </div>
          <span className="text-xs text-on-surface-muted">
            Showing {filteredPartyStats.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-container-low text-on-surface-muted font-medium uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Political Party / CSO</th>
                <th className="py-3 px-4 text-center">Code</th>
                <th className="py-3 px-4 text-right">Affiliated Members</th>
                <th className="py-3 px-4 text-right">Share (%)</th>
                <th className="py-3 px-4 text-center">Ghana / Diaspora</th>
                <th className="py-3 px-4">Top Location</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-muted">
                    <span className="material-symbols-outlined animate-spin text-xl inline-block mr-2">
                      sync
                    </span>
                    Loading party breakdown…
                  </td>
                </tr>
              ) : filteredPartyStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-on-surface-muted">
                    No political parties match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPartyStats.map((p, idx) => (
                  <tr key={p.partyName} className="hover:bg-container-low/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-center text-on-surface-muted">
                      #{idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-on-surface">
                      <div className="flex items-center gap-3">
                        {p.logoUrl ? (
                          <img
                            src={p.logoUrl}
                            alt={p.partyName}
                            className="w-8 h-8 object-contain rounded bg-white/10 p-0.5 shrink-0 border border-border/40"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded border flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{
                              background: `${p.color}20`,
                              borderColor: `${p.color}40`,
                              color: p.color,
                            }}
                          >
                            {p.abbreviation}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-sm block">{p.partyName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: `${p.color}22`,
                          color: p.color,
                          border: `1px solid ${p.color}44`,
                        }}
                      >
                        {p.abbreviation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-on-surface text-sm">
                      {p.totalMembers.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-on-surface-muted">
                      {p.percentage}%
                    </td>
                    <td className="py-3.5 px-4 text-center text-on-surface-muted">
                      <span className="inline-flex gap-1 text-[11px]">
                        <span className="font-semibold text-primary">{p.ghanaCount}</span> GH /{' '}
                        <span className="font-semibold text-accent">{p.diasporaCount}</span> DS
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface-muted font-medium">
                      {p.topRegionOrCountry}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="btn btn-outline btn-xs"
                          title="Edit logo and details"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            edit
                          </span>
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/members?party=${encodeURIComponent(
                                p.partyName
                              )}&platform=${platform}`
                            )
                          }
                          className="btn btn-outline btn-xs"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          Members
                          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            arrow_forward
                          </span>
                        </button>

                        {p.id && (
                          <button
                            onClick={() => handleDeleteParty(p.id!, p.partyName)}
                            className="btn btn-xs text-destructive hover:bg-destructive/10 border-transparent"
                            title="Delete party entry"
                            style={{ fontSize: '11px', padding: '2px 6px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Party Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="panel w-full max-w-md bg-surface p-6 shadow-2xl rounded-lg border border-border animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
              <div>
                <h3 className="text-lg font-bold text-on-surface">
                  {formData.id ? 'Edit Party / CSO' : 'Add New Party / CSO'}
                </h3>
                <p className="text-xs text-on-surface-muted">
                  Configure political party or CSO branding, logo, and classification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-muted hover:text-on-surface p-1 rounded"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveParty} className="space-y-4">
              {/* Logo Preview & Upload */}
              <div className="flex items-center gap-4 p-3 bg-container-low rounded border border-border">
                <div className="relative shrink-0">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Party logo preview"
                      className="w-14 h-14 object-contain rounded bg-white p-1 border border-border"
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded border flex items-center justify-center font-bold text-base"
                      style={{
                        background: `${formData.color}22`,
                        borderColor: `${formData.color}44`,
                        color: formData.color,
                      }}
                    >
                      {formData.code || 'CSO'}
                    </div>
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-surface/80 rounded flex items-center justify-center">
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-medium text-on-surface block">
                    Party / CSO Logo
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="btn btn-outline btn-xs cursor-pointer inline-flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        upload
                      </span>
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                        disabled={isUploadingLogo}
                      />
                    </label>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                        className="text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-on-surface-muted">
                    Supports PNG, WEBP, or JPG format.
                  </p>
                </div>
              </div>

              {/* Direct Image URL input */}
              <div className="space-y-1">
                <label
                  htmlFor="input-party-logourl"
                  className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider block"
                >
                  Logo URL (Optional override)
                </label>
                <input
                  id="input-party-logourl"
                  type="text"
                  placeholder="https://... or /party-affiliations/..."
                  value={formData.logoUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                  className="w-full h-9 px-3 bg-container-low border border-border rounded text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Name & Abbreviation */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label
                    htmlFor="input-party-name"
                    className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider block"
                  >
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="input-party-name"
                    type="text"
                    required
                    placeholder="e.g. Ghana Union Movement"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                        fullLabel: prev.code
                          ? `${e.target.value} — ${prev.code}`
                          : prev.fullLabel,
                      }))
                    }
                    className="w-full h-9 px-3 bg-container-low border border-border rounded text-xs text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="input-party-code"
                    className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider block"
                  >
                    Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="input-party-code"
                    type="text"
                    required
                    placeholder="e.g. GUM"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                        fullLabel: prev.name
                          ? `${prev.name} — ${e.target.value.toUpperCase()}`
                          : prev.fullLabel,
                      }))
                    }
                    className="w-full h-9 px-3 bg-container-low border border-border rounded text-xs font-bold uppercase text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Full Display Label */}
              <div className="space-y-1">
                <label
                  htmlFor="input-party-fulllabel"
                  className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider block"
                >
                  Full Display Label
                </label>
                <input
                  id="input-party-fulllabel"
                  type="text"
                  placeholder="e.g. Ghana Union Movement — GUM"
                  value={formData.fullLabel}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, fullLabel: e.target.value }))
                  }
                  className="w-full h-9 px-3 bg-container-low border border-border rounded text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Brand Accent Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider block">
                  Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-28 h-8 px-2 bg-container-low border border-border rounded text-xs font-mono text-on-surface"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color: hex }))}
                      className={`w-6 h-6 rounded-full border transition-transform ${
                        formData.color.toLowerCase() === hex.toLowerCase()
                          ? 'scale-110 border-white shadow'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ background: hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline btn-sm"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm min-w-[100px] flex items-center justify-center gap-1"
                  disabled={isSaving || isUploadingLogo}
                >
                  {isSaving && (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  )}
                  {isSaving ? 'Saving…' : formData.id ? 'Save changes' : 'Add Party / CSO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
