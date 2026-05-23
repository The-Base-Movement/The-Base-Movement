import { Link } from 'react-router-dom'

export function StoreBreadcrumb() {
  return (
    <div className="text-[11px] font-bold font-meta text-on-surface-muted uppercase tracking-[0.04em] mb-4 flex items-center gap-1">
      <Link to="/" className="hover:text-primary">
        Home
      </Link>
      <span className="opacity-40">·</span>
      <span className="text-on-surface">Store</span>
      <span className="opacity-40">·</span>
      <span className="text-on-surface/40">All products</span>
    </div>
  )
}
