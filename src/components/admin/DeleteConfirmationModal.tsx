import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/Button'
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
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white">
        <div>
          {/* Header/Warning Strip */}
          <div className={cn(
            "h-2 w-full",
            isPermanent ? "bg-red-600" : "bg-amber-500"
          )} />
          
          <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                isPermanent ? "bg-red-50" : "bg-amber-50"
              )}>
                {isPermanent ? (
                  <Trash2 className="w-6 h-6 text-red-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                )}
              </div>
              
              <div className="space-y-1">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-stone-900 tracking-tight leading-tight">
                    {title}
                  </DialogTitle>
                  <DialogDescription className="text-stone-500 text-sm font-medium leading-relaxed pt-1">
                    {description}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>

            {/* Item Preview Card */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 mb-8">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Target Item</p>
              <p className="text-sm font-bold text-stone-900 truncate">{itemName}</p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl text-stone-500 font-bold text-xs hover:bg-stone-100 hover:text-stone-900 transition-all normal-case"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={cn(
                  "flex-1 h-12 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-[0.98] normal-case gap-2",
                  isPermanent 
                    ? "bg-red-600 hover:bg-red-700 shadow-red-200" 
                    : "bg-stone-900 hover:bg-stone-800 shadow-stone-200"
                )}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isPermanent ? <Trash2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />
                )}
                {isLoading ? 'Processing...' : isPermanent ? 'Permanently Delete' : 'Move to Trash'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
