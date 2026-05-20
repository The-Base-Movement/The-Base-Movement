import { STATUS_CONFIG, NEXT_STATUS } from './utils'
import type { Order } from '@/services/adminService'

interface OrderDetailPanelProps {
  selectedOrder: Order
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>
  updatingId: string | null
  handleStatusAdvance: (order: Order) => Promise<void>
  handleCancel: (order: Order) => Promise<void>
}

export function OrderDetailPanel({
  selectedOrder,
  setSelectedOrder,
  updatingId,
  handleStatusAdvance,
  handleCancel,
}: OrderDetailPanelProps) {
  const cfg = STATUS_CONFIG[selectedOrder.status]

  return (
    <div className="panel" style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
      <div
        className="ph"
        style={{
          background: 'linear-gradient(135deg,#0f1310,#1f2620)',
          borderTop: '3px solid hsl(var(--primary))',
          borderRadius: '6px 6px 0 0',
          padding: '16px 18px',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
            >
              inventory_2
            </span>
            Order Manifest
          </h3>
          <div className="meta" style={{ color: 'rgba(255,255,255,.45)', fontSize: 10 }}>
            Logistics ID: #{selectedOrder.id.toUpperCase()}
          </div>
        </div>
        <button
          onClick={() => setSelectedOrder(null)}
          className="ico"
          style={{
            background: 'transparent',
            borderColor: 'rgba(255,255,255,.1)',
            color: '#fff',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            close
          </span>
        </button>
      </div>

      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        {/* ID & Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span
            className={`pill ${selectedOrder.status === 'Delivered' ? 'pill-ok' : selectedOrder.status === 'Cancelled' ? 'pill-err' : 'pill-warn'}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
              {cfg.icon}
            </span>
            {cfg.label}
          </span>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: 'hsl(var(--on-surface-muted))',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 4,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Manifest Date
            </p>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'hsl(var(--on-surface))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {new Date(selectedOrder.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Patriot */}
        <div
          style={{
            paddingTop: 20,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label className="field-label">Recipient details</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p
              style={{
                fontWeight: 800,
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {selectedOrder.full_name}
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
              }}
            >
              {selectedOrder.email}
            </p>
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'hsl(var(--on-surface-muted))',
                margin: 0,
              }}
            >
              {selectedOrder.phone}
            </p>
          </div>
        </div>

        {/* Shipping */}
        <div
          style={{
            paddingTop: 20,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label className="field-label">Logistics destination</label>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'hsl(var(--on-surface-muted))',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            <p style={{ margin: 0 }}>{selectedOrder.shipping_address}</p>
            <p style={{ margin: 0 }}>
              {selectedOrder.city}, {selectedOrder.region_or_state}
            </p>
            <p
              style={{
                fontWeight: 800,
                color: 'hsl(var(--on-surface))',
                margin: '4px 0 0',
              }}
            >
              {selectedOrder.country}
            </p>
          </div>
        </div>

        {/* Manifest Items */}
        <div
          style={{
            paddingTop: 20,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <label className="field-label" style={{ margin: 0 }}>
              Manifest items
            </label>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {selectedOrder.items.length} Units
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedOrder.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: 12,
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 4,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {item.product_name || 'Movement Asset'}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      margin: 0,
                    }}
                  >
                    ₵{Number(item.price_at_purchase).toFixed(2)} unit
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: 'hsl(var(--on-surface))',
                      margin: 0,
                    }}
                  >
                    x{item.quantity}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: 'hsl(var(--primary))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      margin: 0,
                    }}
                  >
                    ₵{(item.quantity * item.price_at_purchase).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div
          style={{
            paddingTop: 20,
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {[
            {
              label: 'Subtotal',
              value: Number(selectedOrder.subtotal).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
            },
            {
              label: 'Logistics Fee',
              value: Number(selectedOrder.shipping_fee).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              }),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <span style={{ color: 'hsl(var(--on-surface-muted))' }}>{label}</span>
              <span style={{ color: 'hsl(var(--on-surface))' }}>₵{value}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 12,
              borderTop: '1px solid hsl(var(--border))',
              marginTop: 6,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'hsl(var(--on-surface))',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Total Value
            </span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: 'hsl(var(--primary))',
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              ₵
              {Number(selectedOrder.total_amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {NEXT_STATUS[selectedOrder.status] && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', height: 44 }}
              onClick={() => handleStatusAdvance(selectedOrder)}
              disabled={updatingId === selectedOrder.id}
            >
              {updatingId === selectedOrder.id
                ? 'Synchronizing...'
                : `Advance to ${NEXT_STATUS[selectedOrder.status]}`}
            </button>
          )}
          {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
            <button
              className="btn btn-dest"
              style={{ width: '100%', height: 44 }}
              onClick={() => handleCancel(selectedOrder)}
              disabled={updatingId === selectedOrder.id}
            >
              Terminate Order
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
