import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  MoreHorizontal,
  Edit3,
  Trash2,
  Box
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Mock Data for Products
const productsData = [
  { id: 'PROD-001', name: 'Movement Official Tee', category: 'Apparel', price: 'GHS 120', stock: 450, status: 'Stable', image: '👕', color: 'var(--brand-green)' },
  { id: 'PROD-002', name: 'Premium Base Cap', category: 'Accessories', price: 'GHS 85', stock: 12, status: 'Low Stock', image: '🧢', color: 'var(--brand-gold)' },
  { id: 'PROD-003', name: 'Agenda Manifest Booklet', category: 'Education', price: 'GHS 25', stock: 1200, status: 'Processing', image: '📖', color: 'var(--brand-black)' },
  { id: 'PROD-004', name: 'Base Movement Wristband', category: 'Accessories', price: 'GHS 15', stock: 0, status: 'Critical', image: '⌚', color: 'var(--brand-red)' },
  { id: 'PROD-005', name: 'Legacy Founder Hoodie', category: 'Apparel', price: 'GHS 250', stock: 85, status: 'Stable', image: '🧥', color: 'var(--brand-green)' },
]

export default function AdminStore() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Inventory & Merch</h1>
          <p className="text-stone-500 text-sm mt-1">Manage movement merchandise, stock levels, and store performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 text-[10px] uppercase font-bold tracking-widest border-stone-200">
            Order History
          </Button>
          <Button variant="primary" className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]">
            <Plus className="w-4 h-4 mr-2" /> Add New Product
          </Button>
        </div>
      </div>

      {/* Store Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Total Sales (MTD)</p>
            <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">GHS 14,250</h3>
            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +8.4% vs last month
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Active Orders</p>
            <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">42</h3>
            <span className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tight">12 Pending Shipment</span>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Stock Items</p>
            <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">1,820</h3>
            <span className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-tight">Across 24 Products</span>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm bg-red-50/10 border-red-100">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[9px] font-black text-[var(--brand-red)] uppercase tracking-[0.2em]">Stock Alerts</p>
            <h3 className="text-2xl font-black font-meta text-[var(--brand-red)]">3</h3>
            <span className="text-[9px] font-black text-[var(--brand-red)]/60 flex items-center gap-1 mt-1 uppercase tracking-tight">
              <AlertTriangle className="w-3 h-3" /> Requires Attention
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Management Table */}
      <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xs font-black font-meta uppercase tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--brand-red)]" />
            Product Catalog
          </CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 h-9 text-xs rounded-none border-stone-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/10">
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">In Stock</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {productsData.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-stone-100 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                          {product.image}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[var(--brand-black)] uppercase tracking-tight">{product.name}</span>
                          <span className="text-[9px] font-bold text-stone-400 mt-0.5">{product.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-stone-600">{product.category}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-black text-[var(--brand-black)]">{product.price}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn(
                        "text-xs font-black",
                        product.stock === 0 ? "text-[var(--brand-red)]" : product.stock < 50 ? "text-[var(--brand-gold)]" : "text-stone-900"
                      )}>
                        {product.stock.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: product.color }} />
                        <span className={cn(
                          "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border",
                          product.status === 'Critical' 
                            ? "bg-red-50 text-[var(--brand-red)] border-red-100" 
                            : product.status === 'Low Stock'
                            ? "bg-amber-50 text-[var(--brand-gold)] border-amber-100"
                            : product.status === 'Processing'
                            ? "bg-stone-50 text-[var(--brand-black)] border-stone-200"
                            : "bg-emerald-50 text-[var(--brand-green)] border-emerald-100"
                        )}>
                          {product.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-stone-400 hover:text-[var(--brand-black)]">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-stone-400 hover:text-[var(--brand-red)]">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-stone-400">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 border border-stone-200 bg-white space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black font-meta uppercase tracking-tighter text-[var(--brand-black)]">Fulfillment Status</h4>
            <Box className="w-5 h-5 text-stone-300" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-stone-400">Shipped Orders</span>
                <span className="text-[var(--brand-green)]">82%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 overflow-hidden">
                <div className="h-full bg-[var(--brand-green)] w-[82%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-stone-400">Processing</span>
                <span className="text-[var(--brand-gold)]">12%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 overflow-hidden">
                <div className="h-full bg-[var(--brand-gold)] w-[12%]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-stone-400">Returns / Issues</span>
                <span className="text-[var(--brand-red)]">6%</span>
              </div>
              <div className="w-full h-1.5 bg-stone-100 overflow-hidden">
                <div className="h-full bg-[var(--brand-red)] w-[6%]" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-[var(--brand-red)] text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <h4 className="text-lg font-black font-meta uppercase tracking-tighter">Merch Strategy 2024</h4>
            <p className="text-xs text-red-100 leading-relaxed max-w-sm">
              Standardize regional distribution by the end of Q2. New "Chapter Founder" apparel series ready for production.
            </p>
          </div>
          <div className="relative z-10 pt-6">
            <Button variant="outline" className="h-10 text-[10px] uppercase font-bold tracking-widest border-white/20 text-white hover:bg-white/10">
              View Production Docs
            </Button>
          </div>
          <ShoppingBag className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 rotate-12" />
        </div>
      </div>
    </div>
  )
}
