import { Search } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AuditLogEntry } from '@/services/adminService'

interface AuditLogTabProps {
  auditSearch: string
  setAuditSearch: (val: string) => void
  auditFilter: string
  setAuditFilter: (val: string) => void
  auditResourceFilter: string
  setAuditResourceFilter: (val: string) => void
  filteredLogs: AuditLogEntry[]
  handleExportLogs: () => void
}

export function AuditLogTab({
  auditSearch,
  setAuditSearch,
  auditFilter,
  setAuditFilter,
  auditResourceFilter,
  setAuditResourceFilter,
  filteredLogs,
  handleExportLogs
}: AuditLogTabProps) {
  return (
    <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-stone-900">Audit Log</CardTitle>
          <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Full traceability of administrative decisions and system modifications.</CardDescription>
        </div>
        <Button 
          variant="default" 
          size="sm"
          onClick={handleExportLogs}
          className="h-10 px-6 text-micro font-bold capitalize tracking-tight border-stone-200 rounded-sm hover:bg-stone-50 transition-all active:scale-95"
        >
          Export Audit report
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row gap-4 p-6 bg-stone-50/50 border-b border-stone-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <Input 
              placeholder="Search by action or resource..." 
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="pl-9 h-9 text-tiny border-stone-200 bg-white rounded-sm focus:ring-0"
            />
          </div>
          <select 
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            className="h-9 px-3 text-tiny font-bold text-stone-600 border border-stone-200 bg-white rounded-sm focus:ring-0 outline-none"
          >
            <option>All Status</option>
            <option>Success</option>
            <option>Warning</option>
            <option>Failure</option>
          </select>

          <select 
            value={auditResourceFilter}
            onChange={(e) => setAuditResourceFilter(e.target.value)}
            className="h-9 px-3 text-tiny font-bold text-stone-600 border border-stone-200 bg-white rounded-sm focus:ring-0 outline-none"
          >
            <option>All Resources</option>
            <option>MEMBERS</option>
            <option>CHAPTERS</option>
            <option>STORE</option>
            <option>SYSTEM</option>
            <option>BLOGS</option>
          </select>
        </div>


        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50/30 border-b border-stone-100">
                <th className="p-4 pl-8 text-micro font-bold tracking-tight text-stone-400">Timestamp</th>
                <th className="p-4 text-micro font-bold tracking-tight text-stone-400">Admin</th>
                <th className="p-4 text-micro font-bold tracking-tight text-stone-400">Action</th>
                <th className="p-4 pr-8 text-right text-micro font-bold tracking-tight text-stone-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredLogs.length > 0 ? (
                filteredLogs.slice(0, 15).map((log) => (

                  <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="p-4 pl-8 text-micro font-medium text-stone-400">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 text-xs font-bold text-stone-900">{log.adminName.split(' ')[0]}</td>
                    <td className="p-4 text-tiny font-medium text-stone-600 italic">{log.action.toLowerCase()}</td>
                    <td className="p-4 pr-8 text-right">
                      <div className={cn("w-1.5 h-1.5 rounded-full inline-block", 
                        log.status === 'Success' ? "bg-emerald-500" : 
                        log.status === 'Warning' ? "bg-amber-500" : "bg-destructive"
                      )} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-stone-400 text-xs italic">No activity logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
