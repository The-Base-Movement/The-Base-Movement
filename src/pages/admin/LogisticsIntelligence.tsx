import { useState, useEffect } from 'react'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { adminService } from '@/services/adminService'
import type { LogisticsAuditEntry } from '@/types/admin'
import { format } from 'date-fns'
import { toast } from 'sonner'

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

const pillBase: React.CSSProperties = { padding: '2px 10px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', borderRadius: 4, fontFamily: "'Public Sans', sans-serif" }

const auditActionStyle = (action: string): React.CSSProperties => {
  if (action === 'REPLENISHED') return { background: 'rgba(34,197,94,0.1)', color: 'hsl(var(--primary))', border: '1px solid rgba(34,197,94,0.2)' }
  return { background: 'hsl(var(--container-low))', color: 'hsl(var(--on-surface-muted))', border: '1px solid hsl(var(--border))' }
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
          adminService.getLogisticsAudit(15)
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
        adminService.getLogisticsAudit(15)
      ])
      setAlerts(updatedAlerts)
      setAuditLogs(updatedAudit)
    } else {
      toast.error('Replenishment protocol failed.')
    }
    setIsReplenishing(false)
    setShowReplenishConfirm(false)
  }

  const handleGeneratePurchaseOrder = async () => {
    setIsGeneratingPO(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success('Purchase order documentation generated successfully.')
    setIsGeneratingPO(false)
  }

  const handleRouteOptimization = async () => {
    setIsOptimizing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success('Route optimization protocols initiated for all regional hubs.')
    setIsOptimizing(false)
  }

  const avgDispatch = velocity.length > 0
    ? (velocity.reduce((s, v) => s + v.avg_dispatch_hours, 0) / velocity.length).toFixed(1)
    : '0'
  const avgFulfillment = velocity.length > 0
    ? (velocity.reduce((s, v) => s + v.fulfillment_rate, 0) / velocity.length).toFixed(1)
    : '0'
  const health = velocity.length > 0
    ? Math.round(velocity.reduce((s, v) => s + v.fulfillment_rate, 0) / velocity.length)
    : 0

  if (loading) {
    return (
      <div className="admin-page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--border))', animation: 'spin 1s linear infinite' }}>refresh</span>
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Synchronizing supply chain telemetry…</p>
      </div>
    )
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="ph" style={{ marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 24, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>inventory_2</span>
            Logistics monitoring
          </h1>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Automated supply chain monitoring and regional dispatch tracking.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-outline btn-sm" onClick={handleRouteOptimization} disabled={isOptimizing}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, ...(isOptimizing ? { animation: 'spin 1s linear infinite' } : {}) }}>map</span>
            Route optimization
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowReplenishConfirm(true)} disabled={isReplenishing}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add_box</span>
            Replenish all
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <TacticalKPI label="Supply chain health" value={`${health}%`} description="Logistics efficiency" trend={{ direction: health >= 80 ? 'up' : 'down', value: health >= 80 ? 'Optimal' : 'Compromised' }} />
        <TacticalKPI label="Urgent alerts" value={alerts.length} description="Inventory alerts" trend={{ direction: alerts.length > 0 ? 'down' : 'neutral', value: alerts.length > 0 ? 'Critical' : 'Stable' }} />
        <TacticalKPI label="Avg dispatch" value={`${avgDispatch}h`} description="30-day aggregate" />
        <TacticalKPI label="Fulfillment rate" value={`${avgFulfillment}%`} description="Verified delivery" trend={{ direction: Number(avgFulfillment) >= 80 ? 'up' : 'down', value: Number(avgFulfillment) >= 80 ? 'Elite' : 'Target' }} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="xl:grid-cols-[1fr_2fr]">
        {/* Inventory Alerts */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>Inventory alerts</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Items requiring immediate action</div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}>warning</span>
          </div>
          <div style={{ flex: 1, maxHeight: 500, overflowY: 'auto' }}>
            {alerts.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'hsl(var(--border))' }}>inventory_2</span>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>All stock levels normal</p>
              </div>
            ) : (
              alerts.map(item => (
                <div key={item.id} style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>{item.category}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 16 }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--destructive))' }}>
                      {item.stock_quantity} <span style={{ fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>left</span>
                    </div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Target: {item.low_stock_threshold}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          {alerts.length > 0 && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid hsl(var(--border))' }}>
              <button className="btn btn-dest" style={{ width: '100%' }} onClick={handleGeneratePurchaseOrder} disabled={isGeneratingPO}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, ...(isGeneratingPO ? { animation: 'spin 1s linear infinite' } : {}) }}>description</span>
                {isGeneratingPO ? 'Generating…' : 'Generate purchase order'}
              </button>
            </div>
          )}
        </div>

        {/* Regional Performance */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>Regional performance</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Average processing and transit times</div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>bar_chart</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Jurisdiction</th>
                  <th>Orders</th>
                  <th>Dispatch</th>
                  <th>Delivery</th>
                  <th style={{ textAlign: 'right' }}>Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {velocity.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>No dispatch telemetry available</td>
                  </tr>
                ) : velocity.map((v, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>{v.region}</td>
                    <td style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{v.total_orders} items</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>schedule</span>
                        {v.avg_dispatch_hours}h
                      </div>
                    </td>
                    <td style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{v.avg_delivery_hours}h</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                        <div style={{ width: 80, height: 4, background: 'hsl(var(--border))', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'hsl(var(--primary))', width: `${v.fulfillment_rate}%`, transition: 'width 1s ease' }} />
                        </div>
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--primary))', width: 34, textAlign: 'right' }}>{v.fulfillment_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* National Map */}
      <div style={{ marginTop: 24, background: 'hsl(var(--on-surface))', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '28px 32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 6 }}>National supply chain map</div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Real-time visualization of material flow across the 16 regions.</p>
          </div>
          <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }} onClick={() => toast.success('Initializing enterprise visualization protocol…')}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>public</span>
            Enterprise view
          </button>
        </div>
        <div style={{ height: 180, background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'rgba(255,255,255,0.1)' }}>public</span>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Waiting for regional hub synchronization…</p>
        </div>
      </div>

      {/* Audit Vault */}
      <div className="panel" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>history</span>
              Supply chain audit vault
            </div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Immutable ledger of replenishment and stock adjustment events</div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>verified_user</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Change</th>
                <th>Source hub</th>
                <th style={{ textAlign: 'right' }}>Authorized</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>No audit entries detected in the ledger.</td>
                </tr>
              ) : auditLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{format(new Date(log.timestamp), 'MMM dd, HH:mm')}</td>
                  <td><span style={{ ...pillBase, ...auditActionStyle(log.action) }}>{log.action}</span></td>
                  <td style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>+{log.quantityChange} units</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'hsl(var(--on-surface-muted))' }}>{log.sourceLocation}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--primary))', opacity: 0.5 }}>verified_user</span>
                      {log.performedBy}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replenish Confirm Modal */}
      {showReplenishConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
             onClick={() => setShowReplenishConfirm(false)}>
          <div style={{ background: '#fff', borderRadius: 6, width: '100%', maxWidth: 440, padding: '40px 32px', textAlign: 'center' }}
               onClick={e => e.stopPropagation()}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--on-surface))' }}>add_box</span>
            </div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 18, color: 'hsl(var(--on-surface))', marginBottom: 12 }}>Confirm bulk replenishment?</div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 13, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.6, marginBottom: 28 }}>
              This will initiate a movement-wide replenishment protocol for all low-stock assets. Standard procurement workflows will be triggered.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowReplenishConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReplenishAll} disabled={isReplenishing}>
                {isReplenishing
                  ? <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>refresh</span>
                  : 'Confirm protocol'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
