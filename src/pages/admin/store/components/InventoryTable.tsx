import { Package, Search, ArrowUpDown, Edit3, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { InventoryItem } from '@/services/adminService'

interface InventoryTableProps {
  products: InventoryItem[]
  sortedAndFilteredProducts: InventoryItem[]
  categories: string[]
  activeCategory: string
  setActiveCategory: (cat: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleSort: (key: keyof InventoryItem) => void
  handleOpenModal: (product?: InventoryItem) => void
  setDeleteConfirm: (confirm: { id: string, name: string } | null) => void
  isDeleting: string | null
}

export function InventoryTable({
  products,
  sortedAndFilteredProducts,
  categories,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  handleSort,
  handleOpenModal,
  setDeleteConfirm,
  isDeleting
}: InventoryTableProps) {
  return (
    <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
      <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
            <Package className="w-4 h-4 text-on-surface" />
            Inventory
          </CardTitle>
          
          <div className="flex items-center bg-muted/10 p-1 rounded-sm overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "primary" : "ghost"}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-1.5 text-micro font-bold tracking-tight transition-all h-auto",
                  activeCategory === cat ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
                )}
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/80" />
            <Input 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-sm border-border/60"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Product</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight">Category</th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight cursor-pointer hover:text-on-surface/80 transition-colors" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">Price <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight text-center cursor-pointer hover:text-on-surface/80 transition-colors" onClick={() => handleSort('stock')}>
                  <div className="flex items-center justify-center gap-1">In stock <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-micro font-bold text-muted-foreground/80 tracking-tight cursor-pointer hover:text-on-surface/80 transition-colors" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sortedAndFilteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-muted/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted/10 rounded-sm flex items-center justify-center text-xl overflow-hidden">
                        {product.image?.startsWith('http') ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                        ) : (
                          <span className="grayscale group-hover:grayscale-0 transition-all">{product.image}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface tracking-tight">{product.name}</span>
                        <span className="text-micro font-bold text-muted-foreground/80 mt-0.5 normal-case">#ITM-{product.id.substring(0, 6)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-on-surface/80">{product.category}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-on-surface">{product.price}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn(
                      "text-xs font-bold",
                      product.stock === 0 ? "text-brand-red" : product.stock < 50 ? "text-accent" : "text-on-surface"
                    )}>
                      {product.stock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: product.color }} />
                      <span className={cn(
                          "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-md",
                          product.status === 'Critical' 
                            ? "bg-destructive/10 text-destructive border-destructive/20" 
                            : product.status === 'Low Stock'
                            ? "bg-accent/10 text-accent border-accent/20"
                            : product.status === 'Processing'
                            ? "bg-muted/10 text-on-surface border-border/60"
                            : "bg-primary/10 text-primary border-primary/20"
                        )}>
                        {product.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="gold" 
                        size="icon" 
                        className="w-10 h-10 rounded-sm transition-all shadow-sm active:scale-95"
                        onClick={() => handleOpenModal(product)}
                      >
                        <Edit3 className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="w-10 h-10 rounded-sm transition-all shadow-sm active:scale-95"
                        disabled={isDeleting === product.id}
                        onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
                      >
                        {isDeleting === product.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-border/40">
          {sortedAndFilteredProducts.map((product) => (
            <div key={product.id} className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted/10 rounded-sm flex items-center justify-center text-2xl border border-border/60 overflow-hidden shrink-0">
                    {product.image?.startsWith('http') ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                    ) : (
                      <span>{product.image}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-on-surface tracking-tight">{product.name}</h4>
                    <p className="text-micro font-bold text-muted-foreground/80 tracking-tight normal-case">#ITM-{product.id.substring(0, 6)}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2.5 py-1 text-micro font-bold tracking-tight border rounded-full",
                  product.status === 'Critical' ? "bg-destructive/10 text-destructive border-destructive/20" :
                  product.status === 'Low Stock' ? "bg-accent/10 text-accent border-accent/20" :
                  "bg-primary/10 text-primary border-primary/20"
                )}>
                  {product.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/10 rounded-sm border border-border/40">
                  <p className="text-micro font-bold text-muted-foreground/80 tracking-tight mb-1">Price</p>
                  <p className="text-sm font-bold text-on-surface">{product.price}</p>
                </div>
                <div className="p-4 bg-muted/10 rounded-sm border border-border/40">
                  <p className="text-micro font-bold text-muted-foreground/80 tracking-tight mb-1">Stock</p>
                  <p className={cn(
                    "text-sm font-bold",
                    product.stock < 50 ? "text-accent" : "text-on-surface"
                  )}>{product.stock.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  variant="gold" 
                  className="flex-1 h-12 rounded-sm text-micro font-bold tracking-tight transition-all shadow-sm active:scale-95"
                  onClick={() => handleOpenModal(product)}
                >
                  <Edit3 className="w-4 h-4 mr-2" /> Edit Asset
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-12 w-12 rounded-sm transition-all shadow-sm active:scale-95"
                  onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="px-6 py-4 bg-muted/30 border-t border-border/40 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.4)]" />
            <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">Stable: {products.filter(p => p.status === 'Stable').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]" />
            <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">Low stock: {products.filter(p => p.status === 'Low Stock').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(var(--destructive-rgb),0.4)]" />
            <span className="text-micro font-bold text-muted-foreground/80 tracking-tight">Critical: {products.filter(p => p.status === 'Critical').length}</span>
          </div>
        </div>
        <div className="text-micro font-bold text-muted-foreground/80 italic">
          Showing {sortedAndFilteredProducts.length} movement assets in the current view
        </div>
      </CardFooter>
    </Card>
  )
}