import type { Chapter } from '@/types/admin'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

interface HubHeaderProps {
  chapter: Chapter
  activeCount: number
  pendingCount: number
  totalMembers: number
  totalDonated: number
  activeTab: 'members' | 'donations' | 'helpdesk'
  setActiveTab: (tab: 'members' | 'donations' | 'helpdesk') => void
  donationsCount: number
}

export function HubHeader({
  chapter,
  activeCount,
  pendingCount,
  totalMembers,
  totalDonated,
  activeTab,
  setActiveTab,
  donationsCount,
}: HubHeaderProps) {
  return (
    <>
      <AdminPageHeader
        title={chapter.name}
        icon="account_balance"
        description={`${chapter.leader_name || 'No leader assigned'} — ${chapter.city_or_region}, ${chapter.country}`}
      />

      <div className="kpis">
        {[
          { label: 'Total members', value: totalMembers, bar: 'hsl(var(--on-surface))' },
          { label: 'Active members', value: activeCount, bar: 'hsl(var(--primary))' },
          { label: 'Pending members', value: pendingCount, bar: 'hsl(var(--accent))' },
          {
            label: 'Total donated',
            value: `GH₵ ${totalDonated.toLocaleString()}`,
            bar: 'hsl(var(--primary))',
          },
        ].map((k) => (
          <div
            key={k.label}
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
                background: k.bar,
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
              }}
            >
              {k.label}
            </p>
            <p
              style={{
                fontSize: 'var(--kpi-num-size)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                letterSpacing: '-0.02em',
              }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid hsl(var(--border))',
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        {(
          [
            { key: 'members', label: `Members (${totalMembers})` },
            { key: 'donations', label: `Donations (${donationsCount})` },
            { key: 'helpdesk', label: 'Support Tickets' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: activeTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
              borderBottom:
                activeTab === tab.key ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  )
}
