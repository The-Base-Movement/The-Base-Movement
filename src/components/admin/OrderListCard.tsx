import type { Order } from '@/services/adminService'
import { cn } from '@/lib/utils'

interface OrderListCardProps {
  order: Order
  isSelected: boolean
  onClick: () => void
  onAdvance: () => void
  updatingId: string | null
  statusConfig: Record<string, { label: string; icon: string }>
  nextStatus?: string
}

export function OrderListCard({ 
  order, 
  isSelected, 
  onClick, 
  onAdvance, 
  updatingId, 
  statusConfig,
  nextStatus 
}: OrderListCardProps) {
  const cfg = statusConfig[order.status]
  
  return (
    <div 
      className={cn(
        "p-4 space-y-4 transition-colors",
        isSelected ? "bg-muted/5 shadow-inner" : "bg-white"
      )}
      style={{
        padding: '13px 16px',
        borderBottom: '1px solid hsl(var(--border))',
        background: isSelected ? 'rgba(0,107,63,.04)' : '#fff',
        boxShadow: isSelected ? 'inset 3px 0 0 hsl(var(--primary))' : undefined,
      }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-sm bg-muted/5 border border-border/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 20 }}>inventory_2</span>
          </div>
          <div className="space-y-0.5">
            <h4 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: 'hsl(var(--on-surface))', margin: 0 }}>
              {order.full_name}
            </h4>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
              #{order.id.slice(0, 8).toUpperCase()} · {order.email}
            </p>
          </div>
        </div>
        <span className={cn('pill', order.status === 'Delivered' ? 'pill-ok' : order.status === 'Cancelled' ? 'pill-err' : 'pill-warn')}>
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-micro font-bold text-muted-foreground/60">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>
          {order.region_or_state || 'Unknown Hub'}
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>payments</span>
          ₵{Number(order.total_amount).toFixed(2)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="btn btn-outline btn-sm flex-1 h-9 rounded-sm"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
          Manifest
        </button>
        {nextStatus && (
          <button
            className="btn btn-primary btn-sm flex-[1.5] h-9 rounded-sm"
            disabled={updatingId === order.id}
            onClick={(e) => {
              e.stopPropagation();
              onAdvance();
            }}
          >
            {updatingId === order.id ? '...' : `Advance → ${nextStatus}`}
          </button>
        )}
      </div>
    </div>
  )
}
