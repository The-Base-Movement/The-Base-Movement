
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/neon-button'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  itemName: string
  isLoading?: boolean
  isPermanent?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isLoading = false,
  isPermanent = false
}: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-sm bg-white">
        <div>
          {/* Header/Warning Strip */}
          <div className={cn(
            "h-2 w-full",
            isPermanent ? "bg-destructive" : "bg-accent"
          )} />
          
          <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className={cn(
                "w-12 h-12 rounded-sm flex items-center justify-center shrink-0",
                isPermanent ? "bg-destructive/10" : "bg-accent/10"
              )}>
                {isPermanent ? (
                  <Trash2 className="w-6 h-6 text-destructive" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-accent" />
                )}
              </div>
              
              <div className="space-y-1">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-on-surface tracking-tight">
                    {title}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground/60 text-sm font-medium leading-relaxed pt-1">
                    {description}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            {/* Item Preview Card */}
            <div className="bg-muted/5 rounded-sm p-5 border border-border/40 mb-8">
              <p className="text-[10px] font-bold text-on-surface/40 tracking-tight mb-2">Target item</p>
              <p className="text-sm font-bold text-on-surface truncate tracking-tight">{itemName}</p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-14 rounded-sm text-on-surface/60 font-bold tracking-tight text-[10px] hover:bg-muted/5 hover:text-on-surface transition-all"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  "flex-1 h-14 rounded-sm text-white font-bold tracking-tight text-[10px] shadow-2xl transition-all active:scale-[0.98] gap-3",
                  isPermanent 
                    ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" 
                    : "bg-on-surface hover:bg-on-surface/90 shadow-on-surface/20"
                )}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isPermanent ? <Trash2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />
                )}
                {isLoading ? 'Processing...' : isPermanent ? 'Permanently delete' : 'Move to trash'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
