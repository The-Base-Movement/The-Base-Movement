import { Link } from 'react-router-dom'

const actions = [
  { to: '/dashboard/polls', icon: 'how_to_vote', label: 'Vote on poll', sub: 'Closes in 4 days' },
  { to: '/dashboard/donate', icon: 'volunteer_activism', label: 'Make a donation', sub: 'Support the cause' },
  { to: '/dashboard/chapters', icon: 'groups', label: 'Find a branch', sub: 'Near Ablekuma North' },
  { to: '/dashboard/members', icon: 'share', label: 'Refer a member', sub: 'Earn impact points' },
]

export function QuickActions() {
  return (
    <div className="bg-white border border-border rounded-[4px] p-6 quick h-full">
      <h3 className="font-meta text-[14px] font-extrabold tracking-tight text-on-surface mb-[14px]">Quick actions</h3>
      <div className="row">
        {actions.map(a => (
          <Link
            key={a.to}
            to={a.to}
            className="qa animate-in fade-in slide-in-from-right-4 duration-500"
          >
            <div className="ic">
              <span className="material-symbols-outlined">{a.icon}</span>
            </div>
            <div>
              <b className="font-meta">{a.label}</b>
              <span>{a.sub}</span>
            </div>
          </Link>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .quick h3 { font-size: 14px; font-weight: 800; margin-bottom: 14px; font-family: 'Public Sans', sans-serif; }
        .quick .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .qa { display: flex; gap: 10px; padding: 12px; border: 1px solid hsl(var(--border)); border-radius: 4px; background: #fff; align-items: flex-start; transition: all .15s; cursor: pointer; text-decoration: none; }
        .qa:hover { border-color: hsl(var(--primary)); transform: translateY(-1px); box-shadow: 0 8px 20px -8px rgba(0, 107, 63, 0.2); }
        .qa .ic { width: 32px; height: 32px; border-radius: 4px; background: var(--container-low); display: flex; align-items: center; justify-content: center; color: hsl(var(--primary)); flex-shrink: 0; }
        .qa .ic .material-symbols-outlined { font-size: 18px; }
        .qa b { display: block; font-family: 'Public Sans', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: -0.005em; color: var(--on-surface); line-height: 1.2; margin-bottom: 2px; }
        .qa span { font-size: 11px; color: var(--on-surface-muted); line-height: 1.2; display: block; }
      ` }} />
    </div>
  )
}
