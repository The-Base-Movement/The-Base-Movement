import type { Order } from '@/services/adminService'

export const STATUS_CONFIG: Record<
  Order['status'],
  { label: string; color: string; bg: string; icon: string; kpiClass: string }
> = {
  Pending: {
    label: 'Pending',
    color: 'text-[var(--brand-gold)]',
    bg: 'bg-[var(--brand-gold)]/10 border-[var(--brand-gold)]/20',
    icon: 'schedule',
    kpiClass: 'g',
  },
  Processing: {
    label: 'Processing',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: 'inventory_2',
    kpiClass: 'k',
  },
  Dispatched: {
    label: 'Dispatched',
    color: 'text-stone-500',
    bg: 'bg-stone-500/10 border-stone-500/20',
    icon: 'local_shipping',
    kpiClass: 'k',
  },
  Delivered: {
    label: 'Delivered',
    color: 'text-[var(--brand-green)]',
    bg: 'bg-[var(--brand-green)]/10 border-[var(--brand-green)]/20',
    icon: 'check_circle',
    kpiClass: 'gr',
  },
  Cancelled: {
    label: 'Cancelled',
    color: 'text-red-500',
    bg: 'bg-red-500/10 border-red-500/20',
    icon: 'cancel',
    kpiClass: 'r',
  },
}

export const NEXT_STATUS: Partial<Record<Order['status'], Order['status']>> = {
  Pending: 'Processing',
  Processing: 'Dispatched',
  Dispatched: 'Delivered',
}
