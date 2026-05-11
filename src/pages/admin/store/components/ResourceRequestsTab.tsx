import { Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { ResourceRequest } from '@/services/adminService'

interface ResourceRequestsTabProps {
  requests: ResourceRequest[]
  handleStatusUpdate: (id: string, status: ResourceRequest['status']) => Promise<void>
}

export function ResourceRequestsTab({ requests, handleStatusUpdate }: ResourceRequestsTabProps) {
  return (
    <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          Regional resource requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Region</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Items</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Requested</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Priority</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Status</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface tracking-tight">{req.region}</span>
                      <span className="text-micro font-bold text-muted-foreground/80 mt-0.5">{req.constituency || 'Regional HQ'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      {req.items.map(item => (
                        <span key={item.id} className="text-micro font-bold text-on-surface/80">
                          {item.quantity}x {item.productName || 'Unknown Product'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-muted-foreground/80">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2 py-0.5 text-micro font-bold tracking-tight rounded-full",
                      req.priority === 'Urgent' ? "bg-destructive/10 text-destructive" : req.priority === 'High' ? "bg-accent/10 text-accent" : "bg-muted/10 text-on-surface/80"
                    )}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md",
                      req.status === 'Pending' ? "bg-accent/10 text-accent border-accent/20" :
                      req.status === 'Approved' ? "bg-blue-50 text-blue-700 border-blue-100" :
                      req.status === 'Dispatched' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                      req.status === 'Delivered' ? "bg-primary/10 text-primary border-primary/20" :
                      "bg-destructive/10 text-destructive border-destructive/20"
                    )}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Select onValueChange={(v: ResourceRequest['status']) => handleStatusUpdate(req.id, v)}>
                      <SelectTrigger className="w-32 h-8 text-micro font-bold tracking-tight rounded-sm border-border/60">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm">
                        <SelectItem value="Approved">Approve</SelectItem>
                        <SelectItem value="Dispatched">Dispatch</SelectItem>
                        <SelectItem value="Delivered">Deliver</SelectItem>
                        <SelectItem value="Rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Request Cards */}
        <div className="md:hidden divide-y divide-border/40">
          {requests.map((req) => (
            <div key={req.id} className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-on-surface tracking-tight">{req.region}</h4>
                  <p className="text-micro font-bold text-muted-foreground/80 normal-case tracking-tight">{req.constituency || 'Regional HQ'}</p>
                </div>
                <div className={cn(
                  "px-2 py-0.5 text-micro font-bold tracking-tight rounded-full",
                  req.priority === 'Urgent' ? "bg-brand-red/10 text-brand-red" : "bg-muted/10 text-on-surface/80"
                )}>
                  {req.priority}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-micro font-bold text-muted-foreground/80 normal-case tracking-tight">Requested items</p>
                <div className="p-4 bg-muted/10 rounded-sm border border-border/40 space-y-2">
                  {req.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-tiny font-bold text-on-surface">{item.productName}</span>
                      <span className="text-xs font-bold text-muted-foreground/80">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-micro font-bold text-muted-foreground/80 normal-case tracking-tight">Status</p>
                  <div className={cn(
                    "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md",
                    req.status === 'Pending' ? "bg-accent/10 text-accent border-accent/20" : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    {req.status}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-micro font-bold text-muted-foreground/80 normal-case tracking-tight">Date</p>
                  <p className="text-xs font-bold text-on-surface">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-2">
                <Select onValueChange={(v: ResourceRequest['status']) => handleStatusUpdate(req.id, v)}>
                  <SelectTrigger className="w-full h-11 text-xs font-bold tracking-tight rounded-sm border-border/60">
                    <SelectValue placeholder="Update Request Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm">
                    <SelectItem value="Approved">Approve</SelectItem>
                    <SelectItem value="Dispatched">Dispatch</SelectItem>
                    <SelectItem value="Delivered">Deliver</SelectItem>
                    <SelectItem value="Rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="p-16 text-center">
            <div className="flex flex-col items-center gap-3">
              <Truck className="w-8 h-8 text-border/60" />
              <span className="text-muted-foreground/80 text-xs font-bold">No active resource requests.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
