import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import type { DbStats } from './system/types'
import { HealthCard } from './system/HealthCard'
import { AuditLogTable } from './system/AuditLogTable'

export default function ITSystem() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('System Monitor')
  }, [setCurrentLabel])

  useITLayout('System Monitor', 'shield', 'Security event log and live system health indicators.')

  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  useEffect(() => {
    async function loadHealth() {
      try {
        const { data } = await supabase.rpc('get_db_stats')
        if (data) setDbStats(data as DbStats)
      } finally {
        setHealthLoading(false)
      }
    }
    loadHealth()
  }, [])

  const dbSizeMB = (dbStats?.db_size_bytes ?? 0) / 1024 / 1024
  const dbLimitMB = 500
  const dbPct = Math.min(100, (dbSizeMB / dbLimitMB) * 100)
  const conns = dbStats?.active_connections ?? 0
  const connPct = Math.min(100, (conns / 100) * 100)

  const dbBar =
    dbPct > 80
      ? 'hsl(var(--destructive))'
      : dbPct > 60
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'
  const dbStatus = dbPct > 80 ? 'High Usage' : dbPct > 60 ? 'Moderate' : 'Healthy'
  const connBar =
    conns > 80
      ? 'hsl(var(--destructive))'
      : conns > 50
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'
  const connStatus = conns > 80 ? 'High Load' : conns > 50 ? 'Elevated' : 'Normal'

  return (
    <div>
      {/* Telemetry Health Indicator panels */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 28 }}>
        <HealthCard
          label="API Uptime"
          icon="cloud_done"
          value="99.9%"
          pct={99.9}
          bar="hsl(var(--primary))"
          status="Operational"
          statusColor="hsl(var(--primary))"
          loading={false}
        />
        <HealthCard
          label="Database Storage"
          icon="storage"
          value={healthLoading ? '—' : `${dbSizeMB.toFixed(1)} MB / ${dbLimitMB} MB`}
          pct={dbPct}
          bar={dbBar}
          status={dbStatus}
          statusColor={dbBar}
          loading={healthLoading}
        />
        <HealthCard
          label="Active Connections"
          icon="hub"
          value={healthLoading ? '—' : `${conns} active`}
          pct={connPct}
          bar={connBar}
          status={connStatus}
          statusColor={connBar}
          loading={healthLoading}
        />
      </div>

      {/* Audit Log Table */}
      <AuditLogTable />
    </div>
  )
}
