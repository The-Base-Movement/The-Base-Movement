import { Link } from 'react-router-dom'

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-12">
      <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/store">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
        <span className="material-symbols-outlined text-accent mb-3 text-3xl group-hover:scale-110 transition-transform">shopping_bag</span>
        <p className="font-meta text-tiny font-bold text-on-surface">Member Store</p>
      </Link>
      <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/polls">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
        <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">how_to_vote</span>
        <p className="font-meta text-tiny font-bold text-on-surface">Opinion Polls</p>
      </Link>
      <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/feedback">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
        <span className="material-symbols-outlined text-destructive mb-3 text-3xl group-hover:scale-110 transition-transform">record_voice_over</span>
        <p className="font-meta text-tiny font-bold text-on-surface">Feedback Hub</p>
      </Link>
      <Link className="bg-white border-t-[4px] border-t-transparent relative p-8 flex flex-col items-center text-center hover-lift transition-all group rounded-none shadow-sm" to="/dashboard/canvass">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-[var(--brand-red-full)] via-[var(--brand-gold-full)] to-[var(--brand-green-full)]" />
        <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">diversity_3</span>
        <p className="font-meta text-tiny font-bold text-on-surface">Outreach</p>
      </Link>
    </div>
  )
}
