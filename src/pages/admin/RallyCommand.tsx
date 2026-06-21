/**
 * RallyCommand.tsx
 * ─────────────────────────────────────────────────────────────────
 * Main orchestrator for the Rally Command admin page.
 *
 * Responsibilities:
 *  - Fetches all field actions from the database via adminService
 *  - Fetches attendance records when a field action is selected
 *  - Handles manual attendance verification
 *  - Passes data down to focused sub-components (rally/ folder)
 *
 * Sub-components (src/pages/admin/rally/):
 *  RallyHeader        — Page title, breadcrumb line, and header action buttons
 *  RallyKPIs          — Top stats strip (field actions, live now, attendance, verified rate)
 *  ActionList         — Sidebar scrollable list of field actions
 *  OperationalMetrics — 3-column metric cards (verified, velocity, target achievement)
 *  AttendanceTable    — Full attendance manifest table with manual verify CTA
 *  GeofenceViewer     — Dark geo-fence visualization panel with pulse animation
 */

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
import { DotLoader } from '@/components/states'

export default function RallyCommand() {
  const [actions, setActions] = useState<FieldAction[]>([])
  const [selectedAction, setSelectedAction] = useState<FieldAction | null>(null)
  const [attendance, setAttendance] = useState<RallyAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null)

  // ── Data fetching ──────────────────────────────────────────────

  /**
   * Loads all field actions from the DB.
   * Auto-selects the first action if none is currently selected.
   * Source: adminService.getFieldActions() → public.field_actions
   */
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

  /**
   * Loads attendance records for a specific field action.
   * Re-runs whenever the selected action changes.
   * Source: adminService.getFieldActionAttendance(id) → public.rally_attendance
   */
  const fetchAttendance = useCallback(async (actionId: string) => {
    try {
      const data = await adminService.getFieldActionAttendance(actionId)
      setAttendance(data)
    } catch (error) {
      console.error('[MOBILIZATION] Failed to fetch attendance:', error)
      toast.error('Failed to synchronize attendance manifest.')
    }
  }, [])

  // Runs once on mount — loads all field actions
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActions()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchActions])

  // Re-fetches attendance whenever the selected action changes
  useEffect(() => {
    if (selectedAction) {
      const timer = setTimeout(() => {
        fetchAttendance(selectedAction.id)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [selectedAction, fetchAttendance])

  // ── Handlers ───────────────────────────────────────────────────

  /**
   * Manually verifies a single attendance record by ID.
   * Awards loyalty points to the member upon success.
   * Source: adminService.verifyRallyAttendance(id) → updates public.rally_attendance.is_verified
   */
  const handleVerify = async (id: string) => {
    setVerifying(id)
    try {
      const success = await adminService.verifyRallyAttendance(id)
      if (success) {
        toast.success('Attendance verified. Points awarded.')
        // Optimistically update local state to avoid a full re-fetch
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 0',
        }}
      >
        <DotLoader label="Initializing mobilization command…" />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="main">
      {/* Page title, accent line, description, and header CTA buttons */}
      <RallyHeader />

      {/* Top-level KPI strip: total actions, live count, attendance, verify rate */}
      <RallyKPIs actions={actions} attendance={attendance} />

      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        {/* Left sidebar: scrollable list of all field actions, highlights selected */}
        <ActionList
          actions={actions}
          selectedAction={selectedAction}
          onSelect={setSelectedAction}
        />

        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {selectedAction ? (
            <>
              {/* 3-col metric cards: verified strength, check-in velocity, target % */}
              <OperationalMetrics selectedAction={selectedAction} attendance={attendance} />

              {/* Full attendance table with search, status badges, and manual verify button */}
              <AttendanceTable
                attendance={attendance}
                selectedAction={selectedAction}
                verifying={verifying}
                onVerify={handleVerify}
              />

              {/* Dark geo-fence panel showing location name, radius, and pulse animation */}
              <GeofenceViewer selectedAction={selectedAction} />
            </>
          ) : (
            /* Empty state — shown when no field action has been selected yet */
            <div
              className="panel"
              style={{
                height: 600,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
                borderStyle: 'dashed',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 64, color: 'hsl(var(--on-surface-muted))', opacity: 0.1 }}
              >
                priority_high
              </span>
              <div style={{ textAlign: 'center', maxWidth: 320 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    margin: 0,
                  }}
                >
                  Deployment Pending
                </p>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    marginTop: 8,
                    lineHeight: 1.6,
                  }}
                >
                  Select a field action from the operational log to view tactical metrics and member
                  manifests.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
