import { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Edit3,
  Trash2,
  Box,
  Truck,
  History,
  Clock,
  ArrowRight
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
import { adminService, type InventoryItem, type ResourceRequest, type LogisticsAuditEntry } from '@/services/adminService'
import { toast } from 'sonner'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

// Mock Data for Products
export default function AdminStore() {
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [requests, setRequests] = useState<ResourceRequest[]>([])
  const [auditLogs, setAuditLogs] = useState<LogisticsAuditEntry[]>([])
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'audit'>('inventory')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Partial<InventoryItem> | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [inv, reqs, logs] = await Promise.all([
        adminService.getInventory(),
        adminService.getResourceRequests(),
        adminService.getLogisticsAudit()
      ])
      setProducts(inv)
      setRequests(reqs)
      setAuditLogs(logs)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (product?: InventoryItem) => {
    setSelectedProduct(product || {
      name: '',
      category: 'Apparel',
      price: 'GHS 0.00',
      stock: 0,
      status: 'Stable',
      image: '👕',
      color: '#000000'
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!selectedProduct?.name || !selectedProduct?.price) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    let success = false

    if ('id' in selectedProduct && selectedProduct.id) {
      success = await adminService.updateInventoryItem(selectedProduct.id, selectedProduct)
    } else {
      success = await adminService.addInventoryItem(selectedProduct as Omit<InventoryItem, 'id'>)
    }

    if (success) {
      handleStoreAction(selectedProduct.id ? 'UPDATE_INVENTORY' : 'ADD_INVENTORY', selectedProduct.name!)
      toast.success(selectedProduct.id ? "Product updated" : "Product added to movement catalog")
      setIsModalOpen(false)
      fetchData()
    } else {
      toast.error("Failed to save product")
    }
    setIsSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the movement catalog?`)) return
    
    setIsDeleting(id)
    const success = await adminService.deleteInventoryItem(id, name)
    if (success) {
      handleStoreAction('REMOVE_INVENTORY', name)
      toast.success(`${name} removed from inventory`)
      fetchData()
    } else {
      toast.error("Failed to delete item")
    }
    setIsDeleting(null)
  }

  const handleStatusUpdate = async (id: string, status: ResourceRequest['status']) => {
    const success = await adminService.updateResourceRequestStatus(id, status)
    if (success) {
      handleStoreAction('STATUS_UPDATE', `Request ${id.slice(0, 8)}`)
      toast.success(`Request marked as ${status}`)
      fetchData()
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const lowStockItems = products.filter(p => p.stock < 50 && p.stock > 0)
  const categories = ['All', ...new Set(products.map(p => p.category))]

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleStoreAction = (action: string, productName: string) => {
    adminService.logAction(action, `STORE/${productName}`, 'Success')
    toast.success(`${action.replace('_', ' ')}: ${productName} recorded in Audit Vault`)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Logistics & Supply</h1>
          <p className="text-stone-500 text-sm mt-1">Movement inventory, merchandising, and regional distribution.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-stone-100 p-1 mr-2">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'inventory' ? "bg-white text-[var(--brand-black)] shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <Package className="w-3.5 h-3.5 mr-2 inline" /> Inventory
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'requests' ? "bg-white text-[var(--brand-black)] shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <Truck className="w-3.5 h-3.5 mr-2 inline" /> Requests
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={cn(
                "px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'audit' ? "bg-white text-[var(--brand-black)] shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <History className="w-3.5 h-3.5 mr-2 inline" /> Audit Hub
            </button>
          </div>
          {activeTab === 'inventory' && (
            <Button 
              onClick={() => handleOpenModal()}
              className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)] text-white hover:bg-stone-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-stone-50/50 border border-dashed border-stone-200">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Synchronizing Movement Vault...</p>
        </div>
      ) : (
        <>
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-900">Inventory Alert</p>
                  <p className="text-xs text-amber-700">{lowStockItems.length} items require immediate replenishment to maintain movement visibility.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-[9px] font-black uppercase border-amber-200 text-amber-700 hover:bg-amber-100">
                View Alerts
              </Button>
            </div>
          )}

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
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Active Requests</p>
            <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">{requests.filter(r => r.status === 'Pending').length}</h3>
            <span className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tight">Pending Approval</span>
          </CardContent>
        </Card>
        <Card className="rounded-none border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Stock Items</p>
            <h3 className="text-2xl font-black font-meta text-[var(--brand-black)]">{products.reduce((acc, p) => acc + p.stock, 0).toLocaleString()}</h3>
            <span className="text-[9px] font-bold text-stone-400 mt-1 uppercase tracking-tight">Across {products.length} Products</span>
          </CardContent>
        </Card>
        <Card className={cn(
          "rounded-none border-stone-200 shadow-sm",
          lowStockItems.length > 0 ? "bg-red-50/10 border-red-100" : ""
        )}>
          <CardContent className="p-6 flex flex-col gap-1">
            <p className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em]",
              lowStockItems.length > 0 ? "text-[var(--brand-red)]" : "text-stone-400"
            )}>Stock Alerts</p>
            <h3 className={cn(
              "text-2xl font-black font-meta",
              lowStockItems.length > 0 ? "text-[var(--brand-red)]" : "text-[var(--brand-black)]"
            )}>{lowStockItems.length}</h3>
            <span className={cn(
              "text-[9px] font-black flex items-center gap-1 mt-1 uppercase tracking-tight",
              lowStockItems.length > 0 ? "text-[var(--brand-red)]/60" : "text-stone-400"
            )}>
              <AlertTriangle className="w-3 h-3" /> {lowStockItems.length > 0 ? "Requires Attention" : "All Stock Stable"}
            </span>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'inventory' ? (
        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <CardTitle className="text-xs font-black font-meta uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--brand-red)]" />
                National Inventory Vault
              </CardTitle>
              
              <div className="flex items-center bg-stone-100 p-1 rounded-none overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 text-[9px] font-black uppercase tracking-tight transition-all",
                      activeCategory === cat ? "bg-white text-[var(--brand-black)] shadow-sm" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <Input 
                  placeholder="Search vault..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-none border-stone-200"
                />
              </div>
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
                  {filteredProducts.map((product) => (
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-stone-400 hover:text-[var(--brand-black)]"
                            onClick={() => handleOpenModal(product)}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-stone-400 hover:text-[var(--brand-red)]"
                            disabled={isDeleting === product.id}
                            onClick={() => handleDelete(product.id, product.name)}
                          >
                            {isDeleting === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
      ) : activeTab === 'requests' ? (
        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30">
            <CardTitle className="text-xs font-black font-meta uppercase tracking-widest flex items-center gap-2">
              <Truck className="w-4 h-4 text-[var(--brand-green)]" />
              Regional Resource Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/10">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Region</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Items</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Requested</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Priority</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-stone-900 uppercase tracking-tight">{req.region}</span>
                          <span className="text-[9px] font-bold text-stone-400 mt-0.5">{req.constituency || 'Regional HQ'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          {req.items.map(item => (
                            <span key={item.id} className="text-[10px] font-bold text-stone-600">
                              {item.quantity}x {item.productName || 'Unknown Product'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-stone-500">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full",
                          req.priority === 'Urgent' ? "bg-red-100 text-red-700" : req.priority === 'High' ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"
                        )}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border",
                          req.status === 'Pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                          req.status === 'Approved' ? "bg-blue-50 text-blue-700 border-blue-100" :
                          req.status === 'Dispatched' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                          req.status === 'Delivered' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          "bg-red-50 text-red-700 border-red-100"
                        )}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Select onValueChange={(v: ResourceRequest['status']) => handleStatusUpdate(req.id, v)}>
                          <SelectTrigger className="w-32 h-8 text-[9px] font-black uppercase tracking-widest rounded-none border-stone-200">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-none">
                            <SelectItem value="Approved">Approve</SelectItem>
                            <SelectItem value="Dispatched">Dispatch</SelectItem>
                            <SelectItem value="Delivered">Deliver</SelectItem>
                            <SelectItem value="Rejected">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">
                        No active resource requests from the field.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-none border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30">
            <CardTitle className="text-xs font-black font-meta uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-stone-500" />
              Logistics Audit Vault
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/10">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Action</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Resource</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Change</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-stone-400">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold">
                            {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border",
                          log.action === 'DISPATCHED' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                          log.action === 'REPLENISHED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          "bg-stone-50 text-stone-700 border-stone-100"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-stone-900 uppercase tracking-tight">
                          {log.productName || 'Unknown Asset'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "text-xs font-black",
                          log.quantityChange > 0 ? "text-[var(--brand-green)]" : "text-[var(--brand-red)]"
                        )}>
                          {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-stone-500">
                          <span>{log.sourceLocation}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{log.destinationLocation || 'Internal'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">
                        The Logistics Vault is empty. No movements recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
    </>
  )}

      {/* Add/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-none border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-black font-meta uppercase tracking-tighter">
              {selectedProduct?.id ? 'Edit Inventory Item' : 'New Movement Gear'}
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold text-stone-400">
              Configure product metadata and logistical constraints.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-[10px] font-black uppercase tracking-widest">Name</Label>
              <Input 
                value={selectedProduct?.name || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, name: e.target.value }))}
                className="col-span-3 h-10 rounded-none border-stone-200 text-xs" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-[10px] font-black uppercase tracking-widest">Category</Label>
              <Select 
                value={selectedProduct?.category} 
                onValueChange={v => setSelectedProduct(prev => ({ ...prev!, category: v }))}
              >
                <SelectTrigger className="col-span-3 h-10 rounded-none border-stone-200 text-xs font-bold">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="Apparel">Apparel</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Print">Print Material</SelectItem>
                  <SelectItem value="Digital">Digital Goods</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label className="text-right text-[10px] font-black uppercase tracking-widest">Price</Label>
                <Input 
                  value={selectedProduct?.price || ''} 
                  onChange={e => setSelectedProduct(prev => ({ ...prev!, price: e.target.value }))}
                  className="h-10 rounded-none border-stone-200 text-xs font-black" 
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label className="text-right text-[10px] font-black uppercase tracking-widest">Stock</Label>
                <Input 
                  type="number"
                  value={selectedProduct?.stock || 0} 
                  onChange={e => setSelectedProduct(prev => ({ ...prev!, stock: parseInt(e.target.value) }))}
                  className="h-10 rounded-none border-stone-200 text-xs font-black" 
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-[10px] font-black uppercase tracking-widest">Image (Emoji)</Label>
              <Input 
                value={selectedProduct?.image || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, image: e.target.value }))}
                placeholder="👕, 🧢, 🎒"
                className="col-span-3 h-10 rounded-none border-stone-200 text-lg text-center" 
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-none text-[10px] font-black uppercase tracking-widest h-11 px-6">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-none text-[10px] font-black uppercase tracking-widest bg-[var(--brand-black)] text-white hover:bg-stone-800 h-11 px-8 min-w-[140px]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
