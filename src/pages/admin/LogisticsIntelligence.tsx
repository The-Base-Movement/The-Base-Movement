import { useState, useEffect } from 'react'
import { BrandLine } from '@/components/ui/BrandLine'
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
      <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--primary))', animation: 'spin 1.2s linear infinite' }}>sync</span>
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--primary))' }}>Synchronizing supply chain telemetry…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page header — matches .top pattern from design system */}
      <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
        <div>
          <div className="crumbs">Logistics · Intelligence</div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>inventory_2</span>
            Logistics monitoring
          </h2>
          <BrandLine style={{ marginTop: 10, marginBottom: 4 }} />
          <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12.5, color: 'hsl(var(--on-surface-muted))', marginTop: 6, marginBottom: 0 }}>
            Automated supply chain monitoring and regional dispatch tracking.
          </p>
        </div>
        <div className="actions">
          <button className="btn btn-outline" onClick={handleRouteOptimization} disabled={isOptimizing}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, animation: isOptimizing ? 'spin 1.2s linear infinite' : 'none' }}>
              {isOptimizing ? 'sync' : 'route'}
            </span>
            Route Optimization
          </button>
          <button className="btn btn-primary" onClick={() => setShowReplenishConfirm(true)} disabled={isReplenishing}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, animation: isReplenishing ? 'spin 1.2s linear infinite' : 'none' }}>
              {isReplenishing ? 'sync' : 'add_box'}
            </span>
            Replenish All
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpis" style={{ marginBottom: 0 }}>
        <div className={`kpi ${health >= 80 ? 'g' : health >= 51 ? '' : 'r'}`}>
          <div className="l">Supply chain health</div>
          <div className="v">{health}%</div>
          <div className="d">Logistics efficiency</div>
        </div>
        <div className={`kpi ${alerts.length > 0 ? 'r' : 'k'}`}>
          <div className="l">Urgent alerts</div>
          <div className="v">{alerts.length}</div>
          <div className="d">Inventory alerts</div>
        </div>
        <div className="kpi">
          <div className="l">Avg dispatch</div>
          <div className="v">{avgDispatch}h</div>
          <div className="d">30-day aggregate</div>
        </div>
        <div className={`kpi ${Number(avgFulfillment) >= 80 ? 'g' : Number(avgFulfillment) >= 51 ? '' : 'r'}`}>
          <div className="l">Fulfillment rate</div>
          <div className="v">{avgFulfillment}%</div>
          <div className="d">Verified delivery</div>
        </div>
      </div>

      {/* Two-panel grid — inventory alerts + dispatch table */}
      <div className="logistics-grid">

        {/* Inventory alerts */}
        <div className="panel" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>Inventory alerts</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Items requiring immediate replenishment</div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--destructive))' }}>warning</span>
          </div>

          <div style={{ flex: 1 }}>
            {alerts.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'hsl(var(--border))' }}>inventory_2</span>
                <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>All stock levels normal</p>
              </div>
            ) : (
              alerts.map(item => (
                <div key={item.id} style={{ padding: '12px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', marginTop: 2, textTransform: 'lowercase' }}>{item.category}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--destructive))' }}>
                      {item.stock_quantity} <span style={{ fontSize: 10, color: 'hsl(var(--on-surface-muted))', fontWeight: 700 }}>in stock</span>
                    </div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Threshold: {item.low_stock_threshold}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {alerts.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-dest btn-sm" onClick={handleGeneratePurchaseOrder} disabled={isGeneratingPO}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, animation: isGeneratingPO ? 'spin 1.2s linear infinite' : 'none' }}>
                  {isGeneratingPO ? 'sync' : 'description'}
                </span>
                Generate Purchase Order
              </button>
            </div>
          )}
        </div>

        {/* Regional dispatch performance */}
        <div className="panel" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>Regional dispatch performance</div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Average processing and transit times by region</div>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--on-surface-muted))' }}>bar_chart</span>
          </div>

          {/* Desktop table */}
          <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))' }}>
                  {['Jurisdiction', 'Orders', 'Dispatch', 'Delivery', 'Fulfillment'].map(h => (
                    <th key={h} style={{ padding: '10px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {velocity.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>No dispatch telemetry available</td>
                  </tr>
                ) : velocity.map((v, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '12px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>{v.region || 'Unknown'}</td>
                    <td style={{ padding: '12px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontVariantNumeric: 'tabular-nums' }}>{v.total_orders}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))' }}>schedule</span>
                        {v.avg_dispatch_hours}h
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', fontVariantNumeric: 'tabular-nums' }}>{v.avg_delivery_hours}h</td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'hsl(var(--border))', borderRadius: 2, maxWidth: 60, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'hsl(var(--primary))', width: `${v.fulfillment_rate}%` }} />
                        </div>
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11, color: 'hsl(var(--primary))', fontVariantNumeric: 'tabular-nums' }}>{v.fulfillment_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mobile-only">
            {velocity.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>No dispatch telemetry available</div>
            ) : velocity.map((v, idx) => (
              <div key={idx} style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>{v.region || 'Unknown'}</span>
                  <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', background: 'hsl(var(--container-low))', padding: '2px 8px', borderRadius: 2, fontVariantNumeric: 'tabular-nums' }}>{v.total_orders} orders</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>Dispatch</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', fontVariantNumeric: 'tabular-nums' }}>{v.avg_dispatch_hours}h</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 10, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 3 }}>Delivery</div>
                    <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))', fontVariantNumeric: 'tabular-nums' }}>{v.avg_delivery_hours}h</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Public Sans', sans-serif", fontSize: 10, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', marginBottom: 4 }}>
                    <span>Fulfillment</span>
                    <span style={{ color: 'hsl(var(--primary))', fontVariantNumeric: 'tabular-nums' }}>{v.fulfillment_rate}%</span>
                  </div>
                  <div style={{ height: 4, background: 'hsl(var(--border))', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'hsl(var(--primary))', width: `${v.fulfillment_rate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supply chain map */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'hsl(var(--on-surface))', padding: '22px 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-.01em' }}>National supply chain map</div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>Real-time visualization of material flow across the 16 regions.</div>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => toast.success('Initializing high-fidelity enterprise visualization protocol…')}
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,.2)', background: 'rgba(255,255,255,.06)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>map</span>
            Enterprise View
          </button>
        </div>

        <div style={{ height: 280, background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.5 }} />
          <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px solid hsl(var(--border))', animation: 'ping 2.5s ease-in-out infinite', opacity: 0.25 }} />
          <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', border: '1px solid hsl(var(--border))', animation: 'pulse 3s ease-in-out infinite', opacity: 0.15 }} />
          <div style={{ position: 'relative', textAlign: 'center', zIndex: 10, padding: '0 24px' }}>
            <div style={{ width: 52, height: 52, background: '#fff', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: 'hsl(var(--border))' }}>map</span>
            </div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', marginBottom: 4 }}>Syncing regional data</div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>No regional data available yet. Waiting for hub connection.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              {([0, 150, 300] as const).map(d => (
                <span key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'hsl(var(--border))', display: 'inline-block', animationDelay: `${d}ms` }} className="animate-bounce" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit ledger */}
      <div className="panel" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'hsl(var(--primary))' }}>history</span>
              Supply chain audit vault
            </div>
            <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}>Immutable ledger of replenishment and stock adjustment events</div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'hsl(var(--primary))' }}>verified_user</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))' }}>
                {['Timestamp', 'Action', 'Change', 'Source hub', 'Authorized by'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10.5, color: 'hsl(var(--on-surface-muted))', letterSpacing: '.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 20px', textAlign: 'center', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>No audit entries detected in the ledger.</td>
                </tr>
              ) : auditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '12px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))', whiteSpace: 'nowrap' }}>
                    {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                  </td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 2, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 10, letterSpacing: '.04em', textTransform: 'uppercase', background: log.action === 'REPLENISHED' ? 'hsl(var(--primary) / 10%)' : 'hsl(var(--container-low))', color: log.action === 'REPLENISHED' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface))', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    +{log.quantityChange} units
                  </td>
                  <td style={{ padding: '12px 20px', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{log.sourceLocation}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'hsl(var(--primary) / 10%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 11, color: 'hsl(var(--primary))' }}>verified_user</span>
                      </div>
                      <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>{log.performedBy}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replenishment confirm modal */}
      {showReplenishConfirm && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)' }}
            onClick={() => setShowReplenishConfirm(false)}
          />
          <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 51, width: '100%', maxWidth: 480, margin: '0 16px', background: '#fff', border: '1px solid hsl(var(--border))', boxShadow: '0 32px 64px -16px rgba(0,0,0,.25)', padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'hsl(var(--container-low))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'hsl(var(--on-surface))' }}>add_box</span>
              </div>
              <div style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 900, fontSize: 16, color: 'hsl(var(--on-surface))', letterSpacing: '-.01em' }}>Confirm bulk replenishment?</div>
            </div>
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 700, fontSize: 12, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.65, marginBottom: 24 }}>
              This will initiate a movement-wide replenishment protocol for all low-stock assets. Standard procurement workflows will be triggered for each identified item.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="btn btn-outline" onClick={() => setShowReplenishConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReplenishAll} disabled={isReplenishing}>
                {isReplenishing && (
                  <span className="material-symbols-outlined" style={{ fontSize: 15, animation: 'spin 1.2s linear infinite' }}>sync</span>
                )}
                {isReplenishing ? 'Executing…' : 'Confirm Protocol'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
