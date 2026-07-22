import { StatTile } from '@/components/admin/StatTile'

interface KpiItem {
  label: string
  value: string
  bar: string
}

export default function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpis" style={{ marginBottom: 20 }}>
      {items.map((item) => (
        <StatTile key={item.label} label={item.label} value={item.value} bar={item.bar} />
      ))}
    </div>
  )
}
