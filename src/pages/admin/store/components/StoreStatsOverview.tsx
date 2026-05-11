import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Truck, Package, AlertTriangle, Box } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryItem, ResourceRequest } from '@/services/adminService'

interface StoreStatsOverviewProps {
  products: InventoryItem[]
  requests: ResourceRequest[]
  lowStockItems: InventoryItem[]
}

export function StoreStatsOverview({ products, requests, lowStockItems }: StoreStatsOverviewProps) {
  const stockValue = products.reduce((acc, p) => acc + (parseFloat(p.price.replace(/[^0-9.-]+/g, '')) * p.stock), 0)
  const pendingRequests = requests.filter(r => r.status === 'Pending').length
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0)

  const total = requests.length
  const delivered = requests.filter(r => r.status === 'Delivered').length
  const processing = requests.filter(r => r.status === 'Approved' || r.status === 'Dispatched').length
  const rejected = requests.filter(r => r.status === 'Rejected').length
  
  const deliveredPct = total > 0 ? Math.round((delivered / total) * 100) : 0
  const processingPct = total > 0 ? Math.round((processing / total) * 100) : 0
  const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0

  return (
    <>
      <div className="grid-stats mb-12" style={{ '--grid-min-width': '220px' } as React.CSSProperties}>
        <Card className="rounded-sm border-border/60 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-micro font-bold text-muted-foreground/60 uppercase tracking-widest">Stock value</span>
              <TrendingUp className="w-4 h-4 text-primary/20" />
            </div>
            <p className="text-3xl font-bold text-on-surface mb-1">
              GHS {stockValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p className="text-tiny font-bold tracking-tight text-muted-foreground/60 mt-1.5">Movement asset valuation</p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border/60 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-micro font-bold text-muted-foreground/60 uppercase tracking-widest">Active requests</span>
              <Truck className="w-4 h-4 text-primary/20" />
            </div>
            <p className="text-3xl font-bold text-on-surface mb-1">{pendingRequests}</p>
            <p className={cn(
              "text-tiny font-bold tracking-tight mt-1.5",
              pendingRequests > 0 ? "text-accent" : "text-muted-foreground/60"
            )}>
              {pendingRequests > 0 ? 'Pending HQ approval' : 'All requests processed'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border/60 shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-micro font-bold text-muted-foreground/60 uppercase tracking-widest">Stock units</span>
              <Package className="w-4 h-4 text-muted-foreground/10" />
            </div>
            <p className="text-3xl font-bold text-on-surface mb-1">{totalStockUnits.toLocaleString()}</p>
            <p className="text-tiny font-bold tracking-tight text-muted-foreground/60 mt-1.5">Across {products.length} catalog items</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "rounded-sm border-border/60 shadow-sm bg-white",
          lowStockItems.length > 0 ? "border-destructive/40" : ""
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className={cn(
                "text-micro font-bold uppercase tracking-widest",
                lowStockItems.length > 0 ? "text-destructive" : "text-muted-foreground/60"
              )}>Inventory alerts</span>
              <AlertTriangle className={cn("w-4 h-4", lowStockItems.length > 0 ? "text-destructive/20" : "text-muted-foreground/10")} />
            </div>
            <p className={cn(
              "text-3xl font-bold mb-1",
              lowStockItems.length > 0 ? "text-destructive" : "text-on-surface"
            )}>{lowStockItems.length}</p>
            <p className={cn(
              "text-tiny font-bold tracking-tight mt-1.5",
              lowStockItems.length > 0 ? "text-destructive/60" : "text-muted-foreground/60"
            )}>
              {lowStockItems.length > 0 ? "Replenishment required" : "Supply chain stable"}
            </p>
          </CardContent>
        </Card>
      </div>

      {requests.length > 0 && (
        <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden mb-12">
          <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
            <CardTitle className="text-sm font-bold tracking-tight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-on-surface" />
                Fulfillment intelligence
              </div>
              <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">Live metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="flex justify-between text-micro font-bold tracking-tight">
                  <span className="text-muted-foreground/80">Delivered</span>
                  <span className="text-emerald-600">{deliveredPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${deliveredPct}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-micro font-bold tracking-tight">
                  <span className="text-muted-foreground/80">In progress</span>
                  <span className="text-amber-600">{processingPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${processingPct}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-micro font-bold tracking-tight">
                  <span className="text-muted-foreground/80">Rejected</span>
                  <span className="text-red-600">{rejectedPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full transition-all duration-1000" style={{ width: `${rejectedPct}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
