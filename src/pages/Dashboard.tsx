import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { StatCards } from './dashboard/components/StatCards'
import MembershipCard from '@/components/MembershipCard'
import { QuickActions } from './dashboard/components/QuickActions'
import { ActivityFeed } from './dashboard/components/ActivityFeed'
import { MovementJourney } from './dashboard/components/MovementJourney'
import { Button as NeonButton } from '@/components/ui/neon-button'

interface DashboardMember {
  full_name: string
  registration_number: string
  region: string
  constituency: string
  chapter: string
  joined_date: string
  status: string
  avatar_url?: string | null
  platform?: string
  gender?: string
}

export default function Dashboard() {
  const [member, setMember] = useState<DashboardMember | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const regNo = localStorage.getItem('userRegNo')
      let liveMember = null

      if (regNo) {
        liveMember = await adminService.getMemberProfile(regNo)
      }

      if (!liveMember) {
        const user = await adminService.initialize() // Ensure we have auth user
        if (user) {
          liveMember = await adminService.getMemberProfileByAuthId(user.id)
        }
      }

      if (liveMember) {
        // Save regNo for next time
        localStorage.setItem('userRegNo', liveMember.id)
        
        setMember({
          full_name: liveMember.name,
          registration_number: liveMember.id,
          region: liveMember.region,
          constituency: liveMember.constituency,
          chapter: liveMember.chapter || 'Central Chapter',
          joined_date: liveMember.joined || '30 Mar 2025',
          status: liveMember.status === 'Approved' ? 'Verified' : 'Pending',
          avatar_url: liveMember.avatarUrl,
          platform: liveMember.platform,
          gender: liveMember.gender
        })
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-on-surface/40 tracking-tight text-tiny animate-pulse">Synchronizing tactical data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-700">
      <div className="topbar">
        <div className="greet">
          <span className="font-meta font-bold uppercase tracking-[0.06em] text-on-surface-muted text-[10px]">Welcome back</span>
          <h2 className="font-meta font-extrabold text-[28px] text-on-surface m-0 leading-none mt-1">
            Akwaaba, {member?.full_name?.split(' ')[0] || 'Kwesi'} 👋
          </h2>
        </div>
        <div className="actions flex items-center gap-3">
          <div className="search relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-muted text-[18px]">search</span>
            <input 
              className="bg-white border border-border rounded-[4px] pl-10 pr-4 h-[40px] w-[320px] text-[13px] focus:outline-none focus:border-primary transition-all font-meta" 
              placeholder="Search the movement…" 
            />
          </div>
          <button className="icon-btn w-10 h-10 flex items-center justify-center bg-white border border-border rounded-[4px] text-on-surface relative hover:bg-surface transition-colors">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="dot absolute top-[8px] right-[8px] w-1.5 h-1.5 bg-destructive rounded-full" />
          </button>
          <NeonButton variant="accent" className="h-10 px-5 text-[11px] font-extrabold uppercase tracking-tight shadow-lg shadow-brand-gold/10">
            Donate ₵
          </NeonButton>
        </div>
      </div>

      {/* Stat Tiles */}
      <StatCards 
        memberStatus={member?.status || 'Verified'}
        memberSince="14 mo."
      />

      {/* Hero row: membership card + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-[20px] mb-[20px]">
        {member && (
          <MembershipCard 
            userName={member.full_name}
            userRegNo={member.registration_number}
            region={member.region}
            constituency={member.constituency}
            chapter={member.chapter}
            joinedDate={member.joined_date}
            status={member.status}
            avatarUrl={member.avatar_url}
            gender={member.gender}
            country="Ghana"
          />
        )}
        <QuickActions />
      </div>

      {/* Lower row: feed + journey */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-[20px]">
        <div className="bg-white border border-border rounded-[4px] p-6 feed">
          <h3 className="font-meta text-[14px] font-extrabold tracking-tight text-on-surface mb-[20px] flex items-center justify-between">
            Live contribution feed
            <span className="live flex items-center gap-1.5 text-[10px] font-extrabold text-destructive uppercase tracking-widest font-meta">
              <i className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
              Live
            </span>
          </h3>
          <ActivityFeed />
        </div>
        <MovementJourney />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .main { min-width: 0; padding-bottom: 40px; }
        .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .topbar h2 { font-size: 28px; font-weight: 800; font-family: 'Public Sans', sans-serif; letter-spacing: -0.01em; }
        .icon-btn .dot { animation: pulse 1.4s infinite; border: 2px solid #fff; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .feed h3 { font-family: 'Public Sans', sans-serif; }
      ` }} />
    </div>
  )
}
