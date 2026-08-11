import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '@/components/SEO'
import { supabase } from '@/lib/supabase'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'

export interface CalendarItem {
  id: string
  title: string
  type: 'blog' | 'press' | 'newsletter' | 'event'
  status: 'Draft' | 'Scheduled' | 'Published'
  date: string // YYYY-MM-DD
  fullTimestamp: string
  author?: string
  snippet?: string
  editUrl: string
}

export default function ContentCalendar() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [items, setItems] = useState<CalendarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null)
  const [quickComposeDate, setQuickComposeDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch blog posts, press releases, newsletters, and events from database
  useEffect(() => {
    let cancelled = false
    async function fetchCalendarData() {
      setIsLoading(true)
      try {
        const [blogPosts, pressReleases, newslettersRes, eventsRes] = await Promise.all([
          adminService.getBlogPosts().catch(() => []),
          contentService.getPressReleases().catch(() => []),
          Promise.resolve(
            supabase
              .from('newsletters')
              .select('id, subject, status, created_at, sent_at, body_html')
              .then((r) => r.data || [])
          ).catch(() => []),
          Promise.resolve(
            supabase
              .from('field_events')
              .select('id, title, status, date, location, description')
              .then((r) => r.data || [])
          ).catch(() => []),
        ])

        if (cancelled) return

        const calendarItems: CalendarItem[] = []

        // 1. Process Blog Posts (Drafts + Live Published)
        for (const post of blogPosts) {
          const rawDate =
            post.publishedAt ||
            (post as unknown as Record<string, string>).created_at ||
            new Date().toISOString()
          const d = new Date(rawDate)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          const dateStr = `${yyyy}-${mm}-${dd}`

          calendarItems.push({
            id: `blog-${post.id}`,
            title: post.title || 'Untitled Article',
            type: 'blog',
            status: post.status === 'Published' ? 'Published' : post.status === 'Pending Verification' ? 'Scheduled' : 'Draft',
            date: dateStr,
            fullTimestamp: rawDate,
            author: post.authorName || 'Editorial Team',
            snippet: post.excerpt || '',
            editUrl: `/admin/blogs?edit=${post.id}`,
          })
        }

        // 2. Process Press Releases (Drafts + Live Published)
        for (const press of pressReleases) {
          const rawDate = press.publishedAt || press.createdAt || new Date().toISOString()
          const d = new Date(rawDate)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          const dateStr = `${yyyy}-${mm}-${dd}`

          calendarItems.push({
            id: `press-${press.id}`,
            title: press.title || 'Press Release',
            type: 'press',
            status: press.publishedAt ? 'Published' : 'Draft',
            date: dateStr,
            fullTimestamp: rawDate,
            author: press.category || 'Press Office',
            snippet: press.excerpt || '',
            editUrl: `/admin/press-releases?edit=${press.id}`,
          })
        }

        // 3. Process Newsletters
        for (const nl of newslettersRes || []) {
          const rawDate = nl.sent_at || nl.created_at || new Date().toISOString()
          const d = new Date(rawDate)
          const yyyy = d.getFullYear()
          const mm = String(d.getMonth() + 1).padStart(2, '0')
          const dd = String(d.getDate()).padStart(2, '0')
          const dateStr = `${yyyy}-${mm}-${dd}`

          calendarItems.push({
            id: `nl-${nl.id}`,
            title: nl.subject,
            type: 'newsletter',
            status: nl.status === 'sent' ? 'Published' : 'Draft',
            date: dateStr,
            fullTimestamp: rawDate,
            author: 'Communications Bureau',
            snippet: (nl.body_html || '').replace(/<[^>]+>/g, '').slice(0, 100),
            editUrl: `/admin/newsletter?tab=compose&edit=${nl.id}`,
          })
        }

        // 4. Process Field Events
        for (const evt of eventsRes || []) {
          if (evt.date) {
            const d = new Date(evt.date)
            const yyyy = d.getFullYear()
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const dd = String(d.getDate()).padStart(2, '0')
            const dateStr = `${yyyy}-${mm}-${dd}`

            calendarItems.push({
              id: `evt-${evt.id}`,
              title: evt.title,
              type: 'event',
              status: evt.status === 'Completed' ? 'Published' : evt.status === 'Planned' ? 'Scheduled' : 'Draft',
              date: dateStr,
              fullTimestamp: evt.date,
              author: evt.location || 'Regional Mobilization',
              snippet: evt.description || '',
              editUrl: `/admin/events?edit=${evt.id}`,
            })
          }
        }

        setItems(calendarItems)
      } catch (err) {
        console.error('[CONTENT-CALENDAR] Error fetching items:', err)
        toast.error('Failed to load content calendar schedule.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchCalendarData()
    return () => {
      cancelled = true
    }
  }, [])

  // Month navigation helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const handleToday = () => setCurrentDate(new Date())

  // Days grid calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun
    const totalDaysInMonth = lastDayOfMonth.getDate()

    const prevMonthLastDay = new Date(year, month, 0).getDate()

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = []

    // Previous month padding days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        dateStr: prevDate.toISOString().slice(0, 10),
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const currDate = new Date(year, month, day)
      // Local ISO string YYYY-MM-DD
      const yyyy = currDate.getFullYear()
      const mm = String(currDate.getMonth() + 1).padStart(2, '0')
      const dd = String(currDate.getDate()).padStart(2, '0')
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNum: day,
        isCurrentMonth: true,
      })
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day)
      const yyyy = nextDate.getFullYear()
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0')
      const dd = String(nextDate.getDate()).padStart(2, '0')
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNum: day,
        isCurrentMonth: false,
      })
    }

    return days
  }, [year, month])

  // Group items by date string
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const list = map.get(item.date) || []
      list.push(item)
      map.set(item.date, list)
    }
    return map
  }, [items])

  // Stats calculation
  const stats = useMemo(() => {
    const publishedCount = items.filter((i) => i.status === 'Published').length
    const draftCount = items.filter((i) => i.status === 'Draft').length
    const eventsCount = items.filter((i) => i.type === 'event').length
    return { publishedCount, draftCount, eventsCount }
  }, [items])

  const getItemBadgeStyle = (type: CalendarItem['type']) => {
    switch (type) {
      case 'newsletter':
        return { background: 'hsl(142, 71%, 45% / 0.15)', color: 'hsl(142, 71%, 38%)', border: '1px solid hsl(142, 71%, 45% / 0.3)' }
      case 'press':
        return { background: 'hsl(38, 92%, 50% / 0.15)', color: 'hsl(38, 92%, 40%)', border: '1px solid hsl(38, 92%, 50% / 0.3)' }
      case 'blog':
        return { background: 'hsl(217, 91%, 60% / 0.15)', color: 'hsl(217, 91%, 45%)', border: '1px solid hsl(217, 91%, 60% / 0.3)' }
      case 'event':
        return { background: 'hsl(271, 91%, 65% / 0.15)', color: 'hsl(271, 91%, 45%)', border: '1px solid hsl(271, 91%, 65% / 0.3)' }
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="main">
      <SEO
        title="Admin Editorial Content Calendar | The Base Movement"
        description="Visual Editorial Content Calendar Dashboard for scheduling blog posts, press releases, newsletters, and regional events."
      />

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '0 0 4px' }}>
            Editorial Content Calendar
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
            Visual schedule and publication timeline for blogs, press dispatches, newsletters, and mobilization events.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_view_month</span>
              Month
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>list</span>
              List
            </button>
          </div>

          <button
            onClick={() => setQuickComposeDate(todayStr)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            New Content
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="kpis grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 20 }}>
        <div className="panel" style={{ borderLeft: '3px solid hsl(var(--primary))', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Published Content
          </div>
          <div style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 700, color: 'hsl(var(--primary))', marginTop: 4 }}>
            {stats.publishedCount}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
            Blogs & press releases live
          </div>
        </div>

        <div className="panel" style={{ borderLeft: '3px solid hsl(var(--accent))', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Drafts & Pending
          </div>
          <div style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 700, color: 'hsl(var(--accent))', marginTop: 4 }}>
            {stats.draftCount}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
            Awaiting publication or review
          </div>
        </div>

        <div className="panel" style={{ borderLeft: '3px solid hsl(142 71% 45%)', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Mobilization Events
          </div>
          <div style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 700, color: 'hsl(142 71% 45%)', marginTop: 4 }}>
            {stats.eventsCount}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
            Town halls & regional walks
          </div>
        </div>

        <div className="panel" style={{ borderLeft: '3px solid hsl(var(--on-surface))', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '0.05em' }}>
            Total Pipeline Entries
          </div>
          <div style={{ fontSize: 'var(--kpi-num-size)', fontWeight: 700, color: 'hsl(var(--on-surface))', marginTop: 4 }}>
            {items.length}
          </div>
          <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>
            All scheduled dispatches
          </div>
        </div>
      </div>

      {/* Calendar Toolbar */}
      <div className="panel" style={{ marginBottom: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={handlePrevMonth} title="Previous Month">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleToday}>
            Today
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleNextMonth} title="Next Month">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>

          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '0 0 0 8px' }}>
            {monthLabel}
          </h2>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(217, 91%, 60%)' }} /> Blog
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(38, 92%, 50%)' }} /> Press
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(142, 71%, 45%)' }} /> Newsletter
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(271, 91%, 65%)' }} /> Event
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="panel" style={{ padding: 48, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 8 }}>progress_activity</span>
          <div>Loading content calendar schedule...</div>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Day of Week Headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--surface))' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  borderRight: '1px solid hsl(var(--border))',
                  minWidth: 0,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Month Grid Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'minmax(110px, auto)' }}>
            {calendarDays.map((day, idx) => {
              const dayItems = itemsByDate.get(day.dateStr) || []
              const isToday = day.dateStr === todayStr

              return (
                <div
                  key={idx}
                  onDoubleClick={() => setQuickComposeDate(day.dateStr)}
                  style={{
                    padding: 8,
                    borderRight: '1px solid hsl(var(--border))',
                    borderBottom: '1px solid hsl(var(--border))',
                    background: !day.isCurrentMonth
                      ? 'hsl(var(--background) / 0.5)'
                      : isToday
                        ? 'hsl(var(--primary) / 0.04)'
                        : 'hsl(var(--surface))',
                    opacity: !day.isCurrentMonth ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 110,
                    minWidth: 0,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  title="Double click cell to schedule new content"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 500,
                        color: isToday ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                        background: isToday ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {day.dayNum}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setQuickComposeDate(day.dateStr)
                      }}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '0 4px', height: 20, fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}
                      title="Add content on this date"
                    >
                      +
                    </button>
                  </div>

                  {/* Cell Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
                    {dayItems.slice(0, 3).map((item) => {
                      const badgeStyle = getItemBadgeStyle(item.type)
                      return (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedItem(item)
                          }}
                          style={{
                            ...badgeStyle,
                            padding: '3px 6px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: 11,
                            fontWeight: 500,
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.25,
                            maxHeight: '3.6em',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            cursor: 'pointer',
                            minWidth: 0,
                          }}
                        >
                          <span style={{ fontWeight: 700, marginRight: 4, textTransform: 'uppercase', fontSize: 9 }}>
                            {item.type[0]}
                          </span>
                          {item.title}
                        </div>
                      )
                    })}

                    {dayItems.length > 3 && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentDate(new Date(day.dateStr))
                          setViewMode('list')
                        }}
                        style={{ fontSize: 10, color: 'hsl(var(--primary))', fontWeight: 600, paddingLeft: 2 }}
                      >
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', fontWeight: 600, color: 'hsl(var(--on-surface))' }}>
            Scheduled & Published Content Entries ({items.length})
          </div>

          {items.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}>
              No content items found on schedule.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items
                .sort((a, b) => new Date(b.fullTimestamp).getTime() - new Date(a.fullTimestamp).getTime())
                .map((item) => {
                  const badgeStyle = getItemBadgeStyle(item.type)
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid hsl(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: 'hsl(var(--surface))',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className="pill"
                          style={{
                            ...badgeStyle,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.type}
                        </span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--on-surface))' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                            {item.date} · {item.author || 'Editorial'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          className={`pill ${
                            item.status === 'Published'
                              ? 'pill-ok'
                              : item.status === 'Scheduled'
                                ? 'pill-warn'
                                : 'pill-mute'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>
                          chevron_right
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </>
  )}

      {/* Flyout Summary Drawer */}
      {selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            style={{
              width: 420,
              maxWidth: '100%',
              height: '100%',
              background: 'hsl(var(--surface))',
              boxShadow: '-10px 0 25px rgba(0,0,0,0.2)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span className="pill" style={getItemBadgeStyle(selectedItem.type)}>
                {selectedItem.type.toUpperCase()}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedItem(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '0 0 12px', lineHeight: 1.3 }}>
              {selectedItem.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginBottom: 20 }}>
              <div><strong>Status:</strong> <span className="pill pill-ok">{selectedItem.status}</span></div>
              <div><strong>Target Date:</strong> {selectedItem.date}</div>
              <div><strong>Author / Source:</strong> {selectedItem.author}</div>
            </div>

            {selectedItem.snippet && (
              <div style={{ background: 'hsl(var(--background))', padding: 14, borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'hsl(var(--on-surface))', marginBottom: 24, flex: 1, overflowY: 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', marginBottom: 6 }}>
                  Content Excerpt
                </div>
                {selectedItem.snippet}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={() => {
                  navigate(selectedItem.editUrl)
                  setSelectedItem(null)
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                Edit in Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Compose Selection Popup */}
      {quickComposeDate && (
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
          onClick={() => setQuickComposeDate(null)}
        >
          <div
            className="panel"
            style={{
              maxWidth: 420,
              width: '100%',
              background: 'hsl(var(--surface))',
              padding: 24,
              borderRadius: 'var(--radius-md)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'hsl(var(--on-surface))', margin: '0 0 6px' }}>
              Schedule Content for {quickComposeDate}
            </h3>
            <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '0 0 20px' }}>
              Select the type of content entry you would like to schedule for this date:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className="btn btn-outline"
                style={{ justifyContent: 'flex-start', gap: 10, padding: '12px 16px' }}
                onClick={() => {
                  navigate(`/admin/blogs?scheduledDate=${quickComposeDate}`)
                  setQuickComposeDate(null)
                }}
              >
                <span className="material-symbols-outlined" style={{ color: 'hsl(217, 91%, 60%)' }}>description</span>
                New Blog Post
              </button>

              <button
                className="btn btn-outline"
                style={{ justifyContent: 'flex-start', gap: 10, padding: '12px 16px' }}
                onClick={() => {
                  navigate(`/admin/press-releases?scheduledDate=${quickComposeDate}`)
                  setQuickComposeDate(null)
                }}
              >
                <span className="material-symbols-outlined" style={{ color: 'hsl(38, 92%, 50%)' }}>campaign</span>
                New Press Release
              </button>

              <button
                className="btn btn-outline"
                style={{ justifyContent: 'flex-start', gap: 10, padding: '12px 16px' }}
                onClick={() => {
                  navigate(`/admin/newsletter?tab=compose&scheduledDate=${quickComposeDate}`)
                  setQuickComposeDate(null)
                }}
              >
                <span className="material-symbols-outlined" style={{ color: 'hsl(142, 71%, 45%)' }}>mail</span>
                New Newsletter Broadcast
              </button>

              <button
                className="btn btn-outline"
                style={{ justifyContent: 'flex-start', gap: 10, padding: '12px 16px' }}
                onClick={() => {
                  navigate(`/events?scheduledDate=${quickComposeDate}`)
                  setQuickComposeDate(null)
                }}
              >
                <span className="material-symbols-outlined" style={{ color: 'hsl(271, 91%, 65%)' }}>event</span>
                New Mobilization Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
