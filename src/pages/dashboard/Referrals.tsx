// src/pages/dashboard/Referrals.tsx
import { useState, useEffect } from 'react'
import { referralService } from '@/services/referralService'
import { ShareModal } from '@/components/ShareModal'
import type { ReferredMember, ReferralStats, ReferralLeaderboardEntry } from '@/types/referrals'
import ReferralCard from './referrals/ReferralCard'
import SEO from '@/components/SEO'

function SkeletonCard() {
  return (
    <div
      className="panel"
      style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          background: 'hsl(var(--border))',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: '50%',
              height: 14,
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--border))',
            }}
          />
          <div
            style={{
              width: 60,
              height: 20,
              borderRadius: 'var(--radius-pill)',
              background: 'hsl(var(--border))',
            }}
          />
        </div>
        <div
          style={{
            width: '35%',
            height: 12,
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--border))',
          }}
        />
        <div
          style={{
            width: '25%',
            height: 11,
            borderRadius: 'var(--radius-sm)',
            background: 'hsl(var(--border))',
          }}
        />
      </div>
    </div>
  )
}

export default function Referrals() {
  const [referrals, setReferrals] = useState<ReferredMember[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    active: 0,
    pending: 0,
    pointsEarned: 0,
  })
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)

  const userRegNo = localStorage.getItem('userRegNo') ?? ''
  const shareUrl = userRegNo
    ? `https://thebasemovement.com/register?ref=${userRegNo}`
    : 'https://thebasemovement.com/register'

  useEffect(() => {
    let cancelled = false
    Promise.all([
      referralService.getMyReferrals(),
      referralService.getReferralLeaderboard(userRegNo),
      referralService.getPointsEarned(),
    ])
      .then(([refs, lb, pointsEarned]) => {
        if (cancelled) return
        setReferrals(refs)
        setStats({
          total: refs.length,
          active: refs.filter((r) => r.status === 'Active' || r.status === 'Approved').length,
          pending: refs.filter((r) => r.status === 'Pending').length,
          pointsEarned,
        })
        setLeaderboard(lb)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userRegNo])

  const kpis = [
    {
      label: 'Total Referred',
      value: loading ? '—' : String(stats.total),
      bar: 'hsl(var(--on-surface))',
    },
    {
      label: 'Active Members',
      value: loading ? '—' : String(stats.active),
      bar: 'hsl(var(--primary))',
    },
    {
      label: 'Pending',
      value: loading ? '—' : String(stats.pending),
      bar: 'hsl(var(--accent))',
    },
    {
      label: 'Points Earned',
      value: loading ? '—' : String(stats.pointsEarned),
      bar: 'hsl(var(--destructive))',
    },
  ]

  return (
    <div className="main">
      <SEO
        title="My Referrals"
        description="Track the patriots you've invited to The Base Movement."
      />

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
            margin: '0 0 4px',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          My Referrals
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 'var(--font-weight-normal, 400)',
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Patriots you brought into The Base Movement
        </p>
      </div>

      {/* KPI row */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <p
              style={{
                fontSize: 10,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 6px',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Referral list panel */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        {/* Panel header */}
        <div className="ph" style={{ padding: '14px 20px' }}>
          <p
            style={{
              margin: 0,
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 14,
              color: 'hsl(var(--on-surface))',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Your Referrals
          </p>
          <button className="btn btn-outline btn-sm" onClick={() => setShareOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              share
            </span>
            Share Link
          </button>
        </div>

        {/* List body */}
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : referrals.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 48,
                  color: 'hsl(var(--on-surface-muted))',
                  fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48",
                }}
              >
                group_add
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 'var(--font-weight-normal, 400)',
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                No referrals yet — share your link to invite patriots.
              </p>
              <button className="btn btn-outline btn-sm" onClick={() => setShareOpen(true)}>
                Share your link
              </button>
            </div>
          ) : (
            referrals.map((m) => <ReferralCard key={m.id} member={m} />)
          )}
        </div>
      </div>

      {/* Leaderboard panel */}
      {!loading && leaderboard.length > 0 && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ph" style={{ padding: '14px 20px' }}>
            <p
              style={{
                margin: 0,
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Top Referrers
            </p>
          </div>
          <div style={{ paddingBottom: 8 }}>
            {leaderboard.map((entry, i) => (
              <div
                key={entry.referrerId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  background: entry.isCurrentUser ? 'hsl(var(--primary) / 0.06)' : undefined,
                  borderBottom:
                    i < leaderboard.length - 1 ? '1px solid hsl(var(--border))' : undefined,
                }}
              >
                <span
                  style={{
                    width: 20,
                    fontSize: 12,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    textAlign: 'center',
                    flexShrink: 0,
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {i + 1}
                </span>
                {/* Avatar */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 'var(--radius-pill)',
                    background: 'hsl(var(--primary))',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        color: 'hsl(var(--background))',
                        fontSize: 10,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      {entry.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>
                {/* Name */}
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: entry.isCurrentUser
                      ? 'var(--font-weight-medium, 500)'
                      : 'var(--font-weight-normal, 400)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {entry.isCurrentUser ? 'You' : entry.name}
                </span>
                {/* Count */}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                  }}
                >
                  {entry.referralCount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Invite others to join The Base"
        url={shareUrl}
      />
    </div>
  )
}
