function Tile({ color, label, value, delta, icon }: {
  color: 'red' | 'gold' | 'ink' | 'green' | 'black'
  label: string
  value: string | number
  delta: string
  icon?: string
}) {
  return (
    <div className={`tile ${color}`}>
      <div className="label">{label}</div>
      <div className="val display">{value}</div>
      <div className="delta">
        {icon && <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{icon}</span>}
        {delta}
      </div>
    </div>
  )
}

export function StatCards({ 
  memberStatus, 
  memberSince,
  contributionYTD,
  rank
}: { 
  memberStatus: string
  memberSince: string
  contributionYTD: { total: number; lastMonth: number }
  rank: { rank: number; delta: string }
}) {
  return (
    <div className="stats4 animate-in fade-in slide-in-from-top-4 duration-500">
      <Tile
        color="red"
        label="Reg. Status"
        value={memberStatus || 'Verified'}
        delta="ID confirmed"
        icon="check_circle"
      />
      <Tile
        color="gold"
        label="Contribution YTD"
        value={`₵${contributionYTD.total}`}
        delta={`+₵${contributionYTD.lastMonth} this month`}
        icon="north"
      />
      <Tile
        color="ink"
        label="Member Since"
        value={memberSince || '14 mo.'}
        delta={`Joined ${memberSince}`}
      />
      <Tile
        color="black"
        label="Chapter Rank"
        value={`#${rank.rank.toString().padStart(2, '0')}`}
        delta={rank.delta}
        icon={rank.delta.includes('Up') ? 'north' : undefined}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .stats4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; }
        @media (max-width: 1024px) { .stats4 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .stats4 { grid-template-columns: 1fr; } }
        
        .tile { background: #fff; border: 1px solid hsl(var(--border)); border-radius: 4px; padding: 18px; position: relative; overflow: hidden; }
        .tile::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--ac); }
        .tile.red { --ac: hsl(var(--destructive)); }
        .tile.gold { --ac: hsl(var(--accent)); }
        .tile.green { --ac: hsl(var(--primary)); }
        .tile.ink { --ac: #64748b; }
        .tile.black { --ac: #0f172a; }
        
        .tile .label { font-size: 10px; font-weight: 800; color: var(--on-surface-muted); letter-spacing: .06em; text-transform: uppercase; font-family: 'Public Sans', sans-serif; }
        .tile .val { font-family: 'Public Sans', sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -.02em; line-height: 1; margin: 8px 0 6px; color: var(--on-surface); }
        .tile .delta { font-size: 11px; font-weight: 700; color: var(--on-surface-muted); font-family: 'Public Sans', sans-serif; display: flex; align-items: center; gap: 4px; }
        .tile.gold .delta, .tile.black .delta { color: hsl(var(--primary)); }
        .tile.red .delta { color: hsl(var(--primary)); }
      ` }} />
    </div>
  )
}
