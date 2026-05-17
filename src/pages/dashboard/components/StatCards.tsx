function Tile({ color, label, value, delta, icon }: {
  color: 'red' | 'gold' | 'ink' | 'green' | 'black'
  label: string
  value: string | number
  delta: string
  icon?: string
}) {
  return (
    <div className={`tile ${color}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="label">{label}</div>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'hsl(var(--on-surface-muted))' }}>
          {icon || 'analytics'}
        </span>
      </div>
      <div className="val display">{value}</div>
      <div className="delta">
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
        icon="verified"
      />
      <Tile
        color="gold"
        label="Contribution YTD"
        value={`₵${contributionYTD.total.toLocaleString()}`}
        delta={`+₵${contributionYTD.lastMonth} this month`}
        icon="account_balance_wallet"
      />
      <Tile
        color="ink"
        label="Member Since"
        value={memberSince || '14 mo.'}
        delta={`Active Patriot`}
        icon="calendar_today"
      />
      <Tile
        color="green"
        label="Chapter Rank"
        value={`#${rank.rank.toString().padStart(2, '0')}`}
        delta={rank.delta}
        icon="military_tech"
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .stats4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        @media (max-width: 1024px) { .stats4 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .stats4 { grid-template-columns: 1fr; } }
        
        .tile { 
          background: #fff; 
          border: 1px solid hsl(var(--border)); 
          border-radius: 4px; 
          padding: 16px 18px 16px 22px; 
          position: relative; 
          overflow: hidden; 
          box-shadow: 0 4px 20px -2px rgba(0,0,0,.04);
        }
        .tile::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--ac); }
        
        .tile.red { --ac: hsl(var(--destructive)); }
        .tile.gold { --ac: hsl(var(--accent)); }
        .tile.green { --ac: hsl(var(--primary)); }
        .tile.ink { --ac: hsl(var(--on-surface)); }
        .tile.black { --ac: hsl(var(--on-surface)); }
        
        .tile .label { 
          font-size: 11px; 
          font-weight: 800; 
          color: hsl(var(--on-surface-muted)); 
          letter-spacing: .05em; 
          text-transform: uppercase; 
          font-family: 'Public Sans', sans-serif; 
          margin: 0;
        }
        
        .tile .val { 
          font-family: 'Public Sans', sans-serif; 
          font-size: 22px; 
          font-weight: 800; 
          letter-spacing: -.02em; 
          line-height: 1; 
          margin: 0 0 6px; 
          color: hsl(var(--on-surface)); 
        }
        
        .tile .delta { 
          font-size: 11px; 
          font-weight: 700; 
          color: hsl(var(--on-surface-muted)); 
          font-family: 'Public Sans', sans-serif; 
        }
      ` }} />
    </div>
  )
}
