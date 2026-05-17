import { Link } from 'react-router-dom'
import { toast } from 'sonner'

const linkActions = [
  { to: '/dashboard/polls', icon: 'how_to_vote', label: 'Vote on poll', sub: 'Closes in 4 days' },
  { to: '/dashboard/donate', icon: 'volunteer_activism', label: 'Make a donation', sub: 'Support the cause' },
  { to: '/dashboard/chapters', icon: 'groups', label: 'Find a branch', sub: 'Near Ablekuma North' },
]

export function QuickActions() {
  function handleReferral() {
    const regNo = localStorage.getItem('userRegNo')
    if (!regNo) { toast.error('Could not get your registration number'); return }
    const link = `${window.location.origin}/register?ref=${regNo}`
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Referral link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  return (
    <div className="bg-white border border-border rounded-[4px] p-6 quick h-full">
      <h3 className="font-meta text-[14px] font-extrabold tracking-tight text-on-surface mb-[14px]">Quick actions</h3>
      <div className="row">
        {linkActions.map(a => (
          <Link
            key={a.to}
            to={a.to}
            className="qa animate-in fade-in slide-in-from-right-4 duration-500"
          >
            <div className="ic">
              <span className="material-symbols-outlined">{a.icon}</span>
            </div>
            <b className="font-meta">{a.label}</b>
            <span>{a.sub}</span>
          </Link>
        ))}
        <button
          onClick={handleReferral}
          className="qa animate-in fade-in slide-in-from-right-4 duration-500"
          style={{ border: '1px solid hsl(var(--border))', background: '#fff', textAlign: 'left', cursor: 'pointer' }}
        >
          <div className="ic">
            <span className="material-symbols-outlined">share</span>
          </div>
          <b className="font-meta">Refer a member</b>
          <span>Earn impact points</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .quick h3 { font-size: 14px; font-weight: 800; margin-bottom: 14px; font-family: 'Public Sans', sans-serif; }
        .quick .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .qa { display: flex; flex-direction: column; gap: 6px; padding: 14px 12px; border: 1px solid hsl(var(--border)); border-radius: 4px; background: #fff; align-items: flex-start; transition: all .15s; cursor: pointer; text-decoration: none; }
        .qa:hover { border-color: hsl(var(--primary)); transform: translateY(-1px); box-shadow: 0 8px 20px -8px rgba(0, 107, 63, 0.2); }
        .qa .ic { width: 36px; height: 36px; border-radius: 6px; background: hsl(var(--container-low)); display: flex; align-items: center; justify-content: center; color: hsl(var(--primary)); }
        .qa .ic .material-symbols-outlined { font-size: 20px; }
        .qa b { display: block; font-family: 'Public Sans', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: -0.005em; color: hsl(var(--on-surface)); line-height: 1.2; margin: 0; }
        .qa span { font-size: 10.5px; color: hsl(var(--on-surface-muted)); line-height: 1.2; display: block; }
      ` }} />
    </div>
  )
}
