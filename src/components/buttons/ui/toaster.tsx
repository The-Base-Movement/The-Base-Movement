/**
 * Toaster Component
 * -------------------------------------------------------------
 * List renderer for toast notification items.
 * Placed globally to listen to toast trigger hooks and render them in the viewport.
 */

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/buttons/ui/toast'
import { useToast } from '@/hooks/use-toast'

/**
 * Toaster
 * -------------------------------------------------------------
 * Maps and mounts active toast notifications into the viewport.
 */
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
