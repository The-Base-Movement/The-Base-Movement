import { useState, useEffect } from 'react'
import { 
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
  ArrowRight,
  ArrowUpDown,
  Download,
  X,
  Trash
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { adminService, type InventoryItem, type ResourceRequest, type LogisticsAuditEntry } from '@/services/adminService'
import { toast } from 'sonner'
import { contentService } from '@/services/contentService'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'


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
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const url = await contentService.uploadImage(file, 'product-images')
      if (url) {
        setSelectedProduct(prev => {
          const currentImages = prev?.images || []
          return { 
            ...prev!, 
            images: [...currentImages, url],
            image: prev?.image || url // Set as primary if none
          }
        })
        toast.success('Product image added to gallery')
      } else {
        toast.error('Image upload failed')
      }
    } catch {
      toast.error('An error occurred during upload')
    } finally {
      setIsUploadingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  const removeImage = (url: string) => {
    setSelectedProduct(prev => ({
      ...prev!,
      images: prev?.images?.filter(img => img !== url) || []
    }))
  }

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

  const handleDelete = async () => {
    if (!deleteConfirm) return
    
    setIsDeleting(deleteConfirm.id)
    const success = await adminService.deleteInventoryItem(deleteConfirm.id, deleteConfirm.name)
    if (success) {
      handleStoreAction('REMOVE_INVENTORY', deleteConfirm.name)
      toast.success(`${deleteConfirm.name} removed from inventory`)
      fetchData()
    } else {
      toast.error("Failed to delete item")
    }
    setIsDeleting(null)
    setDeleteConfirm(null)
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
  const categories = ['All', 'Apparel', 'Accessories', 'Lifestyle', 'Stationery', 'Limited Edition']

  const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem; direction: 'asc' | 'desc' } | null>(null)

  const handleSort = (key: keyof InventoryItem) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' }
        return null
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedAndFilteredProducts = [...products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    const aVal = a[key] ?? ''
    const bVal = b[key] ?? ''
    
    let aComp = aVal
    let bComp = bVal

    if (key === 'price') {
      aComp = parseFloat((aVal as string).replace(/[^0-9.-]+/g,"")) || 0
      bComp = parseFloat((bVal as string).replace(/[^0-9.-]+/g,"")) || 0
    }

    if (aComp < bComp) return direction === 'asc' ? -1 : 1
    if (aComp > bComp) return direction === 'asc' ? 1 : -1
    return 0
  })

  const handleStoreAction = (action: string, productName: string) => {
    adminService.logAction(action, `STORE/${productName}`, 'Success')
    toast.success(`${action.replace('_', ' ')}: ${productName} recorded in Audit Vault`)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-stone-900" />
            Logistics and supply
          </h1>
          <p className="text-stone-500 text-sm mt-1">Movement inventory, merchandising, and regional distribution.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-5 py-2 text-[10px] font-bold rounded-lg transition-all",
                activeTab === 'inventory' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <Package className="w-3.5 h-3.5 mr-1.5 inline" /> Inventory
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-5 py-2 text-[10px] font-bold rounded-lg transition-all",
                activeTab === 'requests' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <Truck className="w-3.5 h-3.5 mr-1.5 inline" /> Requests
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={cn(
                "px-5 py-2 text-[10px] font-bold rounded-lg transition-all",
                activeTab === 'audit' ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <History className="w-3.5 h-3.5 mr-1.5 inline" /> Audit
            </button>
          </div>
          {activeTab === 'inventory' && (
            <Button 
              onClick={() => handleOpenModal()}
              className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add item
            </Button>
          )}
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-stone-50/50 border border-dashed border-stone-200">
          <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
          <p className="text-xs font-bold tracking-tight text-stone-400">Synchronizing movement vault...</p>
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
                  <p className="text-xs font-bold text-amber-900">Inventory alert</p>
                  <p className="text-xs text-amber-700">Some items require replenishment soon.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl">
                View alerts
              </Button>
            </div>
          )}

          {/* Store Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-stone-400 tracking-tight">Total stock value</p>
            <h3 className="text-2xl font-bold text-stone-900">
              GHS {products.reduce((acc, p) => acc + (parseFloat(p.price.replace(/[^0-9.-]+/g, '')) * p.stock), 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </h3>
            <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Estimated inventory value
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-stone-400 tracking-tight">Active requests</p>
            <h3 className="text-2xl font-bold text-stone-900">{requests.filter(r => r.status === 'Pending').length}</h3>
            <span className={cn(
              "text-[10px] font-bold mt-1",
              requests.filter(r => r.status === 'Pending').length > 0 ? "text-amber-600" : "text-stone-400"
            )}>
              {requests.filter(r => r.status === 'Pending').length > 0 ? 'Pending approval' : 'No pending requests'}
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-stone-200 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-stone-400 tracking-tight">Stock items</p>
            <h3 className="text-2xl font-bold text-stone-900">{products.reduce((acc, p) => acc + p.stock, 0).toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-stone-400 mt-1">Across {products.length} products</span>
          </CardContent>
        </Card>
        <Card className={cn(
          "rounded-xl border-stone-200 shadow-sm",
          lowStockItems.length > 0 ? "bg-red-50/10 border-red-100" : ""
        )}>
          <CardContent className="p-6 flex flex-col gap-1">
            <p className={cn(
              "text-[10px] font-bold tracking-tight",
              lowStockItems.length > 0 ? "text-red-600" : "text-stone-400"
            )}>Stock alerts</p>
            <h3 className={cn(
              "text-2xl font-bold",
              lowStockItems.length > 0 ? "text-red-600" : "text-stone-900"
            )}>{lowStockItems.length}</h3>
            <span className={cn(
              "text-[10px] font-bold flex items-center gap-1 mt-1",
              lowStockItems.length > 0 ? "text-red-600/60" : "text-stone-400"
            )}>
              <AlertTriangle className="w-3 h-3" /> {lowStockItems.length > 0 ? "Requires attention" : "All stock stable"}
            </span>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'inventory' ? (
        <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <Package className="w-4 h-4 text-stone-900" />
                Inventory
              </CardTitle>
              
              <div className="flex items-center bg-stone-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold tracking-tight transition-all",
                      activeCategory === cat ? "bg-white text-stone-900 shadow-sm" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <Input 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl border-stone-200"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/10">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Product</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight cursor-pointer hover:text-stone-600 transition-colors" onClick={() => handleSort('price')}>
                      <div className="flex items-center gap-1">Price <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight text-center cursor-pointer hover:text-stone-600 transition-colors" onClick={() => handleSort('stock')}>
                      <div className="flex items-center justify-center gap-1">In stock <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight cursor-pointer hover:text-stone-600 transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {sortedAndFilteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-stone-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center text-xl overflow-hidden">
                            {product.image?.startsWith('http') ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="grayscale group-hover:grayscale-0 transition-all">{product.image}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-stone-900 tracking-tight">{product.name}</span>
                            <span className="text-[9px] font-bold text-stone-400 mt-0.5 uppercase">#ITM-{product.id.substring(0, 6)}</span>
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
                            "px-2.5 py-1 text-[10px] font-bold tracking-tight border rounded-md",
                            product.status === 'Critical' 
                              ? "bg-red-50 text-red-600 border-red-100" 
                              : product.status === 'Low Stock'
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : product.status === 'Processing'
                              ? "bg-stone-50 text-stone-900 border-stone-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-100"
                          )}>
                            {product.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-stone-600 hover:text-[var(--brand-black)] bg-stone-100/50 hover:bg-stone-100 rounded-lg transition-all"
                            onClick={() => handleOpenModal(product)}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-stone-600 hover:text-[var(--brand-red)] bg-stone-100/50 hover:bg-stone-100 rounded-lg transition-all"
                            disabled={isDeleting === product.id}
                            onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
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
          <CardFooter className="px-6 py-4 bg-stone-50/50 border-t border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-[10px] font-bold text-stone-500 tracking-tight">Stable: {products.filter(p => p.status === 'Stable').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                <span className="text-[10px] font-bold text-stone-500 tracking-tight">Low stock: {products.filter(p => p.status === 'Low Stock').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                <span className="text-[10px] font-bold text-stone-500 tracking-tight">Critical: {products.filter(p => p.status === 'Critical').length}</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-stone-400 italic">
              Showing {sortedAndFilteredProducts.length} movement assets in the current view
            </div>
          </CardFooter>
        </Card>
      ) : activeTab === 'requests' ? (
        <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30">
            <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Regional resource requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/10">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Region</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Items</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Requested</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Priority</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-stone-900 tracking-tight">{req.region}</span>
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
                          "px-2 py-0.5 text-[10px] font-bold tracking-tight rounded-full",
                          req.priority === 'Urgent' ? "bg-red-100 text-red-700" : req.priority === 'High' ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"
                        )}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-bold tracking-tight border rounded-md",
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
                          <SelectTrigger className="w-32 h-8 text-[10px] font-bold tracking-tight rounded-lg border-stone-200">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
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
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Truck className="w-8 h-8 text-stone-200" />
                          <span className="text-stone-400 text-xs font-bold">No active resource requests from the field.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-stone-500" />
                Audit log
              </CardTitle>
              <Button
                variant="outline"
                className="h-10 px-6 text-[10px] font-bold normal-case border-stone-200 bg-white text-stone-600 shadow-sm rounded-xl hover:bg-stone-50"
                disabled={auditLogs.length === 0}
                onClick={() => {
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
                }}
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Export log
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/10">
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Action</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Resource</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Change</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 tracking-tight">Location</th>
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
                          "px-2 py-0.5 text-[10px] font-bold tracking-tight border rounded-md",
                          log.action === 'DISPATCHED' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                          log.action === 'REPLENISHED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          "bg-stone-50 text-stone-700 border-stone-100"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-stone-900 tracking-tight">
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
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <History className="w-8 h-8 text-stone-200" />
                          <span className="text-stone-400 text-xs font-bold">No audit entries recorded yet.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fulfillment Intelligence Breakdown */}
      {requests.length > 0 && (() => {
        const total = requests.length
        const delivered = requests.filter(r => r.status === 'Delivered').length
        const processing = requests.filter(r => r.status === 'Approved' || r.status === 'Dispatched').length
        const rejected = requests.filter(r => r.status === 'Rejected').length
        const deliveredPct = Math.round((delivered / total) * 100)
        const processingPct = Math.round((processing / total) * 100)
        const rejectedPct = Math.round((rejected / total) * 100)
        return (
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-stone-100 bg-stone-50/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-stone-900" />
                  Fulfillment intelligence
                </div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Live metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold tracking-tight">
                    <span className="text-stone-400 uppercase">Delivered</span>
                    <span className="text-emerald-600">{deliveredPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${deliveredPct}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold tracking-tight">
                    <span className="text-stone-400 uppercase">In progress</span>
                    <span className="text-amber-600">{processingPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${processingPct}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold tracking-tight">
                    <span className="text-stone-400 uppercase">Rejected</span>
                    <span className="text-red-600">{rejectedPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full transition-all duration-1000" style={{ width: `${rejectedPct}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      <div className="pt-8 mt-8 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-4 pb-12">
        <p className="text-[10px] font-bold text-stone-400">© 2026 The Base Movement</p>
      </div>
    </>
  )}

      {/* Add/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl border-stone-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {selectedProduct?.id ? 'Edit inventory item' : 'New movement gear'}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-stone-400">
              Configure product metadata and logistical constraints.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-[10px] font-bold tracking-tight">Name</Label>
              <Input 
                value={selectedProduct?.name || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, name: e.target.value }))}
                className="col-span-3 h-10 rounded-lg border-stone-200 text-xs" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-[10px] font-bold tracking-tight">Category</Label>
              <Select 
                value={selectedProduct?.category} 
                onValueChange={v => setSelectedProduct(prev => ({ ...prev!, category: v }))}
              >
                <SelectTrigger className="col-span-3 h-10 rounded-lg border-stone-200 text-xs font-bold">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  <SelectItem value="Apparel">Apparel</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Print">Print Material</SelectItem>
                  <SelectItem value="Digital">Digital Goods</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <Label className="text-right text-[10px] font-bold tracking-tight">Price</Label>
                <Input 
                  value={selectedProduct?.price || ''} 
                  onChange={e => setSelectedProduct(prev => ({ ...prev!, price: e.target.value }))}
                  className="h-10 rounded-lg border-stone-200 text-xs font-black" 
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label className="text-right text-[10px] font-bold tracking-tight">Stock</Label>
                <Input 
                  type="number"
                  value={selectedProduct?.stock || 0} 
                  onChange={e => setSelectedProduct(prev => ({ ...prev!, stock: parseInt(e.target.value) }))}
                  className="h-10 rounded-lg border-stone-200 text-xs font-black" 
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right text-[10px] font-bold tracking-tight mt-3">Product Gallery</Label>
              <div className="col-span-3 space-y-4">
                {/* Image Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {(selectedProduct?.images || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 bg-stone-50 group">
                      <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-stone-900/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* Upload Placeholder */}
                  <label className="aspect-square rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-stone-50 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-stone-400" />
                        <span className="text-[8px] font-bold text-stone-400">Add Image</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                   <Label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Icon Fallback</Label>
                   <Input 
                    value={selectedProduct?.image?.startsWith('http') ? '' : (selectedProduct?.image || '')} 
                    onChange={e => setSelectedProduct(prev => ({ ...prev!, image: e.target.value }))}
                    placeholder="👕, 🧢, 🎒"
                    className="h-9 rounded-lg border-stone-200 text-lg text-center w-24" 
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-xl text-[10px] font-bold tracking-tight h-10 px-6">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-xl text-[10px] font-bold tracking-tight bg-stone-900 text-white hover:bg-stone-800 h-10 px-8 min-w-[140px]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl border-stone-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Trash className="w-5 h-5" />
              </div>
              Remove item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-stone-500 leading-relaxed">
              Are you sure you want to remove <span className="text-stone-900">"{deleteConfirm?.name}"</span> from the movement catalog? This action will archive all associated inventory data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-xl text-[10px] font-bold tracking-tight h-10 px-6 border-stone-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl text-[10px] font-bold tracking-tight bg-red-600 text-white hover:bg-red-700 h-10 px-8"
            >
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
