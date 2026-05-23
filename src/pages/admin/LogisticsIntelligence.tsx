import { useState, useEffect } from 'react'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { adminService } from '@/services/adminService'
import type { LogisticsAuditEntry } from '@/types/admin'
import { toast } from 'sonner'

// Modular imports
import { ReplenishConfirmModal } from './logisticsintelligence/ReplenishConfirmModal'
import { LogisticsAuditVault } from './logisticsintelligence/LogisticsAuditVault'
import { RegionalPerformanceTable } from './logisticsintelligence/RegionalPerformanceTable'
import { NationalSupplyChainMap } from './logisticsintelligence/NationalSupplyChainMap'

interface LogisticsStats {
  region: string
  total_orders: number
  avg_dispatch_hours: number
  avg_delivery_hours: number
  fulfillment_rate: number
}

interface InventoryAlert {
  id: string
  name: string
  stock_quantity: number
  low_stock_threshold: number
  category: string
}

export default function LogisticsIntelligence() {
  const [velocity, setVelocity] = useState<LogisticsStats[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [auditLogs, setAuditLogs] = useState<LogisticsAuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isReplenishing, setIsReplenishing] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isGeneratingPO, setIsGeneratingPO] = useState(false)
  const [showReplenishConfirm, setShowReplenishConfirm] = useState(false)

  useEffect(() => {
    const fetchLogisticsData = async () => {
      setLoading(true)
      try {
        const [velocityData, alertsData, auditData] = await Promise.all([
          adminService.getLogisticsVelocity(),
          adminService.getInventoryAlerts(),
          adminService.getLogisticsAudit(15),
        ])
        setVelocity(velocityData)
        setAlerts(alertsData)
        setAuditLogs(auditData)
      } catch (error) {
        console.error('[LOGISTICS] Failed to synchronize supply chain telemetry:', error)
        toast.error('Failed to synchronize supply chain telemetry.')
      } finally {
        setLoading(false)
      }
    }
    fetchLogisticsData()
  }, [])

  const handleReplenishAll = async () => {
    setIsReplenishing(true)
    const success = await adminService.replenishInventory()
    if (success) {
      toast.success('Replenishment protocol initiated for all low-stock assets.')
      const [updatedAlerts, updatedAudit] = await Promise.all([
        adminService.getInventoryAlerts(),
        adminService.getLogisticsAudit(15),
      ])
      setAlerts(updatedAlerts)
      setAuditLogs(updatedAudit)
    } else {
      toast.error('Replenishment protocol failed.')
    }
    setIsReplenishing(false)
    setShowReplenishConfirm(false)
  }

  const handleGeneratePurchaseOrder = () => {
    if (!alerts.length) {
      toast.error('No low-stock items to generate a purchase order for.')
      return
    }
    setIsGeneratingPO(true)
    const headers = ['Product', 'Category', 'Current Stock', 'Threshold', 'Units Needed']
    const rows = alerts.map((a) => [
      `"${a.name}"`,
      `"${a.category}"`,
      a.stock_quantity,
      a.low_stock_threshold,
      Math.max(0, a.low_stock_threshold * 3 - a.stock_quantity),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `purchase_order_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Purchase order generated — ${alerts.length} low-stock items included.`)
    setIsGeneratingPO(false)
  }

  const handleRouteOptimization = () => {
    toast.info(
      'Route optimization requires regional coordinators to redistribute assignments. Contact leads via the Broadcasts module.'
    )
    setIsOptimizing(false)
  }

  const avgDispatch =
    velocity.length > 0
      ? (velocity.reduce((s, v) => s + v.avg_dispatch_hours, 0) / velocity.length).toFixed(1)
      : '0'
  const avgFulfillment =
    velocity.length > 0
      ? (velocity.reduce((s, v) => s + v.fulfillment_rate, 0) / velocity.length).toFixed(1)
      : '0'
  const health =
    velocity.length > 0
      ? Math.round(velocity.reduce((s, v) => s + v.fulfillment_rate, 0) / velocity.length)
      : 0

  if (loading) {
    return (
      <div
        className="admin-page-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          gap: 12,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 48,
            color: 'hsl(var(--border))',
            animation: 'spin 1s linear infinite',
          }}
        >
          refresh
        </span>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 11,
            color: 'hsl(var(--on-surface-muted))',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Synchronizing supply chain telemetry…
        </p>
      </div>
    )
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 24,
              color: 'hsl(var(--on-surface))',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              margin: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              inventory_2
            </span>
            Logistics monitoring
          </h1>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 4,
            }}
          >
            Automated supply chain monitoring and regional dispatch tracking.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleRouteOptimization}
            disabled={isOptimizing}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 15,
                ...(isOptimizing ? { animation: 'spin 1s linear infinite' } : {}),
              }}
            >
              map
            </span>
            Route optimization
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowReplenishConfirm(true)}
            disabled={isReplenishing}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add_box
            </span>
            Replenish all
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <TacticalKPI
          label="Supply chain health"
          value={`${health}%`}
          description="Logistics efficiency"
          trend={{
            direction: health >= 80 ? 'up' : 'down',
            value: health >= 80 ? 'Optimal' : 'Compromised',
          }}
        />
        <TacticalKPI
          label="Urgent alerts"
          value={alerts.length}
          description="Inventory alerts"
          trend={{
            direction: alerts.length > 0 ? 'down' : 'neutral',
            value: alerts.length > 0 ? 'Critical' : 'Stable',
          }}
        />
        <TacticalKPI
          label="Avg dispatch"
          value={`${avgDispatch}h`}
          description="30-day aggregate"
        />
        <TacticalKPI
          label="Fulfillment rate"
          value={`${avgFulfillment}%`}
          description="Verified delivery"
          trend={{
            direction: Number(avgFulfillment) >= 80 ? 'up' : 'down',
            value: Number(avgFulfillment) >= 80 ? 'Elite' : 'Target',
          }}
        />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Inventory Alerts */}
        <div
          className="panel"
          style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid hsl(var(--border))',
              background: 'hsl(var(--container-low))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-semibold, 600)',
                  fontSize: 13,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                Inventory alerts
              </div>
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                  marginTop: 2,
                }}
              >
                Items requiring immediate action
              </div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}
            >
              warning
            </span>
          </div>
          <div style={{ flex: 1, maxHeight: 500, overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 24px',
                  gap: 12,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 48, color: 'hsl(var(--border))' }}
                >
                  inventory_2
                </span>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  All stock levels normal
                </p>
              </div>
            ) : (
              alerts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid hsl(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: 2,
                      }}
                    >
                      {item.category}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 16 }}>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-semibold, 600)',
                        fontSize: 12,
                        color: 'hsl(var(--destructive))',
                      }}
                    >
                      {item.stock_quantity}{' '}
                      <span
                        style={{
                          fontWeight: 'var(--font-weight-normal, 400)',
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        left
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-normal, 400)',
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: 2,
                      }}
                    >
                      Target: {item.low_stock_threshold}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {alerts.length > 0 && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid hsl(var(--border))' }}>
              <button
                className="btn btn-dest"
                style={{ width: '100%' }}
                onClick={handleGeneratePurchaseOrder}
                disabled={isGeneratingPO}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 15,
                    ...(isGeneratingPO ? { animation: 'spin 1s linear infinite' } : {}),
                  }}
                >
                  description
                </span>
                {isGeneratingPO ? 'Generating…' : 'Generate purchase order'}
              </button>
            </div>
          )}
        </div>

        {/* Regional Performance */}
        <RegionalPerformanceTable velocity={velocity} />
      </div>

      {/* National Map */}
      <NationalSupplyChainMap
        onEnterpriseView={() => toast.success('Initializing enterprise visualization protocol…')}
      />

      {/* Audit Vault */}
      <LogisticsAuditVault auditLogs={auditLogs} />

      {/* Replenish Confirm Modal */}
      <ReplenishConfirmModal
        isOpen={showReplenishConfirm}
        onClose={() => setShowReplenishConfirm(false)}
        onConfirm={handleReplenishAll}
        isReplenishing={isReplenishing}
      />
    </div>
  )
}
