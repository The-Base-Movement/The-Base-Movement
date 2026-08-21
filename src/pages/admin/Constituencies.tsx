import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { constituencyService, type MemberAssignmentIssue } from '@/services/constituencyService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import type { Constituency } from '@/types/admin'
import { Pagination } from '@/components/Pagination'
import { toast } from 'sonner'
import { Modal } from './regions/Modal'
import { DeleteModal } from './regions/DeleteModal'
import { inputSt } from './regions/utils'
import { RegionalImpactStats } from '@/components/admin/RegionalImpactStats'
import { ConstituenciesGrid } from './constituencies/ConstituenciesGrid'

const GHANA_REGIONS = [
  'All Regions',
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

export default function AdminConstituencies() {
  const navigate = useNavigate()
  // Route access requires MANAGE_CHAPTER/CHAPTERS for every existing role that can reach
  // this page — Movement Manager gets in via the additive VIEW_CONSTITUENCY_OPS permission
  // instead, so this check hides writes for them without affecting anyone else.
  const canManage = adminService.can('MANAGE_CHAPTER', 'CHAPTERS')
  const [constituencies, setConstituencies] = useState<Constituency[]>([])
  const [assignmentIssues, setAssignmentIssues] = useState<MemberAssignmentIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('All Regions')
  const [sortField, setSortField] = useState<'name' | 'members'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // CRUD states
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editConstituency, setEditConstituency] = useState<Constituency | null>(null)
  const [deleteConstituency, setDeleteConstituency] = useState<Constituency | null>(null)

  // Assignment reconciliation table controls
  const [issueSearch, setIssueSearch] = useState('')
  const [issuePlatformFilter, setIssuePlatformFilter] = useState<'All' | 'GHANA' | 'DIASPORA'>(
    'All'
  )
  const [issuePage, setIssuePage] = useState(1)
  const [reassigningId, setReassigningId] = useState<string | null>(null)
  const [reassignValue, setReassignValue] = useState('')
  const [isReassigning, setIsReassigning] = useState(false)

  // Form input states
  const [inputValue, setInputValue] = useState('')
  const [selectedRegionId, setSelectedRegionId] = useState<number | ''>('')

  // Advanced edit fields
  const [editName, setEditName] = useState('')
  const [editRegionId, setEditRegionId] = useState<number | ''>('')
  const [editStatus, setEditStatus] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editMeetingSchedule, setEditMeetingSchedule] = useState('')
  const [editLocalFocus, setEditLocalFocus] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhoneNumber, setEditPhoneNumber] = useState('')

  const refresh = () => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  useEffect(() => {
    Promise.all([
      constituencyService.getConstituencies(),
      constituencyService.getAssignmentIssues(),
      constituencyService.getRegions(),
    ]).then(([constituencyRows, issueRows, regionRows]) => {
      setConstituencies(constituencyRows)
      setAssignmentIssues(issueRows)
      setRegions(regionRows)
      setLoading(false)
    })
  }, [refreshKey])

  const handleAddConstituency = async () => {
    if (!inputValue.trim() || !selectedRegionId) return
    setIsSaving(true)
    const ok = await constituencyService.createConstituency(
      Number(selectedRegionId),
      inputValue.trim()
    )
    setIsSaving(false)
    if (ok) {
      toast.success(`Constituency "${inputValue.trim()}" created`)
      setAddModalOpen(false)
      setInputValue('')
      setSelectedRegionId('')
      refresh()
    } else {
      toast.error('Failed to create constituency')
    }
  }

  const handleEditClick = (c: Constituency) => {
    setEditConstituency(c)
    setEditName(c.name)
    setEditRegionId(c.regionId)
    setEditStatus(c.status)
    setEditDescription(c.description || '')
    setEditMeetingSchedule(c.meetingSchedule || '')
    setEditLocalFocus(c.localFocus || '')
    setEditEmail(c.email || '')
    setEditPhoneNumber(c.phoneNumber || '')
  }

  const handleUpdateConstituency = async () => {
    if (!editConstituency || !editName.trim() || !editRegionId) return
    setIsSaving(true)
    const ok = await constituencyService.updateConstituency(editConstituency.id, {
      name: editName.trim(),
      regionId: Number(editRegionId),
      status: editStatus,
      description: editDescription || undefined,
      meetingSchedule: editMeetingSchedule || undefined,
      localFocus: editLocalFocus || undefined,
      email: editEmail || undefined,
      phoneNumber: editPhoneNumber || undefined,
    })
    setIsSaving(false)
    if (ok) {
      toast.success(`Constituency updated successfully`)
      setEditConstituency(null)
      refresh()
    } else {
      toast.error('Failed to update constituency')
    }
  }

  const handleDeleteConstituency = async () => {
    if (!deleteConstituency) return
    setIsSaving(true)
    const ok = await constituencyService.deleteConstituency(deleteConstituency.id)
    setIsSaving(false)
    if (ok) {
      toast.success(`Constituency "${deleteConstituency.name}" deleted`)
      setDeleteConstituency(null)
      refresh()
    } else {
      toast.error('Failed to delete constituency')
    }
  }

  const filtered = useMemo(() => {
    const list = constituencies.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.regionName.toLowerCase().includes(search.toLowerCase())
      const matchRegion = regionFilter === 'All Regions' || c.regionName === regionFilter
      return matchSearch && matchRegion
    })
    return list.sort((a, b) => {
      if (sortField === 'members') {
        const diff = (a.memberCount || 0) - (b.memberCount || 0)
        return sortOrder === 'asc' ? diff : -diff
      }
      const nameA = a.name || ''
      const nameB = b.name || ''
      return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
  }, [constituencies, search, regionFilter, sortField, sortOrder])

  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = useMemo(() => {
    return filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const total = constituencies.length
  const activeCount = constituencies.filter((c) => c.status === 'Active').length
  const unledCount = constituencies.filter((c) => !c.leaderId).length
  const totalMembers = useMemo(
    () => constituencies.reduce((s, c) => s + (c.memberCount || 0), 0),
    [constituencies]
  )

  // Regional resource-to-impact — grouped by actual constituency region, not chapters.
  const regionalImpactStats = useMemo(() => {
    const byRegion = new Map<string, { memberCount: number; unitCount: number }>()
    constituencies.forEach((c) => {
      if (!c.regionName) return
      const entry = byRegion.get(c.regionName) || { memberCount: 0, unitCount: 0 }
      entry.memberCount += c.memberCount || 0
      entry.unitCount += 1
      byRegion.set(c.regionName, entry)
    })
    return Array.from(byRegion.entries()).map(([label, { memberCount, unitCount }]) => ({
      label,
      memberCount,
      unitCount,
    }))
  }, [constituencies])

  const maxRegionMemberCount = useMemo(
    () => Math.max(...regionalImpactStats.map((s) => s.memberCount), 1),
    [regionalImpactStats]
  )

  const filteredIssues = useMemo(() => {
    return assignmentIssues.filter((issue) => {
      const q = issueSearch.trim().toLowerCase()
      const matchesSearch =
        !q ||
        issue.fullName.toLowerCase().includes(q) ||
        (issue.registrationNumber || '').toLowerCase().includes(q) ||
        (issue.constituency || '').toLowerCase().includes(q) ||
        (issue.chapter || '').toLowerCase().includes(q) ||
        (issue.region || '').toLowerCase().includes(q)
      const matchesPlatform =
        issuePlatformFilter === 'All' || issue.platform === issuePlatformFilter
      return matchesSearch && matchesPlatform
    })
  }, [assignmentIssues, issueSearch, issuePlatformFilter])

  const ISSUES_PER_PAGE = 8
  const issueTotalPages = Math.ceil(filteredIssues.length / ISSUES_PER_PAGE)
  const paginatedIssues = useMemo(() => {
    return filteredIssues.slice((issuePage - 1) * ISSUES_PER_PAGE, issuePage * ISSUES_PER_PAGE)
  }, [filteredIssues, issuePage])

  const handleStartReassign = (issue: MemberAssignmentIssue) => {
    setReassigningId(issue.id)
    setReassignValue(issue.constituency || '')
  }

  const handleSaveReassign = async (issue: MemberAssignmentIssue) => {
    if (!reassignValue.trim() || !issue.registrationNumber) return
    setIsReassigning(true)
    const ok = await adminService.updateMemberProfile(issue.registrationNumber, {
      constituency: reassignValue.trim(),
    })
    setIsReassigning(false)
    if (ok) {
      toast.success(`Updated ${issue.fullName}'s constituency`)
      setReassigningId(null)
      refresh()
    } else {
      toast.error('Failed to update constituency')
    }
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="Constituencies"
        description="Manage Ghana constituency hubs"
        actions={
          canManage ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setInputValue('')
                setSelectedRegionId('')
                setAddModalOpen(true)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add
              </span>
              Define new constituency
            </button>
          ) : undefined
        }
      />

      {/* KPI row */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        <TacticalKPI
          label="Total constituencies"
          value={total}
          description="Registered hubs"
          variant="red"
        />
        <TacticalKPI
          label="Total members"
          value={totalMembers}
          description="Across all constituencies"
          trend={{ direction: 'up', value: 'Live' }}
          variant="gold"
        />
        <TacticalKPI
          label="Active constituencies"
          value={activeCount}
          description={`${unledCount} unled`}
          trend={{ direction: unledCount > 0 ? 'neutral' : 'up', value: 'Review' }}
          variant="black"
        />
        <TacticalKPI
          label="Assignment issues"
          value={assignmentIssues.length}
          description="Pending reconciliation"
          trend={{
            direction: assignmentIssues.length > 0 ? 'down' : 'neutral',
            value: assignmentIssues.length > 0 ? 'Action needed' : 'Clear',
          }}
          variant="green"
        />
      </div>

      <RegionalImpactStats
        stats={regionalImpactStats}
        maxMemberCount={maxRegionMemberCount}
        unitLabel="constituency"
        correlationSubtitle="Mobilization strength by region"
        footprintSubtitle="Regional resource distribution"
      />

      {assignmentIssues.length > 0 && (
        <section className="panel" style={{ marginBottom: 20, overflow: 'hidden' }}>
          <div className="ph">
            <div>
              <h3>Assignment reconciliation</h3>
              <div className="meta">
                Members whose network assignment needs administrative review
              </div>
            </div>
          </div>

          {/* Search + platform filter */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: '1px solid hsl(var(--border))',
              flexWrap: 'wrap',
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
                id="issue-search"
                name="issue-search"
                value={issueSearch}
                onChange={(e) => {
                  setIssueSearch(e.target.value)
                  setIssuePage(1)
                }}
                placeholder="Search by name, reg. number, or assignment..."
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 32,
                  paddingRight: 10,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontFamily: "'Public Sans', sans-serif",
                  boxSizing: 'border-box',
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--on-surface))',
                }}
              />
            </div>
            <label htmlFor="issue-platform-filter" style={{ display: 'none' }}>
              Filter by platform
            </label>
            <select
              id="issue-platform-filter"
              value={issuePlatformFilter}
              onChange={(e) => {
                setIssuePlatformFilter(e.target.value as 'All' | 'GHANA' | 'DIASPORA')
                setIssuePage(1)
              }}
              style={{
                height: 36,
                padding: '0 10px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                background: 'hsl(var(--background))',
                color: 'hsl(var(--on-surface))',
                flexShrink: 0,
                width: 140,
              }}
            >
              <option value="All">All platforms</option>
              <option value="GHANA">Ghana</option>
              <option value="DIASPORA">Diaspora</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  {['Member', 'Platform', 'Current assignment', 'Issue', 'Actions'].map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedIssues.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: 24, color: 'hsl(var(--on-surface-muted))', fontSize: 13 }}
                    >
                      No matching members.
                    </td>
                  </tr>
                ) : (
                  paginatedIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate('/admin/members/' + issue.id)}
                        >
                          {issue.fullName}
                        </button>
                      </td>
                      <td>{issue.platform}</td>
                      <td>
                        {reassigningId === issue.id ? (
                          <input
                            autoFocus
                            value={reassignValue}
                            onChange={(e) => setReassignValue(e.target.value)}
                            placeholder="Constituency name"
                            style={{
                              height: 32,
                              padding: '0 8px',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 12,
                              fontFamily: "'Public Sans', sans-serif",
                              background: 'hsl(var(--card))',
                              color: 'hsl(var(--on-surface))',
                              boxSizing: 'border-box',
                            }}
                            list="constituency-names-datalist"
                          />
                        ) : (
                          issue.constituency || issue.chapter || issue.region || 'Unassigned'
                        )}
                      </td>
                      <td>
                        <span className="pill pill-warn">
                          {issue.issueCode.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {issue.platform === 'GHANA' &&
                          (reassigningId === issue.id ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={isReassigning || !reassignValue.trim()}
                                onClick={() => handleSaveReassign(issue)}
                              >
                                {isReassigning ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => setReassigningId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleStartReassign(issue)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                edit_location_alt
                              </span>
                              Reassign
                            </button>
                          ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <datalist id="constituency-names-datalist">
              {constituencies.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>

          {filteredIssues.length > 0 && (
            <div style={{ padding: '14px 18px' }}>
              <Pagination
                currentPage={issuePage}
                totalPages={issueTotalPages}
                onPageChange={setIssuePage}
                totalItems={filteredIssues.length}
                pageSize={ISSUES_PER_PAGE}
              />
            </div>
          )}
        </section>
      )}

      <ConstituenciesGrid
        currentConstituencies={paginated}
        filteredConstituencies={filtered}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={ITEMS_PER_PAGE}
        loading={loading}
        search={search}
        regionFilter={regionFilter}
        regionOptions={GHANA_REGIONS}
        sortField={sortField}
        sortOrder={sortOrder}
        canManage={canManage}
        onSearchChange={(val) => {
          setSearch(val)
          setCurrentPage(1)
        }}
        onRegionFilterChange={(val) => {
          setRegionFilter(val)
          setCurrentPage(1)
        }}
        onSortFieldChange={setSortField}
        onSortOrderChange={setSortOrder}
        onPageChange={setCurrentPage}
        onOpenAddModal={() => {
          setInputValue('')
          setSelectedRegionId('')
          setAddModalOpen(true)
        }}
        onEditConstituency={handleEditClick}
        onDeleteConstituency={setDeleteConstituency}
      />

      {/* ── Modals ── */}

      {/* Add Constituency */}
      {addModalOpen && (
        <Modal
          title="Define new constituency"
          subtitle="Add a constituency hub to a region"
          onClose={() => setAddModalOpen(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label
                htmlFor="input-con-name"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Constituency name
              </label>
              <input
                name="inputValue"
                id="input-con-name"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="e.g. Ablekuma Central"
                style={inputSt}
              />
            </div>

            <div>
              <label
                htmlFor="select-con-region"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Region
              </label>
              <select
                id="select-con-region"
                value={selectedRegionId}
                onChange={(e) => setSelectedRegionId(Number(e.target.value))}
                style={inputSt}
              >
                <option value="">— select region —</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              onClick={() => setAddModalOpen(false)}
              className="btn btn-outline"
              style={{ flex: 1, height: 42 }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddConstituency}
              disabled={isSaving || !inputValue.trim() || !selectedRegionId}
              className="btn btn-primary"
              style={{ flex: 1, height: 42 }}
            >
              {isSaving ? 'Saving…' : 'Create constituency'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Constituency */}
      {editConstituency && (
        <Modal
          title="Edit constituency"
          subtitle={`Editing: ${editConstituency.name}`}
          onClose={() => setEditConstituency(null)}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              maxHeight: '60vh',
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            <div>
              <label
                htmlFor="edit-con-name"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Constituency name
              </label>
              <input
                name="editName"
                id="edit-con-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={inputSt}
              />
            </div>

            <div>
              <label
                htmlFor="edit-con-region"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Region
              </label>
              <select
                id="edit-con-region"
                value={editRegionId}
                onChange={(e) => setEditRegionId(Number(e.target.value))}
                style={inputSt}
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-con-status"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Status
              </label>
              <select
                id="edit-con-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={inputSt}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-con-desc"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Description
              </label>
              <textarea
                id="edit-con-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{
                  ...inputSt,
                  height: 70,
                  paddingTop: 8,
                  paddingBottom: 8,
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="edit-con-schedule"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Meeting Schedule
              </label>
              <input
                id="edit-con-schedule"
                value={editMeetingSchedule}
                onChange={(e) => setEditMeetingSchedule(e.target.value)}
                placeholder="e.g. Saturdays at 4:00 PM"
                style={inputSt}
              />
            </div>

            <div>
              <label
                htmlFor="edit-con-focus"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Local Focus
              </label>
              <input
                id="edit-con-focus"
                value={editLocalFocus}
                onChange={(e) => setEditLocalFocus(e.target.value)}
                placeholder="e.g. Voter registration"
                style={inputSt}
              />
            </div>

            <div>
              <label
                htmlFor="edit-con-email"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                id="edit-con-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                style={inputSt}
              />
            </div>

            <div>
              <label
                htmlFor="edit-con-phone"
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Phone Number
              </label>
              <input
                id="edit-con-phone"
                value={editPhoneNumber}
                onChange={(e) => setEditPhoneNumber(e.target.value)}
                style={inputSt}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              onClick={() => setEditConstituency(null)}
              className="btn btn-outline"
              style={{ flex: 1, height: 42 }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateConstituency}
              disabled={isSaving || !editName.trim() || !editRegionId}
              className="btn btn-primary"
              style={{ flex: 1, height: 42 }}
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Constituency */}
      {deleteConstituency && (
        <DeleteModal
          label="constituency"
          itemName={`${deleteConstituency.name} (${deleteConstituency.regionName})`}
          onClose={() => setDeleteConstituency(null)}
          onConfirm={handleDeleteConstituency}
          isLoading={isSaving}
        />
      )}
    </div>
  )
}
