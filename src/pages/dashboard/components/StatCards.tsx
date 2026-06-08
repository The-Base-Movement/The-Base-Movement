import { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'

function valSize(value: string | number): number {
  const len = String(value).length
  if (len <= 5) return 22
  if (len <= 9) return 18
  if (len <= 13) return 15
  return 13
}

function statusColor(status: string): string {
  if (status === 'Verified') return 'hsl(var(--primary))'
  if (status === 'Pending') return 'hsl(40, 90%, 45%)'
  return 'hsl(var(--destructive))'
}

function Tile({
  color,
  label,
  value,
  delta,
  icon,
  isStatus,
}: {
  color: 'red' | 'gold' | 'ink' | 'green' | 'black'
  label: string
  value: string | number
  delta: string
  icon?: string
  isStatus?: boolean
}) {
  return (
    <div className={`tile ${color}`}>
      <div className="tile-header">
        <div className="label">{label}</div>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '16px',
            color:
              isStatus && value === 'Verified'
                ? 'hsl(var(--primary))'
                : 'hsl(var(--on-surface-muted))',
          }}
        >
          {icon || 'analytics'}
        </span>
      </div>
      <div
        className="val display"
        style={{
          fontSize: valSize(value),
          color: isStatus ? statusColor(String(value)) : 'hsl(var(--on-surface))',
        }}
      >
        {value}
      </div>
      <div className="delta">
        {isStatus && (
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '13px',
              color: value === 'Verified' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
            }}
          >
            verified
          </span>
        )}
        <span>{delta}</span>
      </div>
    </div>
  )
}

const tileStyles = `
  .tile {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border));
    border-radius: 4px;
    padding: 12px 16px 14px 20px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px -2px rgba(0,0,0,.04);
  }
  .tile::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--ac); }

  .tile.red   { --ac: hsl(var(--destructive)); }
  .tile.gold  { --ac: hsl(var(--accent)); }
  .tile.green { --ac: hsl(var(--primary)); }
  .tile.ink   { --ac: hsl(var(--on-surface)); }
  .tile.black { --ac: hsl(var(--on-surface)); }

  .tile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }

  .tile .label {
    font-size: 10px;
    font-weight: var(--font-weight-semibold, 600);
    color: hsl(var(--on-surface-muted));
    letter-spacing: .06em;
    text-transform: uppercase;
    font-family: 'Public Sans', sans-serif;
    margin: 0;
    white-space: nowrap;
  }

  .tile .val {
    font-family: 'Public Sans', sans-serif;
    font-weight: var(--font-weight-semibold, 600);
    letter-spacing: -.02em;
    line-height: 1;
    margin: 0 0 6px;
  }


  .tile .delta {
    font-size: 10.5px;
    font-weight: var(--font-weight-medium, 500);
    color: hsl(var(--on-surface-muted));
    font-family: 'Public Sans', sans-serif;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`

export function StatCards({
  memberStatus,
  memberSince,
  contributionYTD,
  rank,
  platform,
}: {
  memberStatus: string
  memberSince: string
  contributionYTD: { total: number; lastMonth: number }
  rank: { rank: number; delta: string }
  platform?: string
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const rankLabel = platform === 'DIASPORA' ? 'Chapter Rank' : 'Constituency Rank'

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const tiles = [
    <Tile
      key="status"
      color="red"
      label="Reg. Status"
      value={memberStatus || 'Verified'}
      delta="ID confirmed"
      icon="verified"
      isStatus
    />,
    <Tile
      key="contrib"
      color="gold"
      label="Contribution YTD"
      value={`₵${contributionYTD.total.toLocaleString()}`}
      delta={`+₵${contributionYTD.lastMonth.toLocaleString()} this month`}
      icon="account_balance_wallet"
    />,
    <Tile
      key="since"
      color="ink"
      label="Member Since"
      value={memberSince || '—'}
      delta="Active Patriot"
      icon="calendar_today"
    />,
    <Tile
      key="rank"
      color="green"
      label={rankLabel}
      value={rank.rank > 0 ? `#${rank.rank.toString().padStart(2, '0')}` : '—'}
      delta={rank.delta}
      icon="military_tech"
    />,
  ]

  if (isMobile) {
    return (
      <div style={{ marginBottom: 24, marginLeft: -4, marginRight: -4 }}>
        <Swiper slidesPerView={1.4} spaceBetween={12} style={{ padding: '0 4px' }}>
          {tiles.map((tile, i) => (
            <SwiperSlide key={i}>{tile}</SwiperSlide>
          ))}
        </Swiper>
        <style dangerouslySetInnerHTML={{ __html: tileStyles }} />
      </div>
    )
  }

  return (
    <div className="stats4 animate-in fade-in slide-in-from-top-4 duration-500">
      {tiles}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .stats4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        @media (max-width: 1024px) { .stats4 { grid-template-columns: repeat(2, 1fr); } }
        ${tileStyles}
      `,
        }}
      />
    </div>
  )
}
