import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { ShareModal } from '@/components/ShareModal'
import type { Chapter, ChapterLeader, ChapterActivity } from '@/types/admin'
import { useChapters } from '@/context/ChaptersContext'
import { LoadingScreen } from '../components/LoadingScreen'
import { adminService } from '@/services/adminService'
import { authService } from '@/services/authService'

export default function ChapterDetails() {
  const { slug } = useParams<{ slug: string }>()
  const { chapters, isLoading } = useChapters()
  const chapter: Chapter | undefined = chapters.find(
    c => c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') === slug
  )
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const user = authService.getUser()

  const handleJoin = async () => {
    if (!user || !chapter) {
      toast.error(!user ? 'Please register or login to join.' : 'Chapter hub not found.')
      return
    }
    if (user.user_metadata?.chapter === chapter.name) {
      toast(`Already a member of ${chapter.name}`)
      return
    }
    setIsJoining(true)
    try {
      const success = await adminService.joinChapter(chapter.name)
      if (success) {
        toast.success(`You have successfully joined the ${chapter.name} chapter hub.`)
      } else {
        throw new Error('Join failed')
      }
    } catch {
      toast.error('Failed to process your chapter join request.')
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) return <LoadingScreen />

  if (!chapter) {
    return (
      <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 22, color: 'hsl(var(--on-surface))', marginBottom: 16 }}>Chapter not found</h2>
          <Link to="/dashboard/chapters" className="btn btn-primary">Back to chapters</Link>
        </div>
      </div>
    )
  }

  const isActive = chapter.status === 'Active' || chapter.status === 'Member'

  return (
    <div className="main">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span className={`pill ${isActive ? 'pill-ok' : 'pill-warn'}`}>{chapter.status}</span>
          <span style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 11, fontWeight: 700, fontFamily: "'Public Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified chapter</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 28, color: 'hsl(var(--on-surface))', letterSpacing: '-0.02em', marginBottom: 8 }}>
              {chapter.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: 'hsl(var(--on-surface-muted))', fontSize: 13, fontWeight: 600, fontFamily: "'Public Sans', sans-serif" }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>location_on</span>
                {chapter.city_or_region}, {chapter.country}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>group</span>
                {chapter.member_count} Active members
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setIsShareModalOpen(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>share</span>
              Share
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleJoin}
              disabled={isJoining || user?.user_metadata?.chapter === chapter.name}
            >
              {isJoining ? 'Processing…' : user?.user_metadata?.chapter === chapter.name ? 'Already a Member' : 'Join this chapter'}
            </button>
          </div>
        </div>
      </div>

      {/* Content layout */}
      <div className="main-sidebar">
        {/* Main */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* About */}
          <div className="panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>language</span>
              <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>About this chapter</span>
            </div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.65, fontStyle: 'italic', borderLeft: '3px solid hsl(var(--accent))', paddingLeft: 14, marginBottom: 14 }}>
              {chapter.description}
            </p>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.65 }}>
              Whether you're looking to volunteer, stay informed about local policy discussions, or connect with fellow movement members, the {chapter.name} provides the platform for meaningful civic engagement and collective action within {chapter.city_or_region}.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              <div style={{ padding: '14px 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Local focus</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{chapter.local_focus || 'Grassroots mobilization'}</div>
              </div>
              <div style={{ padding: '14px 16px', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', borderRadius: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Meeting schedule</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{chapter.meeting_schedule || 'Contact chapter for schedule'}</div>
              </div>
            </div>
          </div>

          {/* Recent activities */}
          <div className="panel">
            <div className="ph" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>calendar_month</span>
                <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent activities</span>
              </div>
              <button style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--primary))', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Public Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em' }}>View all</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chapter.activities && chapter.activities.length > 0 ? (
                chapter.activities.map((activity: ChapterActivity, i: number) => {
                  const date = new Date(activity.activityDate)
                  const month = date.toLocaleString('en-US', { month: 'short' })
                  const day = date.getDate()
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid hsl(var(--border))', borderRadius: 4, background: 'hsl(var(--container-low))' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 44, height: 44, background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{month}</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif", lineHeight: 1 }}>{day}</span>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{activity.title}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{activity.type}</div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>chevron_right</span>
                    </div>
                  )
                })
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No recent activities recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Leadership */}
          <div className="panel">
            <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid hsl(var(--border))' }}>Chapter leadership</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {chapter.leadership && chapter.leadership.length > 0 ? (
                chapter.leadership.map((leader: ChapterLeader, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden', background: 'hsl(var(--container-low))', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {leader.imageUrl ? (
                        <img src={leader.imageUrl} alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--on-surface-muted))' }}>person</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--on-surface))', fontFamily: "'Public Sans', sans-serif" }}>{leader.name}</div>
                      <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>{leader.role}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center', border: '1px dashed hsl(var(--border))', borderRadius: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leadership pending</p>
                </div>
              )}
            </div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>mail</span>
                {chapter.email || `${chapter.city_or_region.toLowerCase()}@thebasemovement.com`}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'hsl(var(--on-surface-muted))', fontFamily: "'Public Sans', sans-serif" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>phone</span>
                {chapter.phone_number || '+233 (0) 50 123 4567'}
              </div>
            </div>
          </div>

          {/* Official verification */}
          <div style={{ background: 'hsl(var(--on-surface))', padding: 22, borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 8, right: 8, opacity: 0.08 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 80, color: '#fff' }}>verified_user</span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'hsl(var(--accent))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontFamily: "'Public Sans', sans-serif" }}>Official verification</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 16, fontFamily: "'Public Sans', sans-serif" }}>
                This chapter is officially recognized and verified by The Base National Headquarters. All activities are coordinated with the central movement agenda.
              </p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(0,107,63,0.25)', color: 'hsl(var(--primary))', fontSize: 11, fontWeight: 700, borderRadius: 4, border: '1px solid rgba(0,107,63,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified_user</span>
                Verified
              </span>
            </div>
          </div>

          {/* Donate to chapter */}
          <div className="panel">
            <h3 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', marginBottom: 8 }}>Support local</h3>
            <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, marginBottom: 16, fontFamily: "'Public Sans', sans-serif" }}>
              Your donations to this specific chapter help fund local townhalls and community outreach programs in {chapter.city_or_region}.
            </p>
            <Link to="/dashboard/donate" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Donate to chapter
            </Link>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Join ${chapter.name}`}
        url={window.location.href}
      />
    </div>
  )
}
