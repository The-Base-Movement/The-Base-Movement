/**
 * @file useOfflineSync.ts
 * @description Hook to monitor network status (online/offline) and manage syncing of draft registrations
 * stored in IndexedDB (offline database). Fires toast status notifications upon connectivity events
 * and registration synchronization success/failure.
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getAllDraftRegistrations,
  deleteDraftRegistration,
  updateDraftRegistrationStatus,
  getDraftRegistrationCount,
  type DraftRegistration,
} from '@/utils/offlineDb'
import { registrationService } from '@/services/registrationService'
import { adminService } from '@/services/adminService'

/**
 * Custom React hook managing resilient offline registration workflows.
 * Monitors network availability changes, caches pending registrations locally,
 * and retries syncing queued registrations when network is active.
 *
 * @returns State properties (online flags, draft items, synchronization loaders) and sync triggers.
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [drafts, setDrafts] = useState<DraftRegistration[]>([])
  const [draftCount, setDraftCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  /**
   * Loads all draft registrations from IndexedDB and updates draftCount state.
   */
  const loadDrafts = useCallback(async () => {
    try {
      const allDrafts = await getAllDraftRegistrations()
      setDrafts(allDrafts)
      const count = await getDraftRegistrationCount()
      setDraftCount(count)
    } catch (error) {
      console.error('[OFFLINE SYNC] Failed to load drafts:', error)
    }
  }, [])

  /**
   * Syncs a single draft registration to the backend database service.
   * Updates state status to 'syncing' during transaction, and deletes local record upon success.
   *
   * @param draft - Draft registration record containing form inputs and uploaded document assets.
   * @returns Boolean indicating if the sync succeeded.
   */
  const syncSingleDraft = useCallback(
    async (draft: DraftRegistration): Promise<boolean> => {
      try {
        await updateDraftRegistrationStatus(draft.id, 'syncing')
        await loadDrafts()

        const result = await registrationService.submit({
          platform: draft.platform,
          formData: draft.formData,
          photoUrl: draft.photoUrl,
          selfieUrl: draft.selfieUrl,
          croppedAreaPixels: draft.croppedAreaPixels,
          usedScan: draft.usedScan,
          refParam: draft.refParam,
          registeredBy: adminService.getCurrentUser()?.id || null,
        })

        // If successful, delete the draft and toast success
        await deleteDraftRegistration(draft.id)
        toast.success(
          `SYNC SUCCESS: ${draft.formData.fullName} is now registered! ID: ${result.regNo}`,
          {
            duration: 8000,
          }
        )
        return true
      } catch (error) {
        const errorMsg = (error as Error)?.message || 'Submission failed'
        await updateDraftRegistrationStatus(draft.id, 'failed', errorMsg)
        toast.error(`SYNC FAILED for ${draft.formData.fullName}: ${errorMsg}`, {
          duration: 8000,
        })
        return false
      }
    },
    [loadDrafts]
  )

  /**
   * Iterates through all cached offline drafts and attempts upload synchronization.
   */
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return

    const pendingDrafts = await getAllDraftRegistrations()
    if (pendingDrafts.length === 0) return

    setIsSyncing(true)
    toast.info(`COMPATRIOT ONLINE: Synchronizing ${pendingDrafts.length} draft registrations...`)

    let successCount = 0
    for (const draft of pendingDrafts) {
      const success = await syncSingleDraft(draft)
      if (success) {
        successCount++
      }
    }

    setIsSyncing(false)
    await loadDrafts()

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} compatriot profiles.`)
    }
  }, [isSyncing, loadDrafts, syncSingleDraft])

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connection restored! Switched to online mode.')
      triggerSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Connection lost. Platform entered resilient offline mode.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load initial drafts asynchronously to avoid triggering setState warning in effect
    const timer = setTimeout(() => {
      loadDrafts()
    }, 0)

    // Periodically check if there are drafts to sync in case connection is restored silently
    const interval = setInterval(() => {
      if (navigator.onLine && !isSyncing) {
        getDraftRegistrationCount().then((count) => {
          if (count > 0) {
            triggerSync()
          }
        })
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [loadDrafts, triggerSync, isSyncing])

  return {
    isOnline,
    drafts,
    draftCount,
    isSyncing,
    loadDrafts,
    triggerSync,
  }
}
