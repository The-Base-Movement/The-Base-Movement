import { useState, useEffect } from 'react'
import { sessionStore } from '@/lib/sessionStore'
import { DotLoader } from '@/components/states'
import { adminService } from '@/services/adminService'
import { useAuth } from '@/context/AuthContext'
import { RecentActivityPanel } from './dashboard/components/RecentActivityPanel'
import { StatCards } from './dashboard/components/StatCards'
import MembershipCard from '@/components/MembershipCard'
import { QuickActions } from './dashboard/components/QuickActions'
import { ActivityFeed } from './dashboard/components/ActivityFeed'
import { MovementJourney } from './dashboard/components/MovementJourney'
import { donationService } from '@/services/donationService'
import { gamificationService } from '@/services/gamificationService'
import { PushPromptBanner } from '@/components/PushPromptBanner'

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
  const { user } = useAuth()
  const [member, setMember] = useState<DashboardMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [contributionStats, setContributionStats] = useState({ total: 0, lastMonth: 0 })
  const [rankInfo, setRankInfo] = useState({ rank: 99, delta: 'Stable' })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const regNo = sessionStore.getItem('userRegNo')
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
        sessionStore.setItem('userRegNo', liveMember.id)

        setMember({
          full_name: liveMember.name,
          registration_number: liveMember.id,
          region: liveMember.region,
          constituency: liveMember.constituency,
          chapter: liveMember.chapter || 'Central Chapter',
          joined_date: liveMember.joined || '30 Mar 2025',
          status:
            liveMember.status === 'Active' || liveMember.status === 'Approved'
              ? 'Verified'
              : 'Pending',
          avatar_url: liveMember.avatarUrl,
          platform: liveMember.platform,
          gender: liveMember.gender,
        })

        // Fetch additional stats
        try {
          const [donations, rank] = await Promise.all([
            donationService.getMemberDonationStats(liveMember.phone),
            gamificationService.getMemberRank(liveMember.authId || liveMember.id),
          ])
          setContributionStats({ total: donations.total, lastMonth: donations.lastMonth })
          setRankInfo({ rank: rank.rank, delta: rank.delta })
        } catch (err) {
          console.warn('[DASHBOARD] Secondary stats sync failed:', err)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DotLoader label="Synchronizing tactical data..." />
      </div>
    )
  }

  return (
    <div className="main">
      <PushPromptBanner />
      {/* Welcome */}
      <div style={{ marginBottom: 'var(--stack-md, 24px)' }}>
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 500,
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Welcome back
        </span>
        <h2
          className="dash-welcome-name"
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 'var(--fs-xl, 28px)',
            color: 'hsl(var(--on-surface))',
            margin: '4px 0 0',
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}
        >
          Akwaaba, {member?.full_name?.split(' ')[0] || 'Kwesi'} 👋
        </h2>
      </div>

      {/* Stat Tiles */}
      <StatCards
        memberStatus={member?.status || 'Verified'}
        memberSince={member?.joined_date || '14 mo.'}
        contributionYTD={contributionStats}
        rank={rankInfo}
      />

      <div className="dash-content">
        {/* Hero row: membership card + quick actions */}
        <div className="dash-hero">
          <div className="dash-card-membership">
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
          </div>
          <div className="dash-card-actions">
            <QuickActions />
          </div>
        </div>

        {/* Lower row: feed + journey */}
        <div className="dash-lower">
          <div className="dash-card-feed panel feed" style={{ padding: 24 }}>
            <h3
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                fontWeight: 'var(--font-weight-medium, 500)',
                letterSpacing: '-.01em',
                color: 'hsl(var(--on-surface))',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              Live contribution feed
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--destructive))',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                <i
                  className="animate-pulse"
                  style={{
                    width: 6,
                    height: 6,
                    background: 'hsl(var(--destructive))',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
                Live
              </span>
            </h3>
            <ActivityFeed />
          </div>
          <div className="dash-card-journey">
            <MovementJourney />
          </div>
        </div>

        {user && (
          <div style={{ marginTop: 20 }}>
            <RecentActivityPanel userId={user.id} />
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .main { padding-bottom: 40px; }

        .feed h3 { font-family: 'Public Sans', sans-serif; }

        .dash-hero {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
          align-items: start;
        }
        .dash-lower {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .dash-welcome-name { font-size: 22px !important; }

          /* Collapse both grid rows into a single ordered column */
          .dash-content { display: flex; flex-direction: column; gap: 20px; }
          .dash-hero    { display: contents; }
          .dash-lower   { display: contents; }

          .dash-card-membership { order: 1; }
          .dash-card-journey    { order: 2; }
          .dash-card-feed       { order: 3; }
          .dash-card-actions    { order: 4; }
        }
      `,
        }}
      />
    </div>
  )
}
