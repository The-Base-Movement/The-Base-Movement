import { StatTile } from '@/components/admin/StatTile'

interface KpiItem {
  label: string
  value: string | number
  bar: string
}

export default function KpiSummary({ items }: { items: KpiItem[] }) {
  return (
    <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
      {items.map((item) => (
        <StatTile key={item.label} label={item.label} value={item.value} bar={item.bar} />
      ))}
    </div>
  )
}
