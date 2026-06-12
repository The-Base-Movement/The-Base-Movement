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

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [drafts, setDrafts] = useState<DraftRegistration[]>([])
  const [draftCount, setDraftCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load drafts and update count
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

  // Sync a single draft registration
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

  // Trigger sync of all pending/failed drafts
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return

    const pendingDrafts = await getAllDraftRegistrations()
    if (pendingDrafts.length === 0) return

    setIsSyncing(true)
    toast.info(`PATRIOT ONLINE: Synchronizing ${pendingDrafts.length} draft registrations...`)

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
      toast.success(`Successfully uploaded ${successCount} patriot profiles.`)
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
