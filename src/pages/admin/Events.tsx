/**
 * admin/Events.tsx
 * ─────────────────────────────────────────────────────────────────
 * Admin Command Center - Field Events & Mobilization Management.
 * Manage town halls, rallies, recruitment drives, and skills workshops across regions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import type { FieldEvent } from '@/types/admin'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import { toast } from 'sonner'

const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Volta',
  'Northern',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Oti',
  'Savannah',
  'North East',
  'Western North',
]

const EVENT_TYPES: FieldEvent['type'][] = ['Town Hall', 'Rally', 'Recruitment', 'Training']
const EVENT_STATUSES: FieldEvent['status'][] = ['Planned', 'In Progress', 'Completed', 'Cancelled']

type EventFormData = Omit<FieldEvent, 'id'>

const EMPTY_FORM: EventFormData = {
  title: '',
  date: new Date().toISOString().slice(0, 16),
  location: '',
  chapter: 'Greater Accra',
  status: 'Planned',
  attendees_expected: 100,
  attendees_actual: 0,
  budget_allocated: 1000,
  budget_spent: 0,
  type: 'Town Hall',
  image_url: '',
  description: '',
}

export default function AdminEvents() {
  const [events, setEvents] = useState<FieldEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [chapterFilter, setChapterFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<FieldEvent | null>(null)
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  const { openDelete, modal: deleteModal } = useDeleteModal()

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await adminService.getFieldEvents()
      setEvents(data)
    } catch {
      toast.error('Failed to load field events from vault.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Handle URL ?edit=ID parameter
  useEffect(() => {
    if (events.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')
    if (editId) {
      const target = events.find((e) => e.id === editId)
      if (target) {
        handleOpenModal(target)
      }
    }
  }, [events])

  // Open Create / Edit Modal
  const handleOpenModal = (event?: FieldEvent) => {
    if (event) {
      setEditingEvent(event)
      setFormData({
        title: event.title,
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        location: event.location || '',
        chapter: event.chapter || 'Greater Accra',
        status: event.status || 'Planned',
        attendees_expected: event.attendees_expected || 0,
        attendees_actual: event.attendees_actual || 0,
        budget_allocated: event.budget_allocated || 0,
        budget_spent: event.budget_spent || 0,
        type: event.type || 'Town Hall',
        image_url: event.image_url || '',
        description: event.description || '',
      })
    } else {
      setEditingEvent(null)
      setFormData({
        ...EMPTY_FORM,
        date: new Date().toISOString().slice(0, 16),
      })
    }
    setIsModalOpen(true)
  }

  const handleBannerUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', { description: 'Please select an image file (PNG, JPG, WEBP).' })
      return
    }
    setIsUploadingBanner(true)
    try {
      const url = await contentService.uploadImage(file, 'public-assets')
      if (url) {
        setFormData((prev) => ({ ...prev, image_url: url }))
        toast.success('Event banner uploaded successfully')
      } else {
        toast.error('Failed to upload event banner')
      }
    } catch {
      toast.error('Operational error while uploading banner')
    } finally {
      setIsUploadingBanner(false)
    }
  }

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Title required', { description: 'Please enter an event title.' })
      return
    }

    setIsSubmitting(true)
    try {
      let success = false
      if (editingEvent) {
        success = await adminService.updateFieldEvent(editingEvent.id, formData)
      } else {
        success = await adminService.createFieldEvent(formData)
      }

      if (success) {
        toast.success(editingEvent ? 'Event updated successfully' : 'Field event created & scheduled', {
          description: `"${formData.title}" has been synced to the field database.`,
        })
        setIsModalOpen(false)
        fetchEvents()
      } else {
        toast.error('Failed to save field event.')
      }
    } catch {
      toast.error('Operational error while saving field event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete Event
  const handleDelete = (event: FieldEvent) => {
    openDelete({
      itemName: event.title,
      title: 'Delete Field Event',
      description: `Are you sure you want to permanently remove "${event.title}" from the mobilization database?`,
      isPermanent: true,
      successMessage: `"${event.title}" deleted`,
      errorMessage: 'Failed to delete field event',
      onConfirm: async () => {
        const success = await adminService.deleteFieldEvent(event.id)
        if (success) fetchEvents()
        return success
      },
    })
  }

  // Filtered and Sorted Events
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const matchesSearch =
          evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evt.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          evt.chapter?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || evt.status === statusFilter
        const matchesType = typeFilter === 'all' || evt.type === typeFilter
        const matchesChapter = chapterFilter === 'all' || evt.chapter === chapterFilter
        return matchesSearch && matchesStatus && matchesType && matchesChapter
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime()
        const timeB = new Date(b.date).getTime()
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
      })
  }, [events, searchQuery, statusFilter, typeFilter, chapterFilter, sortOrder])

  // KPIs
  const stats = useMemo(() => {
    const plannedCount = events.filter((e) => e.status === 'Planned').length
    const inProgressCount = events.filter((e) => e.status === 'In Progress').length
    const completedCount = events.filter((e) => e.status === 'Completed').length
    const totalExpected = events.reduce((acc, curr) => acc + (curr.attendees_expected || 0), 0)
    const totalBudgetAllocated = events.reduce((acc, curr) => acc + (curr.budget_allocated || 0), 0)
    return { plannedCount, inProgressCount, completedCount, totalExpected, totalBudgetAllocated }
  }, [events])

  const getStatusPill = (status: FieldEvent['status']) => {
    switch (status) {
      case 'Completed':
        return <span className="pill pill-ok">Completed</span>
      case 'In Progress':
        return <span className="pill pill-warn">In Progress</span>
      case 'Planned':
        return <span className="pill pill-warn" style={{ background: 'hsl(217, 91%, 60% / 0.15)', color: 'hsl(217, 91%, 45%)' }}>Planned</span>
      case 'Cancelled':
        return <span className="pill pill-err">Cancelled</span>
    }
  }

  return (
    <div className="main">
      <SEO
        title="Admin Field Events & Mobilization Command | The Base Movement"
        description="Manage regional town halls, rallies, training workshops, and constituency mobilization walks."
      />

      <AdminPageHeader
        title="Field Events Command"
        icon="event"
        description="Schedule, coordinate, and track regional town halls, rallies, recruitment drives, and training workshops."
        actions={
          <>
            <Link to="/admin/content-calendar" className="btn btn-outline btn-sm" style={{ textDecoration: 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
              Content Calendar
            </Link>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Schedule Event
            </button>
          </>
        }
      />

      {/* Tactical KPIs Strip */}
      <div className="kpis grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 20 }}>
        <div className="panel" style={{ borderLeft: '3px solid hsl(var(--destructive))', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Active & Planned Events
          </div>
          <div style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 700, color: 'hsl(var(--destructive))', marginTop: 4 }}>
            {stats.plannedCount + stats.inProgressCount}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
            {stats.plannedCount} planned · {stats.inProgressCount} active
          </div>
        </div>

        <div className="panel" style={{ borderLeft: '3px solid hsl(var(--accent))', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Total Budget Allocated
          </div>
          <div style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 700, color: 'hsl(var(--accent))', marginTop: 4 }}>
            GHS {stats.totalBudgetAllocated.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
            Logistics & mobilization funding
          </div>
        </div>

        <div className="panel" style={{ borderLeft: '3px solid hsl(var(--on-surface))', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em', marginBottom: 4 }}>
            Expected Attendance
          </div>
          <div style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 800, color: 'hsl(var(--on-surface))', marginTop: 4 }}>
            {stats.totalExpected.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
            Target citizens across events
          </div>
        </div>

        <div className="panel" style={{ borderLeft: '3px solid hsl(var(--primary))', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Completed Mobilizations
          </div>
          <div style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 700, color: 'hsl(var(--primary))', marginTop: 4 }}>
            {stats.completedCount}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
            Concluded regional sessions
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="panel" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', minWidth: 260, flex: 1 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 18,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search by event title, location, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 38,
                paddingRight: 12,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--surface))',
                color: 'hsl(var(--on-surface))',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--surface))',
                color: 'hsl(var(--on-surface))',
                fontSize: 13,
              }}
            >
              <option value="all">All Statuses</option>
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--surface))',
                color: 'hsl(var(--on-surface))',
                fontSize: 13,
              }}
            >
              <option value="all">All Categories</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Region / Chapter Filter */}
            <select
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--surface))',
                color: 'hsl(var(--on-surface))',
                fontSize: 13,
              }}
            >
              <option value="all">All Regions</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {/* Sort Toggle */}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sorting by date ${sortOrder === 'asc' ? 'oldest first' : 'newest first'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
              Date
            </button>
          </div>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 8 }}>progress_activity</span>
            <div>Loading field events directory...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 42, marginBottom: 8, opacity: 0.5 }}>event_busy</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--on-surface))' }}>No Field Events Found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try clearing search filters or schedule a new mobilization event.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'hsl(var(--surface))', borderBottom: '1px solid hsl(var(--border))', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>Event Details</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>Category</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>Region / Chapter</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>Date & Time</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>Attendance</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>Budget</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'hsl(var(--on-surface-muted))' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: 'hsl(var(--on-surface-muted))', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((evt) => {
                  const evtDate = evt.date ? new Date(evt.date) : new Date()
                  const formattedDate = evtDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  const formattedTime = evtDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

                  return (
                    <tr key={evt.id} style={{ borderBottom: '1px solid hsl(var(--border))', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {evt.image_url ? (
                            <img
                              src={evt.image_url}
                              alt={evt.title}
                              style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid hsl(var(--border))' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 48,
                                height: 36,
                                borderRadius: 'var(--radius-xs)',
                                background: 'hsl(var(--primary) / 0.1)',
                                color: 'hsl(var(--primary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>event</span>
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'hsl(var(--on-surface))' }}>{evt.title}</div>
                            <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                              {evt.location || 'Venue TBA'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          className="pill"
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            background: 'hsl(var(--primary) / 0.12)',
                            color: 'hsl(var(--primary))',
                          }}
                        >
                          {evt.type}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'hsl(var(--on-surface))' }}>
                        {evt.chapter}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: 'hsl(var(--on-surface))' }}>{formattedDate}</div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{formattedTime}</div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'hsl(var(--on-surface))' }}>
                          {evt.attendees_actual ?? evt.attendees_expected ?? 0}
                        </div>
                        <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                          Target: {evt.attendees_expected}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'hsl(var(--on-surface))' }}>
                          GHS {evt.budget_allocated ? evt.budget_allocated.toLocaleString() : '0'}
                        </div>
                        {evt.budget_spent > 0 && (
                          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                            Spent: GHS {evt.budget_spent.toLocaleString()}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {getStatusPill(evt.status)}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleOpenModal(evt)}
                            title="Edit event"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'hsl(var(--destructive))' }}
                            onClick={() => handleDelete(evt)}
                            title="Delete event"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog for Event Creation / Editing */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="panel"
            style={{
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--on-surface))', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'hsl(var(--primary))' }}>event</span>
                {editingEvent ? 'Edit Mobilization Event' : 'Schedule New Field Event'}
              </h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: 4 }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Event Title */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greater Accra Youth Jobs & Empowerment Town Hall"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--surface))',
                    color: 'hsl(var(--on-surface))',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Event Banner Image Upload & URL */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                  Event Banner Image
                </label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="url"
                    placeholder="https://... (or upload image file below)"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                    style={{
                      flex: 1,
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <label
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', height: 38, margin: 0 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      {isUploadingBanner ? 'progress_activity' : 'upload'}
                    </span>
                    {isUploadingBanner ? 'Uploading...' : 'Upload Banner'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={isUploadingBanner}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleBannerUpload(file)
                      }}
                    />
                  </label>
                </div>

                {/* Banner Preview Box */}
                {formData.image_url ? (
                  <div
                    style={{
                      position: 'relative',
                      height: 120,
                      width: '100%',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--background))',
                    }}
                  >
                    <img
                      src={formData.image_url}
                      alt="Banner Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        background: 'rgba(0, 0, 0, 0.6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remove banner"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      height: 70,
                      width: '100%',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed hsl(var(--border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 12,
                      background: 'hsl(var(--surface))',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>image</span>
                    No banner image selected. Upload a file or paste image URL.
                  </div>
                )}
              </div>

              {/* Event Description */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                  Event Description & Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide detailed description, key speakers, agenda items, and participant guidance..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--surface))',
                    color: 'hsl(var(--on-surface))',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Category & Region */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                    Category Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value as FieldEvent['type'] }))}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                    }}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                    Region / Chapter *
                  </label>
                  <select
                    value={formData.chapter}
                    onChange={(e) => setFormData((prev) => ({ ...prev, chapter: e.target.value }))}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                    }}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Venue Location & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                    Venue / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tesano Innovation Center, Accra"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Status & Expected Attendance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                    Mobilization Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as FieldEvent['status'] }))}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                    }}
                  >
                    {EVENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                    Target Expected Attendance
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.attendees_expected}
                    onChange={(e) => setFormData((prev) => ({ ...prev, attendees_expected: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Budget Allocated & Spent */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                    Budget Allocated (GHS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.budget_allocated}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budget_allocated: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                    Budget Spent (GHS)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.budget_spent}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budget_spent: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--on-surface))',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving Event...' : editingEvent ? 'Save Changes' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModal}
    </div>
  )
}
