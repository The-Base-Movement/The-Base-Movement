import { useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import SEO from '@/components/SEO'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { toast } from 'sonner'
import { ShareModal } from '@/components/ShareModal'

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
  imageUrl?: string
}

const PUBLIC_EVENTS: MovementEvent[] = [
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
  const isDashboard = location.pathname.startsWith('/dashboard')
  const font = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"

  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set())
  const [shareEvent, setShareEvent] = useState<{ title: string; url: string } | null>(null)

  const filteredEvents = useMemo(() => {
    return PUBLIC_EVENTS.filter((evt) => {
      const matchCat = selectedCategory === 'All' || evt.category === selectedCategory
      const matchRegion = selectedRegion === 'All Regions' || evt.region === selectedRegion
      const matchSearch =
        evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchTerm.toLowerCase())
      return matchCat && matchRegion && matchSearch
    })
  }, [selectedCategory, selectedRegion, searchTerm])

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

      <div style={{ marginBottom: 28 }}>
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
                  }}
                />

                <div style={{ padding: '20px 20px 16px', flex: 1 }}>
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
                    {evt.title}
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
    </div>
  )
}
