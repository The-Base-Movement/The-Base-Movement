import { Activity, X, ArrowDownToLine, Heart } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import type { DonationDetail } from '@/types/admin'

interface AuditModalProps {
  isOpen: boolean
  onClose: () => void
  publicHistory: DonationDetail[]
  contributionsCount: number
  onDownload: () => void
  onContribute: () => void
}

export function AuditModal({
  isOpen,
  onClose,
  publicHistory,
  contributionsCount,
  onDownload,
  onContribute
}: AuditModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lowercase">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-white border border-stone-200 shadow-2xl overflow-hidden rounded-none flex flex-col max-h-[85vh]">
        <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Activity className="w-6 h-6 text-brand-green shadow-[0_0_10px_rgba(var(--brand-green-rgb),0.3)]" />
            <h3 className="font-bold text-stone-900 font-meta tracking-tight text-xl leading-none">capital deployment ledger</h3>
          </div>
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-stone-300 hover:text-brand-red hover:bg-brand-red/5 transition-all"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {publicHistory.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="p-6 text-micro font-medium text-stone-400 tracking-tight">contributor</th>
                  <th className="p-6 text-micro font-medium text-stone-400 tracking-tight">capital</th>
                  <th className="p-6 text-micro font-medium text-stone-400 tracking-tight">cell</th>
                  <th className="p-6 text-micro font-medium text-stone-400 tracking-tight text-right">verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {publicHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50 transition-colors group">
                    <td className="p-6">
                      <p className="text-sm font-bold text-stone-900 tracking-tight lowercase first-letter:uppercase">{item.fullName}</p>
                      <p className="text-micro text-stone-400 font-medium tracking-tight mt-1">{item.date}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-bold text-stone-900 font-meta">{item.amount}</p>
                    </td>
                    <td className="p-6">
                      <p className="text-micro font-medium text-stone-500 tracking-tight lowercase">{item.campaignTitle || 'strategic fund'}</p>
                    </td>
                    <td className="p-6 text-right">
                      <span className="inline-flex items-center gap-2 px-3 py-1 text-micro font-medium tracking-tight rounded-none bg-brand-green/10 text-brand-green lowercase">
                        verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-32 px-8 text-center bg-stone-50/50">
              <div className="w-20 h-20 bg-white shadow-sm border border-stone-100 flex items-center justify-center mx-auto mb-8 rounded-none">
                <Activity className="w-8 h-8 text-stone-200" />
              </div>
              <h4 className="text-xl font-bold text-stone-900 mb-3 font-meta tracking-tight">deployment records inactive</h4>
              <p className="text-tiny text-stone-400 max-w-sm mx-auto mb-8 font-medium tracking-tight leading-relaxed">
                no capital deployment detected for this session. support the movement cells to build a technically robust ghana.
              </p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-stone-100 flex items-center justify-between bg-stone-50 sticky bottom-0 z-10">
          <div className="flex items-center gap-3 text-micro font-medium text-stone-400 tracking-tight">
            <span className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_var(--brand-green-full)]"></span>
            {contributionsCount} deployment records secured
          </div>
          <div className="flex gap-4">
            <Button 
              variant="default"
              onClick={onDownload}
              className="px-6 h-12 border-stone-200 text-stone-400 font-medium text-micro tracking-tight rounded-none hover:text-brand-green hover:bg-stone-50 transition-all flex items-center gap-2 shadow-sm active:scale-95 lowercase"
            >
              <ArrowDownToLine className="w-4 h-4" /> download audit
            </Button>
            <Button 
              variant="solid"
              onClick={onContribute}
              className="px-8 h-12 bg-stone-900 text-white font-medium text-micro tracking-tight rounded-none hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-black/10 lowercase"
            >
              <Heart className="w-4 h-4 text-brand-green" /> contribute
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
