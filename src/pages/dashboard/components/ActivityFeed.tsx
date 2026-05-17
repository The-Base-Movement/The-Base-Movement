import { useState, useEffect } from 'react'
import { donationService } from '@/services/donationService'
import { memberService } from '@/services/memberService'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  name: string
  action: string
  target: string
  time: string
  timestamp: Date
  loc: string
  amt?: string
  img?: string
  status?: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    async function initFeed() {
      const [donations, members] = await Promise.all([
        donationService.getPublicDonationFeed(10),
        memberService.getMembers().then(ms => ms.slice(0, 10))
      ])

      const initial: Activity[] = [
        ...donations.map(d => ({
          name: d.fullName,
          action: 'just contributed to the',
          target: d.campaignTitle || 'General Fund',
          time: formatDistanceToNow(new Date(d.date), { addSuffix: true }),
          timestamp: new Date(d.date),
          loc: d.country || 'Ghana',
          amt: `₵${d.amount}`,
          img: `https://i.pravatar.cc/80?u=${d.fullName}`
        })),
        ...members.map(m => ({
          name: m.name,
          action: 'registered as a member of',
          target: m.chapter || 'The Base',
          time: m.joined || 'Recently',
          timestamp: m.joined ? new Date(m.joined) : new Date(),
          loc: m.region || m.country || 'Ghana',
          status: 'Verified',
          img: m.avatarUrl || `https://i.pravatar.cc/80?u=${m.name}`
        }))
      ]

      setActivities(initial.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8))
    }

    initFeed()

    const donationSub = donationService.subscribeToPublicDonations((d) => {
      const newActivity: Activity = {
        name: d.fullName,
        action: 'just contributed to the',
        target: d.campaignTitle || 'General Fund',
        time: 'Just now',
        timestamp: new Date(),
        loc: d.country || 'Global',
        amt: `₵${d.amount}`,
        img: `https://i.pravatar.cc/80?u=${d.fullName}`
      }
      setActivities(prev => [newActivity, ...prev].slice(0, 8))
    })

    // Subscribe to members
    const memberSub = memberService.subscribeToNewMembers((m) => {
      const newActivity: Activity = {
        name: m.name,
        action: 'registered as a member of',
        target: m.chapter || 'The Base',
        time: 'Just now',
        timestamp: new Date(),
        loc: m.region || m.country || 'Movement HQ',
        status: 'Verified',
        img: m.avatarUrl || `https://i.pravatar.cc/80?u=${m.name}`
      }
      setActivities(prev => [newActivity, ...prev].slice(0, 8))
    })

    return () => {
      donationSub.unsubscribe()
      memberSub.unsubscribe()
    }
  }, [])

  return (
    <div className="flex flex-col">
      <div className="activities-container">
        {activities.length === 0 ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[12px] font-bold text-on-surface/40 uppercase tracking-[.06em] font-meta">Synchronizing Feed...</p>
          </div>
        ) : (
          activities.map((act, i) => (
            <div key={`${act.timestamp.getTime()}-${i}`} className="feed-row animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="av">
                <img src={act.img} alt={act.name} />
              </div>
              <div className="body">
                <p>
                  <b className="font-meta font-extrabold">{act.name}</b> {act.action} <b className="font-meta font-extrabold">{act.target}</b>.
                </p>
                <div className="meta">
                  {act.time} · {act.loc}
                </div>
              </div>
              {act.amt && <div className="amt tnum">{act.amt}</div>}
              {act.status && (
                <span className="material-symbols-outlined" style={{ fontSize: 17, color: 'hsl(var(--primary))', flexShrink: 0, alignSelf: 'center' }}>verified</span>
              )}
            </div>
          ))
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .feed-row { display: flex; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .feed-row:last-child { border-bottom: 0; }
        .feed-row .av { width: 32px; height: 32px; border-radius: 50%; background: var(--container); flex-shrink: 0; overflow: hidden; }
        .feed-row .av img { width: 100%; height: 100%; object-fit: cover; }
        .feed-row .body { flex: 1; min-width: 0; }
        .feed-row .body p { margin: 0; font-size: 12px; color: var(--on-surface); line-height: 1.4; }
        .feed-row .body p b { font-family: 'Public Sans', sans-serif; font-weight: 800; }
        .feed-row .body .meta { font-size: 10.5px; color: var(--on-surface-muted); margin-top: 3px; font-family: 'Public Sans', sans-serif; font-weight: 700; letter-spacing: .02em; }
        .feed-row .amt { font-family: 'Public Sans', sans-serif; font-weight: 800; color: var(--primary); font-size: 14px; }
        
        .pill { padding: 4px 10px; font-size: 9px; border-radius: 4px; }
        .pill-ok { background: rgba(0, 107, 63, 0.1); color: var(--primary); border: 1px solid rgba(0, 107, 63, 0.1); }
        .pill-mute { background: rgba(0, 0, 0, 0.05); color: var(--on-surface-muted); border: 1px solid rgba(0, 0, 0, 0.05); }
      ` }} />
    </div>
  )
}
