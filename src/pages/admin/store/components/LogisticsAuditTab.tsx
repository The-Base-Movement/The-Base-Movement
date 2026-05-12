import { History, Download, Clock, ArrowRight, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { cn } from '@/lib/utils'
import type { LogisticsAuditEntry } from '@/services/adminService'
import type { toast as toastType } from 'sonner'

interface LogisticsAuditTabProps {
  auditLogs: LogisticsAuditEntry[]
  toast: typeof toastType
}

export function LogisticsAuditTab({ auditLogs, toast }: LogisticsAuditTabProps) {
  const handleExportLogs = () => {
    try {
      const headers = ['Timestamp', 'Action', 'Resource', 'Quantity Change', 'Source', 'Destination']
      const csvData = auditLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.action,
        `"${log.productName || 'Unknown'}"`,
        log.quantityChange,
        `"${log.sourceLocation}"`,
        `"${log.destinationLocation || 'Internal'}"`
      ])
      const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Exported ${auditLogs.length} audit records.`)
    } catch {
      toast.error('Failed to export audit log.')
    }
  }

  return (
    <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground/80" />
            Audit log
          </CardTitle>
          <Button
            variant="default"
            size="lg"
            className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
            disabled={auditLogs.length === 0}
            onClick={handleExportLogs}
          >
            <Download className="w-4 h-4 mr-2" />
            Export operational metrics
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Timestamp</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Action</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Resource</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Change</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-muted-foreground/80">
                      <Clock className="w-3 h-3" />
                      <span className="text-micro font-bold">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2 py-0.5 text-micro font-bold tracking-tight border rounded-md",
                      log.action === 'DISPATCHED' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                      log.action === 'REPLENISHED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      log.action === 'RESTOCKED_CANCELLED' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-muted/10 text-on-surface/80 border-border/40"
                    )}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-on-surface tracking-tight">
                      {log.productName || 'Unknown Asset'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-xs font-bold",
                      log.quantityChange > 0 ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]"
                    )}>
                      {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-micro font-bold text-muted-foreground/80">
                      <span>{log.sourceLocation}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{log.destinationLocation || 'Internal'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Audit Cards */}
        <div className="md:hidden divide-y divide-border/40">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-muted-foreground/80">
                  <Clock className="w-3 h-3" />
                  <span className="text-micro font-bold">
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <div className={cn(
                  "px-2 py-0.5 text-micro font-bold tracking-tight border rounded-md",
                  log.action === 'DISPATCHED' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                  log.action === 'REPLENISHED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                  log.action === 'RESTOCKED_CANCELLED' ? "bg-amber-50 text-amber-700 border-amber-100" :
                  "bg-muted/5 text-on-surface/80 border-border/40"
                )}>
                  {log.action.replace('_', ' ')}
                </div>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <h4 className="text-sm font-bold text-on-surface tracking-tight">{log.productName || 'Unknown Asset'}</h4>
                  <div className="flex items-center gap-2 text-micro font-bold text-muted-foreground/80 mt-2">
                    <MapPin className="w-3 h-3" />
                    <span>{log.sourceLocation}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                    <span>{log.destinationLocation || 'Internal'}</span>
                  </div>
                </div>
                <div className={cn(
                  "text-lg font-bold",
                  log.quantityChange > 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                </div>
              </div>
            </div>
          ))}
        </div>

        {auditLogs.length === 0 && (
          <div className="p-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <History className="w-8 h-8 text-border/60" />
              <span className="text-muted-foreground/80 text-xs font-bold">No audit entries recorded.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
