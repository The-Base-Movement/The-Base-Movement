import type { Member } from '@/types/admin'

interface MembersKPIsProps {
  chapterMembers: Member[]
  verifiedCount: number
  myChapter: string
}

export function MembersKPIs({ chapterMembers, verifiedCount, myChapter }: MembersKPIsProps) {
  const kpis: {
    label: string
    value: number
    sub: string
    bar: string
    val: string
    icon: string
  }[] = [
    {
      label: 'Chapter members',
      value: chapterMembers.length,
      sub: myChapter,
      bar: 'hsl(var(--on-surface))',
      val: 'hsl(var(--on-surface))',
      icon: 'groups',
    },
    {
      label: 'Verified',
      value: verifiedCount,
      sub: 'ID confirmed',
      bar: 'hsl(var(--primary))',
      val: 'hsl(var(--on-surface))',
      icon: 'verified',
    },
    {
      label: 'Ghana network',
      value: chapterMembers.filter((m) => m.platform === 'GHANA').length,
      sub: 'Registered in Ghana',
      bar: 'hsl(var(--accent))',
      val: 'hsl(var(--on-surface))',
      icon: 'flag',
    },
    {
      label: 'Diaspora network',
      value: chapterMembers.filter((m) => m.platform === 'DIASPORA').length,
      sub: 'International members',
      bar: 'hsl(var(--destructive))',
      val: 'hsl(var(--on-surface))',
      icon: 'public',
    },
  ]

  return (
    <div className="kpis">
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
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 500,
              fontSize: 10,
              color: 'hsl(var(--on-surface-muted))',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            {kpi.label}
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 30,
              color: kpi.val,
              lineHeight: 1,
              marginBottom: 6,
            }}
          >
            {kpi.value}
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 500,
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              className="material-symbols-outlined desktop-only"
              style={{ fontSize: 12, color: kpi.bar }}
            >
              {kpi.icon}
            </span>
            {kpi.sub}
          </div>
        </div>
      ))}
    </div>
  )
}
