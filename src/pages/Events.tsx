import { useState, useMemo, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { toast } from 'sonner'
import { ShareModal } from '@/components/ShareModal'
import { useAuth } from '@/context/AuthContext'
import { adminService } from '@/services/adminService'

export interface MovementEvent {
  id: string
  title: string
  category: 'Town Hall' | 'Mobilization Walk' | 'Job Workshop' | 'Community Action' | 'Diaspora Meetup'
  date: string // ISO date e.g. 2026-10-15T09:00:00+00:00
  locationName: string
  gpsAddress: string
  region: string
  description: string
  attendingCount: number
  organizer: string
  status: 'Planned' | 'In Progress' | 'Completed'
  imageUrl?: string
}

export const PUBLIC_EVENTS: MovementEvent[] = [
  {
    id: 'evt-001',
    title: 'Greater Accra Youth Jobs & Empowerment Town Hall',
    category: 'Town Hall',
    date: '2026-10-15T09:00:00+00:00',
    locationName: 'Tesano Innovation Center, Accra',
    gpsAddress: 'GI-208-9132, Tesano / Abeka 208, Accra',
    region: 'Greater Accra',
    description:
      'Join Movement Founder Dr. George Oti Bonsu and national executive leaders for an interactive town hall detailing the 1 Million Youth Jobs plan and local apprenticeship placements.',
    attendingCount: 480,
    organizer: 'The Base Movement LBG - Greater Accra Chapter',
    status: 'Planned',
    imageUrl: 'https://www.thebasemovement.org.gh/branding/og-image.png?v=20260729',
  },
  {
    id: 'evt-002',
    title: 'Kumasi National Mobilization Walk for Accountability',
    category: 'Mobilization Walk',
    date: '2026-10-22T06:30:00+00:00',
    locationName: 'Jubilee Park, Kumasi',
    gpsAddress: 'AK-039-4112, Jubilee Park, Kumasi',
    region: 'Ashanti',
    description:
      'Mass peaceful solidarity walk advocating for job creation, youth empowerment, and accountable leadership across the Ashanti Region.',
    attendingCount: 1250,
    organizer: 'The Base Movement LBG - Ashanti Regional Secretariat',
    status: 'Planned',
  },
  {
    id: 'evt-003',
    title: 'Tamale Tech & Agricultural Job Skills Workshop',
    category: 'Job Workshop',
    date: '2026-11-05T10:00:00+00:00',
    locationName: 'Tamale Jubilee Center, Northern Region',
    gpsAddress: 'NT-012-9931, Tamale Central',
    region: 'Northern',
    description:
      'Hands-on vocational and tech skills training workshop connecting young graduates with agribusiness and digital apprenticeships.',
    attendingCount: 310,
    organizer: 'The Base Movement LBG - Northern Regional Hub',
    status: 'Planned',
  },
  {
    id: 'evt-004',
    title: 'Takoradi Harbor Community Infrastructure Cleanup',
    category: 'Community Action',
    date: '2026-11-12T07:00:00+00:00',
    locationName: 'Market Circle & Port Area, Takoradi',
    gpsAddress: 'WS-004-1829, Market Circle, Takoradi',
    region: 'Western',
    description:
      'Community-led environmental sanitation and civic restoration action organized by local constituency youth volunteers.',
    attendingCount: 290,
    organizer: 'The Base Movement LBG - Western Region Youth Wing',
    status: 'Planned',
  },
  {
    id: 'evt-005',
    title: 'London & UK Diaspora Global Policy Conference',
    category: 'Diaspora Meetup',
    date: '2026-11-28T14:00:00+00:00',
    locationName: 'Ghana High Commission Annex, London UK',
    gpsAddress: '13 Belgrave Square, London SW1X 8PN',
    region: 'Diaspora',
    description:
      'Strategic networking conference connecting Ghanaian professionals across the UK and Europe with domestic industrialization projects.',
    attendingCount: 410,
    organizer: 'The Base Movement LBG - UK & Europe Chapter',
    status: 'Planned',
  },
]

const CATEGORIES = [
  'All',
  'Town Hall',
  'Mobilization Walk',
  'Job Workshop',
  'Community Action',
  'Diaspora Meetup',
]

const REGIONS = [
  'All Regions',
  'Greater Accra',
  'Ashanti',
  'Northern',
  'Western',
  'Volta',
  'Eastern',
  'Diaspora',
]

export default function Events() {
  const location = useLocation()
  const { user } = useAuth()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const font = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"
  const basePath = isDashboard ? '/dashboard/events' : '/events'

  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set())
  const [shareEvent, setShareEvent] = useState<{ title: string; url: string } | null>(null)
  const [canCreate, setCanCreate] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [eventsList, setEventsList] = useState<MovementEvent[]>(PUBLIC_EVENTS)

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: 'Town Hall' as MovementEvent['category'],
    date: '',
    locationName: '',
    gpsAddress: '',
    region: 'Greater Accra',
    description: '',
  })

  // Permission check: Only Super Admin, Editors, Chapter Leads, Constituency Leads, and Secretaries can create events
  useEffect(() => {
    if (!user) {
      setCanCreate(false)
      return
    }
    let cancelled = false
    async function checkPermission() {
      try {
        const currentAdmin = adminService.getCurrentUser()
        const isChapterLead = await adminService.isChapterLeader(user!.id)
        if (cancelled) return
        const roleUpper = (currentAdmin?.role || '').toUpperCase()
        const isAuthorized =
          ['SUPER_ADMIN', 'FOUNDER', 'ADMIN', 'ADMIN_L2', 'WEB_APP_MANAGER', 'COMMUNICATIONS_OFFICER', 'EDITOR', 'CHAPTER_LEADER', 'CHAPTER_SECRETARY', 'CONSTITUENCY_LEADER', 'CONSTITUENCY_SECRETARY'].includes(roleUpper) ||
          isChapterLead
        setCanCreate(isAuthorized)
      } catch {
        if (!cancelled) setCanCreate(false)
      }
    }
    checkPermission()
    return () => {
      cancelled = true
    }
  }, [user])

  const filteredEvents = useMemo(() => {
    return eventsList.filter((evt) => {
      const matchCat = selectedCategory === 'All' || evt.category === selectedCategory
      const matchRegion = selectedRegion === 'All Regions' || evt.region === selectedRegion
      const matchSearch =
        evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCat && matchRegion && matchSearch
    })
  }, [eventsList, selectedCategory, selectedRegion, searchTerm])

  const handleRSVP = (evt: MovementEvent) => {
    if (rsvpedEventIds.has(evt.id)) {
      toast.info(`You have already registered attendance for ${evt.title}`)
      return
    }
    setRsvpedEventIds((prev) => new Set(prev).add(evt.id))
    toast.success(`Attendance confirmed for "${evt.title}"! Added to your mobilization schedule.`)
  }

  const generateGoogleCalendarUrl = (evt: MovementEvent) => {
    const startStr = new Date(evt.date).toISOString().replace(/-|:|\.\d\d\d/g, '')
    const endDate = new Date(new Date(evt.date).getTime() + 3 * 3600 * 1000)
    const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '')
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      evt.title
    )}&dates=${startStr}/${endStr}&details=${encodeURIComponent(
      evt.description
    )}&location=${encodeURIComponent(evt.gpsAddress)}`
  }

  // Schema generation for Google "Events Near Me" & ItemList
  const eventsJsonLd = useMemo(() => {
    const listSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'The Base Movement Mobilization Events & Town Halls',
      description:
        'Official calendar of mobilization walks, town halls, job workshops, and community cleanups hosted by The Base Movement across Ghana.',
      url: 'https://www.thebasemovement.org.gh/events',
      numberOfItems: filteredEvents.length,
      itemListElement: filteredEvents.map((evt, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Event',
          name: evt.title,
          description: evt.description,
          startDate: evt.date,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: evt.locationName,
            address: {
              '@type': 'PostalAddress',
              streetAddress: evt.gpsAddress,
              addressLocality: evt.region,
              addressCountry: evt.region === 'Diaspora' ? 'UK' : 'GH',
            },
          },
          organizer: {
            '@type': 'NGO',
            name: evt.organizer,
            url: 'https://www.thebasemovement.org.gh',
          },
        },
      })),
    }

    const singleEventSchemas = filteredEvents.map((evt) => ({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: evt.title,
      description: evt.description,
      startDate: evt.date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: evt.locationName,
        address: {
          '@type': 'PostalAddress',
          streetAddress: evt.gpsAddress,
          addressLocality: evt.region,
          addressCountry: evt.region === 'Diaspora' ? 'UK' : 'GH',
        },
      },
      organizer: {
        '@type': 'NGO',
        name: evt.organizer,
        url: 'https://www.thebasemovement.org.gh',
      },
    }))

    return [listSchema, ...singleEventSchemas]
  }, [filteredEvents])

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.date || !newEvent.locationName) {
      toast.error('Please fill in all required fields.')
      return
    }
    const created: MovementEvent = {
      id: `evt-${Date.now()}`,
      title: newEvent.title,
      category: newEvent.category,
      date: new Date(newEvent.date).toISOString(),
      locationName: newEvent.locationName,
      gpsAddress: newEvent.gpsAddress || 'Accra, Ghana',
      region: newEvent.region,
      description: newEvent.description,
      attendingCount: 1,
      organizer: `The Base Movement LBG - ${newEvent.region} Secretariat`,
      status: 'Planned',
    }
    setEventsList((prev) => [created, ...prev])
    toast.success(`Draft event "${newEvent.title}" published successfully!`)
    setIsCreateModalOpen(false)
    setNewEvent({
      title: '',
      category: 'Town Hall',
      date: '',
      locationName: '',
      gpsAddress: '',
      region: 'Greater Accra',
      description: '',
    })
  }

  return (
    <div
      className={isDashboard ? 'main' : undefined}
      style={
        isDashboard
          ? { fontFamily: font }
          : { fontFamily: font, maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }
      }
    >
      <SEO
        title="Mobilization Events & Town Halls | The Base Movement Ghana"
        description="Find upcoming town halls, mobilization walks, job workshops, and community cleanups hosted by The Base Movement across Ghana and Diaspora chapters."
        keywords="the base movement events, ghana town halls 2026, Dr George Oti Bonsu events, youth mobilization walk accra, kumasi town hall, jobs workshops ghana, base ghana events"
        canonical="/events"
        jsonLd={eventsJsonLd}
      />

      {isDashboard && <Breadcrumbs />}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            Mobilization Events & Town Halls
          </h1>
          <p
            style={{
              fontSize: 14,
              fontWeight: 'var(--font-weight-normal, 400)',
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: 780,
            }}
          >
            Join town halls, national mobilization walks, career workshops, and community action days led by Dr. George Oti Bonsu and regional leadership across Ghana and the diaspora.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              add_circle
            </span>
            Create Event
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-active-tab' : 'btn-inactive-tab'}`}
              style={{ whiteSpace: 'nowrap' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Region & Search row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              id="events-search"
              name="events-search"
              placeholder="Search event title, venue, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 34,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontFamily: font,
                fontSize: 13,
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--background))',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            id="events-region"
            name="events-region"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              height: 38,
              padding: '0 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: font,
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--background))',
              minWidth: 160,
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

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div
          className="panel"
          style={{
            textAlign: 'center',
            padding: 48,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 42, marginBottom: 8 }}>
            event_busy
          </span>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No upcoming events found matching your filters.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: 20,
          }}
        >
          {filteredEvents.map((evt) => {
            const dateObj = new Date(evt.date)
            const dayNum = dateObj.getDate()
            const monthStr = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()
            const timeStr = dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
            const isRsvped = rsvpedEventIds.has(evt.id)

            const cardBanner =
              evt.imageUrl ||
              'https://www.thebasemovement.org.gh/branding/og-image.png?v=20260729'

            return (
              <div
                key={evt.id}
                className="panel"
                style={{
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: 'hsl(var(--primary))',
                    zIndex: 2,
                  }}
                />

                {/* Event Card Banner */}
                <Link to={`${basePath}/${evt.id}`} style={{ display: 'block', height: 140, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={cardBanner}
                    alt={evt.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                    }}
                  />
                  <span
                    className="pill"
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: 'hsl(var(--primary))',
                      color: '#ffffff',
                    }}
                  >
                    {evt.status}
                  </span>
                </Link>

                <div style={{ padding: '16px 20px 16px', flex: 1 }}>
                  {/* Top row: Date Badge & Category Pill */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          background: 'hsl(var(--primary) / 0.1)',
                          border: '1px solid hsl(var(--primary) / 0.2)',
                          color: 'hsl(var(--primary))',
                          borderRadius: 'var(--radius-sm)',
                          padding: '4px 8px',
                          textAlign: 'center',
                          minWidth: 42,
                        }}
                      >
                        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1 }}>{dayNum}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>
                          {monthStr}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontWeight: 500 }}>
                        {timeStr}
                      </span>
                    </div>

                    <span
                      className="pill"
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: 'hsl(var(--accent) / 0.15)',
                        color: 'hsl(var(--accent))',
                      }}
                    >
                      {evt.category}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h2
                    style={{
                      fontSize: 16,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface))',
                      margin: '0 0 8px',
                      lineHeight: 1.35,
                    }}
                  >
                    <Link
                      to={`${basePath}/${evt.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                      className="hover:underline"
                    >
                      {evt.title}
                    </Link>
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--on-surface-muted))',
                      margin: '0 0 14px',
                      lineHeight: 1.5,
                    }}
                  >
                    {evt.description}
                  </p>

                  {/* Location & Ghana Post GPS Tag */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                      background: 'hsl(var(--card))',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>
                        location_on
                      </span>
                      <span>{evt.locationName}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', paddingLeft: 21 }}>
                      {evt.gpsAddress}
                    </div>
                  </div>

                  {/* Organizer & RSVP Counter */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    <span>{evt.organizer}</span>
                    <span style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>
                      {evt.attendingCount + (isRsvped ? 1 : 0)} Attending
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div
                  style={{
                    borderTop: '1px solid hsl(var(--border))',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    background: 'hsl(var(--background))',
                  }}
                >
                  <button
                    onClick={() => handleRSVP(evt)}
                    className={`btn btn-sm ${isRsvped ? 'btn-ok' : 'btn-primary'}`}
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      {isRsvped ? 'check_circle' : 'event_available'}
                    </span>
                    {isRsvped ? 'Confirmed' : 'RSVP / Attend'}
                  </button>

                  <a
                    href={generateGoogleCalendarUrl(evt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    title="Add to Google Calendar"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      calendar_add_on
                    </span>
                  </a>

                  <button
                    onClick={() =>
                      setShareEvent({
                        title: evt.title,
                        url: `${window.location.origin}/events#${evt.id}`,
                      })
                    }
                    className="btn btn-ghost btn-sm"
                    title="Share Event"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      share
                    </span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {shareEvent && (
        <ShareModal
          isOpen={!!shareEvent}
          onClose={() => setShareEvent(null)}
          title={shareEvent.title}
          url={shareEvent.url}
        />
      )}

      {isCreateModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="panel"
            style={{
              maxWidth: 520,
              width: '100%',
              background: 'hsl(var(--surface))',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              padding: 24,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'hsl(var(--on-surface))' }}>
                Create New Event Draft
              </h2>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ padding: 4 }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'hsl(var(--on-surface))' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greater Accra Youth Mobilization Walk"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--on-surface))',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'hsl(var(--on-surface))' }}>
                    Category *
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as MovementEvent['category'] })}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    <option value="Town Hall">Town Hall</option>
                    <option value="Mobilization Walk">Mobilization Walk</option>
                    <option value="Job Workshop">Job Workshop</option>
                    <option value="Community Action">Community Action</option>
                    <option value="Diaspora Meetup">Diaspora Meetup</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'hsl(var(--on-surface))' }}>
                    Region *
                  </label>
                  <select
                    value={newEvent.region}
                    onChange={(e) => setNewEvent({ ...newEvent, region: e.target.value })}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {REGIONS.filter((r) => r !== 'All Regions').map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'hsl(var(--on-surface))' }}>
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--on-surface))',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'hsl(var(--on-surface))' }}>
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tesano Innovation Center"
                    value={newEvent.locationName}
                    onChange={(e) => setNewEvent({ ...newEvent, locationName: e.target.value })}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--on-surface))',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'hsl(var(--on-surface))' }}>
                  Ghana Post GPS / Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. GI-208-9132, Tesano, Accra"
                  value={newEvent.gpsAddress}
                  onChange={(e) => setNewEvent({ ...newEvent, gpsAddress: e.target.value })}
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--on-surface))',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'hsl(var(--on-surface))' }}>
                  Event Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the agenda, speakers, objectives, and meeting logistics..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: font,
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Event Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
