/**
 * OrderListCard Component
 * -------------------------------------------------------------
 * Displays a single merchandise/materials order card in the Admin Command Logistics section.
 * Summarizes the requester's name, email, short order ID, total order cost in GHS,
 * status badge with status-themed icon, shipping location, and inline action buttons.
 */

import type { Order } from '@/services/adminService'

interface OrderListCardProps {
  order: Order
  isSelected: boolean
  onClick: () => void
  onAdvance: () => void
  updatingId: string | null
  statusConfig: Record<string, { label: string; icon: string }>
  nextStatus?: string
}

/**
 * OrderListCard component definition.
 */
export function OrderListCard({
  order,
  isSelected,
  onClick,
  onAdvance,
  updatingId,
  statusConfig,
  nextStatus,
}: OrderListCardProps) {
  const cfg = statusConfig[order.status]

  return (
    <div
      style={{
        padding: '13px 16px',
        borderBottom: '1px solid hsl(var(--border))',
        background: isSelected ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--card))',
        boxShadow: isSelected ? 'inset 3px 0 0 hsl(var(--primary))' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      {/* Identity + status pill */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
            >
              inventory_2
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 13.5,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {order.full_name}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10.5,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              #{order.id.slice(0, 8).toUpperCase()} · {order.email}
            </p>
          </div>
        </div>
        <span
          className={`pill ${order.status === 'Delivered' ? 'pill-ok' : order.status === 'Cancelled' ? 'pill-err' : 'pill-warn'}`}
          style={{ flexShrink: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
            {cfg.icon}
          </span>
          {cfg.label}
        </span>
      </div>

      {/* Meta: region + amount */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          fontWeight: 'var(--font-weight-medium, 500)',
          color: 'hsl(var(--on-surface-muted))',
          fontFamily: "'Public Sans', sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            location_on
          </span>
          {order.region_or_state || 'Unknown Hub'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
            payments
          </span>
          ₵{Number(order.total_amount).toFixed(2)}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="btn btn-outline btn-sm"
          style={{ flex: 1 }}
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            visibility
          </span>
          Manifest
        </button>
        {nextStatus && (
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1.5 }}
            disabled={updatingId === order.id}
            onClick={(e) => {
              e.stopPropagation()
              onAdvance()
            }}
          >
            {updatingId === order.id ? '...' : `Advance → ${nextStatus}`}
          </button>
        )}
      </div>
    </div>
  )
}
