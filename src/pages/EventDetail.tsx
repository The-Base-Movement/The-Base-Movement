import { useState, useEffect } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import SEO from '@/components/SEO'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { toast } from 'sonner'
import { ShareModal } from '@/components/ShareModal'
import { supabase } from '@/lib/supabase'
import { PUBLIC_EVENTS } from './Events'
import type { MovementEvent } from './Events'

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const isDashboard = location.pathname.startsWith('/dashboard')
  const font = isDashboard ? "'Public Sans', sans-serif" : "'Work Sans', sans-serif"
  const basePath = isDashboard ? '/dashboard/events' : '/events'

  const [event, setEvent] = useState<MovementEvent | null>(() => {
    return PUBLIC_EVENTS.find((e) => e.id === id) || null
  })
  const [isLoading, setIsLoading] = useState(!event)
  const [hasRsvped, setHasRsvped] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  useEffect(() => {
    if (event || !id) return
    let cancelled = false
    async function fetchEventFromDb() {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('field_events')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !data || cancelled) {
          setIsLoading(false)
          return
        }

        const loadedEvt: MovementEvent = {
          id: data.id,
          title: data.title,
          category: data.type === 'Rally' ? 'Mobilization Walk' : data.type === 'Training' ? 'Job Workshop' : (data.type as MovementEvent['category']) || 'Town Hall',
          date: data.date,
          locationName: data.location || 'Location TBA',
          gpsAddress: data.location || '',
          region: data.chapter || 'Greater Accra',
          description: data.description || '',
          attendingCount: data.attendees_actual || data.attendees_expected || 0,
          organizer: `The Base Movement LBG - ${data.chapter || 'Secretariat'}`,
          status: data.status === 'Completed' ? 'Completed' : data.status === 'In Progress' ? 'In Progress' : 'Planned',
        }

        if (!cancelled) setEvent(loadedEvt)
      } catch {
        // Fallback
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    fetchEventFromDb()
    return () => {
      cancelled = true
    }
  }, [id, event])

  if (isLoading) {
    return (
      <div
        className={isDashboard ? 'main' : undefined}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          fontFamily: font,
          textAlign: 'center',
          padding: 24,
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 8 }}>
          progress_activity
        </span>
        <div>Loading event details...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div
        className={isDashboard ? 'main' : undefined}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          fontFamily: font,
          textAlign: 'center',
          padding: 24,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--on-surface-muted))', marginBottom: 12 }}>
          event_busy
        </span>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '0 0 8px' }}>
          Event Not Found
        </h2>
        <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', margin: '0 0 20px' }}>
          The mobilization event you are looking for does not exist or may have been updated.
        </p>
        <Link to={basePath} className="btn btn-primary">
          Back to Events Directory
        </Link>
      </div>
    )
  }

  const dateObj = new Date(event.date)
  const fullDateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const timeStr = dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const generateGoogleCalendarUrl = () => {
    const startStr = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, '')
    const endDate = new Date(new Date(event.date).getTime() + 3 * 3600 * 1000)
    const endStr = endDate.toISOString().replace(/-|:|\.\d\d\d/g, '')
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&dates=${startStr}/${endStr}&details=${encodeURIComponent(
      event.description
    )}&location=${encodeURIComponent(event.gpsAddress)}`
  }

  const handleRSVP = () => {
    if (hasRsvped) {
      toast.info(`You are already registered for ${event.title}`)
      return
    }
    setHasRsvped(true)
    toast.success(`Attendance confirmed for "${event.title}"!`)
  }

  const eventBanner =
    event.imageUrl ||
    'https://www.thebasemovement.org.gh/branding/og-image.png?v=20260729'

  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: eventBanner,
    location: {
      '@type': 'Place',
      name: event.locationName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.gpsAddress,
        addressLocality: event.region,
        addressCountry: event.region === 'Diaspora' ? 'UK' : 'GH',
      },
    },
    organizer: {
      '@type': 'NGO',
      name: event.organizer,
      url: 'https://www.thebasemovement.org.gh',
    },
  }

  return (
    <div
      className={isDashboard ? 'main' : undefined}
      style={
        isDashboard
          ? { fontFamily: font }
          : { fontFamily: font, maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }
      }
    >
      <SEO
        title={`${event.title} | The Base Movement Ghana`}
        description={`${event.title} taking place at ${event.locationName}. ${event.description.slice(0, 140)}...`}
        keywords={`${event.title}, ${event.category}, ${event.region} event, ${event.locationName}, Dr George Oti Bonsu`}
        canonical={`/events/${event.id}`}
        jsonLd={eventSchema}
      />

      {isDashboard && <Breadcrumbs />}

      {/* Back Button */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate(basePath)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 20 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_back
        </span>
        Back to Events
      </button>

      {/* Hero Event Card Header */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ position: 'relative', height: 260, width: '100%', overflow: 'hidden' }}>
          <img
            src={eventBanner}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: 24,
              right: 24,
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span
                className="pill"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'hsl(var(--primary))',
                  color: '#ffffff',
                }}
              >
                {event.category}
              </span>

              <span
                className="pill"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                }}
              >
                {event.region}
              </span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>
              {event.title}
            </h1>
          </div>
        </div>

        {/* Action & Metadata Bar */}
        <div
          style={{
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            background: 'hsl(var(--surface))',
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--on-surface))' }}>
              {fullDateStr} at {timeStr}
            </div>
            <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
              Organized by {event.organizer}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleRSVP}
              className={`btn ${hasRsvped ? 'btn-ok' : 'btn-primary'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {hasRsvped ? 'check_circle' : 'event_available'}
              </span>
              {hasRsvped ? 'Confirmed Attending' : 'RSVP & Attend'}
            </button>

            <a
              href={generateGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                calendar_add_on
              </span>
              Add to Calendar
            </a>

            <button
              onClick={() => setIsShareOpen(true)}
              className="btn btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                share
              </span>
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24 }}>
        {/* Left Column: Details & Agenda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '0 0 12px' }}>
              About This Event
            </h2>
            <p style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, margin: 0 }}>
              {event.description}
            </p>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '0 0 16px' }}>
              Event Agenda & Highlights
            </h2>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.8 }}>
              <li>Opening Remarks & National Mobilization Keynote by Movement Leadership.</li>
              <li>Interactive Youth Employment, Entrepreneurship & Skills Presentation.</li>
              <li>Community Floor Q&A with Regional Executive Officers.</li>
              <li>Networking Session & Local Chapter Registration Drive.</li>
            </ul>
          </div>
        </div>

        {/* Right Sidebar: Location & Attendance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Venue Card */}
          <div className="panel" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '0 0 12px' }}>
              Venue & Location
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'hsl(var(--on-surface))' }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>
                  location_on
                </span>
                {event.locationName}
              </div>
              <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', paddingLeft: 24 }}>
                Ghana Post GPS: {event.gpsAddress}
              </div>
            </div>
          </div>

          {/* Attendees Card */}
          <div className="panel" style={{ padding: 20, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--primary))', marginBottom: 6 }}>
              groups
            </span>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'hsl(var(--on-surface))' }}>
              {event.attendingCount + (hasRsvped ? 1 : 0)}
            </div>
            <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
              Registered Attendees
            </div>
          </div>
        </div>
      </div>

      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          title={event.title}
          url={window.location.href}
        />
      )}
    </div>
  )
}
