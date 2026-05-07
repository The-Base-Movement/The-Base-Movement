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
  Trash,
  MapPin
} from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { logisticsService } from '@/services/logisticsService'
import { Button } from '@/components/ui/neon-button'
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
    try {
      const success = await logisticsService.deleteInventoryItem(deleteConfirm.id)
      if (success) {
        handleStoreAction('TRASH_INVENTORY', deleteConfirm.name)
        toast.success(`"${deleteConfirm.name}" moved to trash vault`)
        fetchData()
      } else {
        toast.error("Failed to move item to trash")
      }
    } catch {
      toast.error("An error occurred during deletion")
    } finally {
      setIsDeleting(null)
      setDeleteConfirm(null)
    }
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
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-on-surface" />
            Logistics and supply
          </h1>
          <p className="text-muted-foreground/80 text-sm mt-1">Movement inventory, merchandising, and regional distribution.</p>
        </div>
        <div className="flex items-center gap-4">
        <div className="flex bg-muted/10 p-1 rounded-sm">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-5 py-2 text-[10px] font-bold rounded-lg transition-all",
                activeTab === 'inventory' ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              )}
            >
              <Package className="w-3.5 h-3.5 mr-1.5 inline" /> Inventory
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-5 py-2 text-[10px] font-bold rounded-lg transition-all",
                activeTab === 'requests' ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              )}
            >
              <Truck className="w-3.5 h-3.5 mr-1.5 inline" /> Requests
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={cn(
                "px-5 py-2 text-[10px] font-bold rounded-lg transition-all",
                activeTab === 'audit' ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              )}
            >
              <History className="w-3.5 h-3.5 mr-1.5 inline" /> Audit
            </button>
          </div>
          {activeTab === 'inventory' && (
            <Button 
              variant="primary"
              size="lg"
              onClick={() => handleOpenModal()}
              className="rounded-sm text-[10px] font-black uppercase tracking-[0.3em] px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" /> Establish Asset
            </Button>
          )}
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-muted/30 border border-dashed border-border/60">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/60" />
          <p className="text-xs font-bold tracking-tight text-muted-foreground/80">Synchronizing movement vault...</p>
        </div>
      ) : (
        <>
          {lowStockItems.length > 0 && (
            <div className="bg-accent/10 border-l-4 border-accent p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Inventory alert</p>
                  <p className="text-xs text-on-surface/60">Some items require replenishment soon.</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-8 text-[10px] font-black uppercase tracking-[0.3em] border-accent/40 text-accent hover:bg-accent/5 transition-all shadow-sm rounded-sm active:scale-95"
              >
                Scan Alerts
              </Button>
            </div>
          )}

          {/* Store Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Total stock value</p>
            <h3 className="text-xl md:text-2xl font-bold text-on-surface">
              GHS {products.reduce((acc, p) => acc + (parseFloat(p.price.replace(/[^0-9.-]+/g, '')) * p.stock), 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </h3>
            <span className="text-[9px] font-bold text-muted-foreground/80 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Estimated value
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Active requests</p>
            <h3 className="text-xl md:text-2xl font-bold text-on-surface">{requests.filter(r => r.status === 'Pending').length}</h3>
            <span className={cn(
              "text-[9px] font-bold mt-1",
              requests.filter(r => r.status === 'Pending').length > 0 ? "text-accent" : "text-muted-foreground/80"
            )}>
              {requests.filter(r => r.status === 'Pending').length > 0 ? 'Pending approval' : 'No pending'}
            </span>
          </CardContent>
        </Card>
        <Card className="rounded-sm border-border/60 shadow-sm">
          <CardContent className="p-6 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Stock items</p>
            <h3 className="text-xl md:text-2xl font-bold text-on-surface">{products.reduce((acc, p) => acc + p.stock, 0).toLocaleString()}</h3>
            <span className="text-[9px] font-bold text-muted-foreground/80 mt-1">Across {products.length} products</span>
          </CardContent>
        </Card>
        <Card className={cn(
          "rounded-sm border-border/60 shadow-sm",
          lowStockItems.length > 0 ? "bg-red-50/10 border-red-100" : ""
        )}>
          <CardContent className="p-6 flex flex-col gap-1">
            <p className={cn(
              "text-[10px] font-bold tracking-tight",
              lowStockItems.length > 0 ? "text-destructive" : "text-muted-foreground/80"
            )}>Stock alerts</p>
            <h3 className={cn(
              "text-xl md:text-2xl font-bold",
              lowStockItems.length > 0 ? "text-destructive" : "text-on-surface"
            )}>{lowStockItems.length}</h3>
            <span className={cn(
              "text-[9px] font-bold flex items-center gap-1 mt-1",
              lowStockItems.length > 0 ? "text-destructive/60" : "text-muted-foreground/80"
            )}>
              <AlertTriangle className="w-3 h-3" /> {lowStockItems.length > 0 ? "Attention" : "All stable"}
            </span>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'inventory' ? (
        <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <Package className="w-4 h-4 text-on-surface" />
                Inventory
              </CardTitle>
              
              <div className="flex items-center bg-muted/10 p-1 rounded-sm overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold tracking-tight transition-all",
                      activeCategory === cat ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
                    )}
                  >
                    {cat}
                  </button>
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
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Product</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight cursor-pointer hover:text-on-surface/80 transition-colors" onClick={() => handleSort('price')}>
                      <div className="flex items-center gap-1">Price <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight text-center cursor-pointer hover:text-on-surface/80 transition-colors" onClick={() => handleSort('stock')}>
                      <div className="flex items-center justify-center gap-1">In stock <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight cursor-pointer hover:text-on-surface/80 transition-colors" onClick={() => handleSort('status')}>
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
                          <div className="w-10 h-10 bg-muted/10 rounded-lg flex items-center justify-center text-xl overflow-hidden">
                            {product.image?.startsWith('http') ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                            ) : (
                              <span className="grayscale group-hover:grayscale-0 transition-all">{product.image}</span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-on-surface tracking-tight">{product.name}</span>
                            <span className="text-[9px] font-bold text-muted-foreground/80 mt-0.5 uppercase">#ITM-{product.id.substring(0, 6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-on-surface/80">{product.category}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-on-surface">{product.price}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={cn(
                          "text-xs font-black",
                          product.stock === 0 ? "text-destructive" : product.stock < 50 ? "text-accent" : "text-on-surface"
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
                            variant="outline" 
                            size="icon" 
                            className="w-10 h-10 text-stone-500 hover:text-accent border-stone-200 hover:bg-stone-50 rounded-sm transition-all shadow-sm active:scale-95"
                            onClick={() => handleOpenModal(product)}
                          >
                            <Edit3 className="w-5 h-5" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="w-10 h-10 text-stone-400 hover:text-destructive border-stone-200 hover:bg-destructive/10 rounded-sm transition-all shadow-sm active:scale-95"
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
                        <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">#ITM-{product.id.substring(0, 6)}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2.5 py-1 text-[9px] font-bold tracking-tight border rounded-full",
                      product.status === 'Critical' ? "bg-destructive/10 text-destructive border-destructive/20" :
                      product.status === 'Low Stock' ? "bg-accent/10 text-accent border-accent/20" :
                      "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {product.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/10 rounded-sm border border-border/40">
                      <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1">Price</p>
                      <p className="text-sm font-black text-on-surface">{product.price}</p>
                    </div>
                    <div className="p-4 bg-muted/10 rounded-sm border border-border/40">
                      <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-1">Stock</p>
                      <p className={cn(
                        "text-sm font-black",
                        product.stock < 50 ? "text-accent" : "text-on-surface"
                      )}>{product.stock.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 rounded-sm border-border/40 text-on-surface/80 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-stone-50 transition-all shadow-sm active:scale-95"
                      onClick={() => handleOpenModal(product)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" /> Edit Asset
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-12 w-12 rounded-sm border-border/40 text-stone-400 hover:text-destructive hover:bg-destructive/10 transition-all shadow-sm active:scale-95"
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
                <span className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Stable: {products.filter(p => p.status === 'Stable').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.4)]" />
                <span className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Low stock: {products.filter(p => p.status === 'Low Stock').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive shadow-[0_0_8px_rgba(var(--destructive-rgb),0.4)]" />
                <span className="text-[10px] font-bold text-muted-foreground/80 tracking-tight">Critical: {products.filter(p => p.status === 'Critical').length}</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-muted-foreground/80 italic">
              Showing {sortedAndFilteredProducts.length} movement assets in the current view
            </div>
          </CardFooter>
        </Card>
      ) : activeTab === 'requests' ? (
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
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Region</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Items</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Requested</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Priority</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-on-surface tracking-tight">{req.region}</span>
                          <span className="text-[9px] font-bold text-muted-foreground/80 mt-0.5">{req.constituency || 'Regional HQ'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          {req.items.map(item => (
                            <span key={item.id} className="text-[10px] font-bold text-on-surface/80">
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
                          "px-2 py-0.5 text-[10px] font-bold tracking-tight rounded-full",
                          req.priority === 'Urgent' ? "bg-destructive/10 text-destructive" : req.priority === 'High' ? "bg-accent/10 text-accent" : "bg-muted/10 text-on-surface/80"
                        )}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-bold tracking-tight border rounded-md",
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
                          <SelectTrigger className="w-32 h-8 text-[10px] font-bold tracking-tight rounded-lg border-border/60">
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
                      <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">{req.constituency || 'Regional HQ'}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter rounded-full",
                      req.priority === 'Urgent' ? "bg-destructive/10 text-destructive" : "bg-muted/10 text-on-surface/80"
                    )}>
                      {req.priority}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Requested Items</p>
                    <div className="p-4 bg-muted/10 rounded-sm border border-border/40 space-y-2">
                      {req.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-on-surface">{item.productName}</span>
                          <span className="text-xs font-black text-muted-foreground/80">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Status</p>
                      <div className={cn(
                        "px-2.5 py-1 text-[10px] font-bold tracking-tight border rounded-md",
                        req.status === 'Pending' ? "bg-accent/10 text-accent border-accent/20" : "bg-primary/10 text-primary border-primary/20"
                      )}>
                        {req.status}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Date</p>
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
      ) : (
        <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground/80" />
                Audit log
              </CardTitle>
              <Button
                variant="outline"
                size="lg"
                className="rounded-sm text-[10px] font-black uppercase tracking-[0.3em] px-12 h-12 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
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
                <Download className="w-4 h-4 mr-2" />
                Export telemetry
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Action</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Resource</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Change</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground/80 tracking-tight">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-muted-foreground/80">
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
                          "bg-muted/10 text-on-surface/80 border-border/40"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-on-surface tracking-tight">
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
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80">
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
                      <span className="text-[9px] font-bold">
                        {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 text-[9px] font-bold tracking-tight border rounded-md",
                      log.action === 'DISPATCHED' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                      log.action === 'REPLENISHED' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      "bg-muted/5 text-on-surface/80 border-border/40"
                    )}>
                      {log.action}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-bold text-on-surface tracking-tight">{log.productName || 'Unknown Asset'}</h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80 mt-2">
                        <MapPin className="w-3 h-3" />
                        <span>{log.sourceLocation}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                        <span>{log.destinationLocation || 'Internal'}</span>
                      </div>
                    </div>
                    <div className={cn(
                      "text-lg font-black",
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
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-on-surface" />
                  Fulfillment intelligence
                </div>
                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Live metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold tracking-tight">
                    <span className="text-muted-foreground/80 uppercase">Delivered</span>
                    <span className="text-emerald-600">{deliveredPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${deliveredPct}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold tracking-tight">
                    <span className="text-muted-foreground/80 uppercase">In progress</span>
                    <span className="text-amber-600">{processingPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${processingPct}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold tracking-tight">
                    <span className="text-muted-foreground/80 uppercase">Rejected</span>
                    <span className="text-red-600">{rejectedPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/10 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full transition-all duration-1000" style={{ width: `${rejectedPct}%` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      <div className="pt-8 mt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 pb-12">
        <p className="text-[10px] font-bold text-muted-foreground/80">© 2026 The Base Movement</p>
      </div>
    </>
  )}

      {/* Delete Confirmation */}
      <DeleteConfirmationModal 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Move to Trash"
        description="This product will be moved to the trash vault. You can restore it within 30 days before it is permanently removed from the catalog."
        itemName={deleteConfirm?.name || ''}
        isLoading={!!isDeleting}
        isPermanent={false}
      />

      {/* Add/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-sm border-border/60">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {selectedProduct?.id ? 'Edit inventory item' : 'New movement gear'}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground/80">
              Configure product metadata and logistical constraints.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-[10px] font-bold tracking-tight">Name</Label>
              <Input 
                value={selectedProduct?.name || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, name: e.target.value }))}
                className="col-span-3 h-10 rounded-lg border-border/60 text-xs" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-[10px] font-bold tracking-tight">Category</Label>
              <Select 
                value={selectedProduct?.category} 
                onValueChange={v => setSelectedProduct(prev => ({ ...prev!, category: v }))}
              >
                <SelectTrigger className="col-span-3 h-10 rounded-lg border-border/60 text-xs font-bold">
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
                  className="h-10 rounded-lg border-border/60 text-xs font-black" 
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label className="text-right text-[10px] font-bold tracking-tight">Stock</Label>
                <Input 
                  type="number"
                  value={selectedProduct?.stock || 0} 
                  onChange={e => setSelectedProduct(prev => ({ ...prev!, stock: parseInt(e.target.value) }))}
                  className="h-10 rounded-lg border-border/60 text-xs font-black" 
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right text-[10px] font-bold tracking-tight mt-3">Summary</Label>
              <textarea 
                value={selectedProduct?.description || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, description: e.target.value }))}
                placeholder="Short patriotic summary..."
                className="col-span-3 min-h-[80px] bg-white rounded-lg border border-border/60 p-3 text-xs focus:ring-1 focus:ring-brand-green outline-none" 
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right text-[10px] font-bold tracking-tight mt-3">Full Details</Label>
              <textarea 
                value={selectedProduct?.longDescription || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, longDescription: e.target.value }))}
                placeholder="Complete product specs and movement significance..."
                className="col-span-3 min-h-[120px] bg-white rounded-lg border border-border/60 p-3 text-xs focus:ring-1 focus:ring-brand-green outline-none" 
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right text-[10px] font-bold tracking-tight mt-3">Product Gallery</Label>
              <div className="col-span-3 space-y-4">
                {/* Image Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {(selectedProduct?.images || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border/60 bg-muted/10 group">
                      <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                      <button 
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-on-surface/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* Upload Placeholder */}
                  <label className="aspect-square rounded-lg border border-dashed border-muted-foreground/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/10 transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/80" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-muted-foreground/80" />
                        <span className="text-[8px] font-bold text-muted-foreground/80">Add Image</span>
                      </>
                    )}
                  </label>
                </div>

                <div className="flex flex-col gap-2">
                   <Label className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">Icon Fallback</Label>
                   <Input 
                    value={selectedProduct?.image?.startsWith('http') ? '' : (selectedProduct?.image || '')} 
                    onChange={e => setSelectedProduct(prev => ({ ...prev!, image: e.target.value }))}
                    placeholder="👕, 🧢, 🎒"
                    className="h-9 rounded-lg border-border/60 text-lg text-center w-24" 
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-sm text-[10px] font-black uppercase tracking-[0.3em] h-11 px-8 hover:bg-muted/10 transition-all active:scale-95">
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="rounded-sm text-[10px] font-black uppercase tracking-[0.3em] bg-on-surface text-white hover:bg-on-surface/90 h-11 px-10 min-w-[160px] shadow-lg transition-all hover:scale-[1.02] active:scale-95"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-sm border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Trash className="w-5 h-5" />
              </div>
              Remove item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-muted-foreground/80 leading-relaxed">
              Are you sure you want to remove <span className="text-on-surface">"{deleteConfirm?.name}"</span> from the movement catalog? This action will archive all associated inventory data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-sm text-[10px] font-black uppercase tracking-[0.2em] h-10 px-6 border-border/60">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-sm text-[10px] font-black uppercase tracking-[0.2em] bg-red-600 text-white hover:bg-red-700 h-10 px-8 active:scale-95"
            >
              Confirm Removal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
