import { useState, useEffect, useCallback } from 'react'
import { adminService } from '@/services/adminService'
import type { FieldAction, RallyAttendance } from '@/types/admin'
import { toast } from 'sonner'

import { RallyHeader } from './rally/RallyHeader'
import { RallyKPIs } from './rally/RallyKPIs'
import { ActionList } from './rally/ActionList'
import { OperationalMetrics } from './rally/OperationalMetrics'
import { AttendanceTable } from './rally/AttendanceTable'
import { GeofenceViewer } from './rally/GeofenceViewer'

export default function RallyCommand() {
  const [actions, setActions] = useState<FieldAction[]>([])
  const [selectedAction, setSelectedAction] = useState<FieldAction | null>(null)
  const [attendance, setAttendance] = useState<RallyAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)

  // ── Data fetching ──────────────────────────────────────────────
  const fetchActions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getFieldActions()
      setActions(data)
      if (data.length > 0 && !selectedAction) setSelectedAction(data[0])
    } catch (error) {
      console.error('[MOBILIZATION] Failed to fetch field actions:', error)
      toast.error('Failed to synchronize field actions.')
    } finally {
      setLoading(false)
    }
  }, [selectedAction])

  const fetchAttendance = useCallback(async (actionId: string) => {
    try {
      const data = await adminService.getFieldActionAttendance(actionId)
      setAttendance(data)
    } catch (error) {
      console.error('[MOBILIZATION] Failed to fetch attendance:', error)
      toast.error('Failed to synchronize attendance manifest.')
    }
  }, [])

  useEffect(() => { fetchActions() }, [fetchActions])
  useEffect(() => {
    if (selectedAction) fetchAttendance(selectedAction.id)
  }, [selectedAction, fetchAttendance])

  // ── Handlers ───────────────────────────────────────────────────
  const handleVerify = async (id: string) => {
    setVerifying(id)
    try {
      const success = await adminService.verifyRallyAttendance(id)
      if (success) {
        toast.success('Attendance verified. Points awarded.')
        setAttendance((prev) => prev.map((a) => (a.id === id ? { ...a, is_verified: true } : a)))
      }
    } catch (error) {
      console.error('[MOBILIZATION] Manual verification failed:', error)
      toast.error('Verification failed.')
    } finally {
      setVerifying(null)
    }
  }

  // ── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 48, color: 'hsl(var(--primary))' }}>sync</span>
        <p style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginTop: 16 }}>
          Initializing mobilization command...
        </p>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="main">
      <RallyHeader />

      <RallyKPIs actions={actions} attendance={attendance} />

      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        <ActionList actions={actions} selectedAction={selectedAction} onSelect={setSelectedAction} />

        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {selectedAction ? (
            <>
              <OperationalMetrics selectedAction={selectedAction} attendance={attendance} />
              <AttendanceTable
                attendance={attendance}
                selectedAction={selectedAction}
                verifying={verifying}
                onVerify={handleVerify}
              />
              <GeofenceViewer selectedAction={selectedAction} />
            </>
          ) : (
            <div className="panel" style={{ height: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, borderStyle: 'dashed' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'hsl(var(--on-surface-muted))', opacity: 0.1 }}>priority_high</span>
              <div style={{ textAlign: 'center', maxWidth: 320 }}>
                <p style={{ fontSize: 14, fontWeight: 900, margin: 0 }}>Deployment Pending</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', marginTop: 8, lineHeight: 1.6 }}>
                  Select a field action from the operational log to view tactical metrics and member manifests.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
