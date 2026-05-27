import { useMemo } from 'react'
import type { OrderStats } from '@/services/adminService'
import { TacticalKPI } from '@/components/admin/TacticalKPI'
import { Skeleton } from '@/components/states'

interface OrdersKPIsProps {
  loading: boolean
  stats: OrderStats | null
}

export function OrdersKPIs({ loading, stats }: OrdersKPIsProps) {
  const statCards = useMemo(
    () =>
      stats
        ? [
            {
              label: 'Cancelled',
              value: stats.cancelledOrders,
              variant: 'red' as const,
              sub: 'Terminated manifest flow',
            },
            {
              label: 'Revenue Today',
              value: `₵${stats.revenueToday.toFixed(2)}`,
              variant: 'gold' as const,
              sub: 'Tactical daily inflow',
            },
            {
              label: 'Total Orders',
              value: stats.totalOrders,
              variant: 'black' as const,
              sub: `₵${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} total`,
            },
            {
              label: 'Delivered',
              value: stats.deliveredOrders,
              variant: 'green' as const,
              sub: 'Successful fulfillment completion',
            },
          ]
        : [],
    [stats]
  )

  return (
    <div className="kpis">
      {loading
        ? [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="panel"
              style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 3,
                  background: 'hsl(var(--border))',
                }}
              />
              <Skeleton variant="text-sm" width={80} style={{ marginBottom: 10 }} />
              <Skeleton variant="text-xl" width={60} />
            </div>
          ))
        : statCards.map((s) => (
            <TacticalKPI
              key={s.label}
              label={s.label}
              value={s.value}
              variant={s.variant}
              delta={s.sub}
            />
          ))}
    </div>
  )
}
