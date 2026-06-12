import Avatar from '@/pages/admin/financeReviewInbox/Avatar'
import type { FinanceRequest } from '@/services/financeService'
import type { TierLeader } from '@/pages/admin/financeReviewInbox/types'

interface ApprovalChainTrackerProps {
  request: FinanceRequest
  tier1Max: number
  tier2Max: number
  tierLeaders: TierLeader[]
}

export default function ApprovalChainTracker({
  request,
  tier1Max,
  tier2Max,
  tierLeaders,
}: ApprovalChainTrackerProps) {
  const activeTier = request.status === 'Pending' ? request.approval_tier : null
  const resolvedAtTier = request.status !== 'Pending' ? request.approval_tier : null

  const tierDefs = [
    {
      n: 1,
      role: 'Finance Officer',
      icon: 'account_balance_wallet',
      range: `GHS 0 – ${tier1Max.toLocaleString()}`,
    },
    {
      n: 2,
      role: 'Executives',
      icon: 'corporate_fare',
      range: `GHS ${(tier1Max + 1).toLocaleString()} – ${tier2Max.toLocaleString()}`,
    },
    {
      n: 3,
      role: 'Founder / Appointed',
      icon: 'shield',
      range: `GHS ${(tier2Max + 1).toLocaleString()}+`,
    },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        marginTop: 16,
        padding: '14px 16px',
        background: 'hsl(var(--container-low))',
        borderRadius: 'var(--radius-md)',
        border: '1px solid hsl(var(--border))',
      }}
    >
      {tierDefs.map((tier, i) => {
        const isActive = activeTier === tier.n
        const isResolved = resolvedAtTier === tier.n
        const isPast =
          (activeTier != null && tier.n < activeTier) ||
          (resolvedAtTier != null && tier.n < resolvedAtTier)
        const isFuture = activeTier != null && tier.n > activeTier

        let nodeColor = 'hsl(var(--border))'
        let textColor = 'hsl(var(--on-surface-muted))'
        let iconName = tier.icon

        if (isActive) {
          nodeColor = 'hsl(var(--primary))'
          textColor = 'hsl(var(--on-surface))'
        } else if (isPast) {
          nodeColor = 'hsl(var(--primary))'
          iconName = 'check_circle'
          textColor = 'hsl(var(--on-surface-muted))'
        } else if (isResolved) {
          nodeColor =
            request.status === 'Approved' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'
          iconName = request.status === 'Approved' ? 'check_circle' : 'cancel'
          textColor = 'hsl(var(--on-surface))'
        }

        return (
          <div key={tier.n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background:
                    isActive || isResolved || isPast ? nodeColor : 'hsl(var(--container-low))',
                  border: `2px solid ${nodeColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 0 0 4px ${nodeColor}22` : 'none',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 16,
                    color: isActive || isResolved || isPast ? '#fff' : nodeColor,
                  }}
                >
                  {iconName}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: isActive
                    ? 'var(--font-weight-medium, 500)'
                    : 'var(--font-weight-normal, 400)',
                  fontSize: 10,
                  color: textColor,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}
              >
                {tier.role}
              </p>
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 9,
                  color: 'hsl(var(--on-surface-muted))',
                  textAlign: 'center',
                  opacity: isFuture ? 0.5 : 1,
                }}
              >
                {tier.range}
              </p>
              {isActive && (
                <span
                  style={{
                    marginTop: 4,
                    fontSize: 8,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'hsl(var(--primary))',
                    background: 'hsl(var(--primary) / 0.1)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  Awaiting
                </span>
              )}
              {(() => {
                const leaders = tierLeaders.filter((l) => l.tier === tier.n).slice(0, 3)
                if (!leaders.length) return null
                return (
                  <div
                    style={{
                      display: 'flex',
                      marginTop: 6,
                      justifyContent: 'center',
                    }}
                  >
                    {leaders.map((leader, idx) => (
                      <div
                        key={leader.id}
                        style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: leaders.length - idx }}
                      >
                        <Avatar url={leader.avatarUrl} name={leader.name} size={22} />
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {i < tierDefs.length - 1 && (
              <div
                style={{
                  height: 2,
                  width: 32,
                  flexShrink: 0,
                  background: isPast || isResolved ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  marginBottom: 28,
                  transition: 'background 0.2s',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
