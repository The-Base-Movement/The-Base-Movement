import { useState, useCallback } from 'react'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { toast } from 'sonner'

export interface DeleteOptions {
  itemName: string
  onConfirm: () => Promise<boolean | void>
  title?: string
  description?: string
  isPermanent?: boolean
  successMessage?: string
  errorMessage?: string
}

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
