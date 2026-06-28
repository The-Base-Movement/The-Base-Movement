import { useEffect, useState } from 'react'
import { itService } from '@/services/itService'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import type { DbStats } from './system/types'
import { HealthCard } from './system/HealthCard'
import { AuditLogTable } from './system/AuditLogTable'
import { MaintenanceControl } from './system/MaintenanceControl'

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
        const data = await itService.getDbStats()
        if (data) setDbStats(data as DbStats)
      } finally {
        setHealthLoading(false)
      }
    }
    loadHealth()
  }, [])

  const dbSizeMB = (dbStats?.db_size_bytes ?? 0) / 1024 / 1024
  const storageSizeMB = (dbStats?.storage_size_bytes ?? 0) / 1024 / 1024
  const totalSizeMB = dbSizeMB + storageSizeMB
  const dbLimitMB = 500
  const totalPct = Math.min(100, (totalSizeMB / dbLimitMB) * 100)
  const conns = dbStats?.active_connections ?? 0
  const connPct = Math.min(100, (conns / 100) * 100)

  const dbBar =
    totalPct > 80
      ? 'hsl(var(--destructive))'
      : totalPct > 60
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'
  const dbStatus = `DB: ${dbSizeMB.toFixed(1)}MB · Files: ${storageSizeMB.toFixed(1)}MB`
  const connBar =
    conns > 80
      ? 'hsl(var(--destructive))'
      : conns > 50
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary))'
  const connStatus = conns > 80 ? 'High Load' : conns > 50 ? 'Elevated' : 'Normal'

  const cacheRatio = dbStats?.cache_hit_ratio ?? null
  const cacheBar =
    cacheRatio === null
      ? 'hsl(var(--on-surface-muted))'
      : cacheRatio >= 95
        ? 'hsl(var(--primary))'
        : cacheRatio >= 80
          ? 'hsl(var(--accent))'
          : 'hsl(var(--destructive))'
  const cacheStatus =
    cacheRatio === null
      ? '—'
      : cacheRatio >= 95
        ? 'Optimal'
        : cacheRatio >= 80
          ? 'Moderate'
          : 'Low — check indexes'

  return (
    <div>
      {/* Maintenance mode toggle */}
      <MaintenanceControl />

      {/* Telemetry Health Indicator panels */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 28 }}>
        <HealthCard
          label="Cache Hit Ratio"
          icon="memory"
          value={healthLoading ? '—' : cacheRatio === null ? 'No data' : `${cacheRatio}%`}
          pct={cacheRatio ?? 0}
          bar={cacheBar}
          status={cacheStatus}
          statusColor={cacheBar}
          loading={healthLoading}
        />
        <HealthCard
          label="Database & Storage"
          icon="storage"
          value={healthLoading ? '—' : `${totalSizeMB.toFixed(1)} MB / ${dbLimitMB} MB`}
          pct={totalPct}
          bar={dbBar}
          status={dbStatus}
          statusColor={
            totalPct > 80
              ? 'hsl(var(--destructive))'
              : totalPct > 60
                ? 'hsl(var(--accent))'
                : 'hsl(var(--on-surface-muted))'
          }
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
