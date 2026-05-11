import { Link } from 'react-router-dom'

const actions = [
  { to: '/dashboard/polls', icon: 'how_to_vote', label: 'Vote on poll', sub: 'Share your opinion' },
  { to: '/dashboard/store', icon: 'shopping_bag', label: 'Member store', sub: 'Browse supplies' },
  { to: '/dashboard/feedback', icon: 'record_voice_over', label: 'Submit feedback', sub: 'Your voice matters' },
  { to: '/dashboard/canvass', icon: 'share', label: 'Refer a patriot', sub: 'Earn impact points' },
]

export function QuickActions() {
  return (
    <div className="mt-4">
      <h3 className="font-meta text-[14px] font-extrabold tracking-tight text-on-surface mb-[14px]">Quick actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
        {actions.map(a => (
          <Link
            key={a.to}
            to={a.to}
            className="flex gap-[10px] p-3 border border-border rounded-[4px] bg-white items-start transition-all hover:border-primary hover:-translate-y-px hover:shadow-[0_8px_20px_-8px_rgba(0,107,63,0.2)] group"
          >
            <div className="w-8 h-8 rounded-[4px] bg-[hsl(var(--secondary))] flex items-center justify-center text-primary shrink-0 group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{a.icon}</span>
            </div>
            <div className="min-w-0">
              <b className="block font-meta text-[12px] font-extrabold tracking-[-0.005em] text-on-surface">{a.label}</b>
              <span className="text-[11px] text-on-surface-muted">{a.sub}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
