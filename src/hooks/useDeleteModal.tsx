/**
 * @file useDeleteModal.tsx
 * @description Custom React hook providing configuration state and rendered layout for a reusable,
 * async-aware delete confirmation modal dialog (DeleteConfirmationModal).
 */

import { useState, useCallback } from 'react'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { toast } from 'sonner'

/**
 * Options parameters for opening the delete modal
 */
export interface DeleteOptions {
  /** Name of the item being targeted for deletion */
  itemName: string
  /** Callback function that executes the deletion API call */
  onConfirm: () => Promise<boolean | void>
  /** Custom header title of the deletion modal */
  title?: string
  /** Custom details or caution message explaining effects of deletion */
  description?: string
  /** Flag to indicate if this is a permanent deletion action */
  isPermanent?: boolean
  /** Custom message displayed on successful deletion toast */
  successMessage?: string
  /** Custom message displayed on deletion failure toast */
  errorMessage?: string
}

/**
 * Hook to manage delete modal open state, submission loaders, success/error alerts, and rendering.
 *
 * @returns Object enclosing the openDelete modal trigger and the modal React element.
 */
export function useDeleteModal() {
  const [config, setConfig] = useState<DeleteOptions | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const openDelete = useCallback((opts: DeleteOptions) => {
    setConfig(opts)
  }, [])

  const handleConfirm = async () => {
    if (!config) return
    setIsLoading(true)
    try {
      const result = await config.onConfirm()
      if (result !== false) {
        toast.success(config.successMessage ?? 'Deleted successfully.')
        setConfig(null)
      } else {
        toast.error(config.errorMessage ?? 'Delete failed.')
      }
    } catch {
      toast.error(config.errorMessage ?? 'Delete failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const modal = (
    <DeleteConfirmationModal
      isOpen={!!config}
      onClose={() => !isLoading && setConfig(null)}
      onConfirm={handleConfirm}
      title={config?.title ?? 'Confirm deletion'}
      description={config?.description ?? 'This action cannot be undone.'}
      itemName={config?.itemName ?? ''}
      isLoading={isLoading}
      isPermanent={config?.isPermanent ?? false}
    />
  )

  return { openDelete, modal }
}
