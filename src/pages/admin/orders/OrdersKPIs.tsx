import { useMemo } from 'react'
import type { OrderStats } from '@/services/adminService'
import { TacticalKPI } from '@/components/admin/TacticalKPI'

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
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card black animate-pulse h-48 bg-white" />
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
