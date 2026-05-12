import { useState, useEffect } from 'react'
import { 
  Plus, 
  Package, 
  Truck,
  History
} from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { Button } from '@/components/ui/neon-button'
import { BrandLine } from '@/components/ui/BrandLine'
import { cn } from '@/lib/utils'
import { adminService, type InventoryItem, type ResourceRequest, type LogisticsAuditEntry } from '@/services/adminService'
import { toast } from 'sonner'
import { contentService } from '@/services/contentService'
import { Loader2 } from 'lucide-react'

// Modular Components
import { StoreStatsOverview } from './store/components/StoreStatsOverview'
import { InventoryTable } from './store/components/InventoryTable'
import { ProductFormDialog } from './store/components/ProductFormDialog'
import { ResourceRequestsTab } from './store/components/ResourceRequestsTab'
import { LogisticsAuditTab } from './store/components/LogisticsAuditTab'

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
      const success = await adminService.deleteInventoryItem(deleteConfirm.id, deleteConfirm.name)
      if (success) {
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
    <main className="admin-page-container">
      {/* Page Header - Standardized */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <Package className="w-8 h-8 text-on-surface" />
            Logistics and supply
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Movement inventory, merchandising, and regional distribution infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted/10 p-1 rounded-sm mr-2">
            <Button 
              variant={activeTab === 'inventory' ? "primary" : "ghost"}
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-5 py-2 text-micro font-bold rounded-sm transition-all h-auto",
                activeTab === 'inventory' ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              )}
            >
              <Package className="w-3.5 h-3.5 mr-1.5 inline" /> Inventory
            </Button>
            <Button 
              variant={activeTab === 'requests' ? "primary" : "ghost"}
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-5 py-2 text-micro font-bold rounded-sm transition-all h-auto",
                activeTab === 'requests' ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              )}
            >
              <Truck className="w-3.5 h-3.5 mr-1.5 inline" /> Requests
            </Button>
            <Button 
              variant={activeTab === 'audit' ? "primary" : "ghost"}
              onClick={() => setActiveTab('audit')}
              className={cn(
                "px-5 py-2 text-micro font-bold rounded-sm transition-all h-auto",
                activeTab === 'audit' ? "bg-white text-on-surface shadow-sm" : "text-muted-foreground/80 hover:text-on-surface/80"
              )}
            >
              <History className="w-3.5 h-3.5 mr-1.5 inline" /> Audit
            </Button>
          </div>
          {activeTab === 'inventory' && (
            <Button 
              variant="primary"
              size="lg"
              onClick={() => handleOpenModal()}
              className="rounded-sm text-micro font-bold tracking-tight px-12 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          )}
        </div>
      </header>

      {/* Critical Alerts Banner */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-muted/30 border border-dashed border-border/60">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/60" />
          <p className="text-xs font-bold tracking-tight text-muted-foreground/80">Synchronizing movement vault...</p>
        </div>
      ) : (
        <>
          <StoreStatsOverview 
            products={products}
            requests={requests}
            lowStockItems={lowStockItems}
          />

          {activeTab === 'inventory' && (
            <InventoryTable 
              products={products}
              sortedAndFilteredProducts={sortedAndFilteredProducts}
              categories={categories}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSort={handleSort}
              handleOpenModal={handleOpenModal}
              setDeleteConfirm={setDeleteConfirm}
              isDeleting={isDeleting}
            />
          )}

          {activeTab === 'requests' && (
            <ResourceRequestsTab 
              requests={requests}
              handleStatusUpdate={handleStatusUpdate}
            />
          )}

          {activeTab === 'audit' && (
            <LogisticsAuditTab 
              auditLogs={auditLogs}
              toast={toast}
            />
          )}

          <footer className="pt-8 mt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 pb-12">
            <p className="text-micro font-bold text-muted-foreground/80">© 2026 The Base Movement</p>
          </footer>
        </>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationModal 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Move to trash"
        description="This product will be moved to the trash vault. You can restore it within 30 days before it is permanently removed from the catalog."
        itemName={deleteConfirm?.name || ''}
        isLoading={!!isDeleting}
        isPermanent={false}
      />

      {/* Add/Edit Product Modal */}
      <ProductFormDialog
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        isSaving={isSaving}
        handleSave={handleSave}
        isUploadingImage={isUploadingImage}
        handleImageUpload={handleImageUpload}
        removeImage={removeImage}
      />
    </main>
  )
}

