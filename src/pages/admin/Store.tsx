import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { usePerformance } from '@/context/PerformanceContext'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import {
  adminService,
  type InventoryItem,
  type ResourceRequest,
  type LogisticsAuditEntry,
} from '@/services/adminService'
import { toast } from 'sonner'
import { contentService } from '@/services/contentService'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

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
  const { lowBandwidthMode } = usePerformance()
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Partial<InventoryItem> | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof InventoryItem
    direction: 'asc' | 'desc'
  } | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const url = await contentService.uploadImage(file, 'product-images')
      if (url) {
        setSelectedProduct((prev) => {
          const currentImages = prev?.images || []
          return { ...prev!, images: [...currentImages, url], image: prev?.image || url }
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
    setSelectedProduct((prev) => ({
      ...prev!,
      images: prev?.images?.filter((img) => img !== url) || [],
    }))
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [inv, reqs, logs] = await Promise.all([
        adminService.getInventory(),
        adminService.getResourceRequests(),
        adminService.getLogisticsAudit(),
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

    if (lowBandwidthMode) return

    // Subscribe to live inventory updates
    const inventorySub = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_inventory' }, () => {
        adminService.getInventory().then(setProducts)
      })
      .subscribe()

    // Subscribe to live resource request updates
    const requestsSub = supabase
      .channel('request-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resource_requests' }, () => {
        adminService.getResourceRequests().then(setRequests)
      })
      .subscribe()

    return () => {
      inventorySub.unsubscribe()
      requestsSub.unsubscribe()
    }
  }, [lowBandwidthMode])

  const handleOpenModal = (product?: InventoryItem) => {
    setSelectedProduct(
      product || {
        name: '',
        category: 'Apparel',
        price: '₵0.00',
        stock: 0,
        status: 'Stable',
        image: '👕',
        color: '#000000',
      }
    )
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!selectedProduct?.name || !selectedProduct?.price) {
      toast.error('Please fill in all required fields')
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
      adminService.logAction(
        selectedProduct.id ? 'UPDATE_INVENTORY' : 'ADD_INVENTORY',
        `STORE/${selectedProduct.name!}`,
        'Success'
      )
      toast.success(selectedProduct.id ? 'Product updated' : 'Product added to movement catalog')
      setIsModalOpen(false)
      fetchData()
    } else {
      toast.error('Failed to save product')
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
        toast.error('Failed to move item to trash')
      }
    } catch {
      toast.error('An error occurred during deletion')
    } finally {
      setIsDeleting(null)
      setDeleteConfirm(null)
    }
  }

  const handleStatusUpdate = async (id: string, status: ResourceRequest['status']) => {
    const success = await adminService.updateResourceRequestStatus(id, status)
    if (success) {
      adminService.logAction('STATUS_UPDATE', `STORE/Request ${id.slice(0, 8)}`, 'Success')
      toast.success(`Request marked as ${status}`)
      fetchData()
    }
  }

  const handleSort = (key: keyof InventoryItem) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' }
        return null
      }
      return { key, direction: 'asc' }
    })
  }

  const lowStockItems = products.filter((p) => p.stock < 50 && p.stock > 0)
  const categories = ['All', 'Apparel', 'Accessories', 'Lifestyle', 'Stationery', 'Limited Edition']

  const sortedAndFilteredProducts = [
    ...products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory
      return matchesSearch && matchesCategory
    }),
  ].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    const aVal = a[key] ?? ''
    const bVal = b[key] ?? ''
    let aComp: string | number = aVal as string | number
    let bComp: string | number = bVal as string | number
    if (key === 'price') {
      aComp = parseFloat((aVal as string).replace(/[^0-9.-]+/g, '')) || 0
      bComp = parseFloat((bVal as string).replace(/[^0-9.-]+/g, '')) || 0
    }
    if (aComp < bComp) return direction === 'asc' ? -1 : 1
    if (aComp > bComp) return direction === 'asc' ? 1 : -1
    return 0
  })

  const pendingRequests = requests.filter((r) => r.status === 'Pending').length

  const tabs = [
    { id: 'inventory' as const, label: 'Inventory', icon: 'inventory_2' },
    { id: 'requests' as const, label: 'Requests', icon: 'local_shipping', count: pendingRequests },
    { id: 'audit' as const, label: 'Audit log', icon: 'history' },
  ]

  return (
    <div className="main">
      <AdminPageHeader
        title="Logistics and supply"
        description="Movement inventory, merchandising, and regional distribution infrastructure."
        actions={
          <>
            {activeTab === 'inventory' && (
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  add
                </span>
                Add item
              </button>
            )}
            {activeTab === 'audit' && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => toast.info('Export triggered from parent')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  download
                </span>
                Export log
              </button>
            )}
          </>
        }
      />

      {isLoading ? (
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 32,
              color: 'hsl(var(--border))',
              display: 'block',
              marginBottom: 10,
              animation: 'spin 1.2s linear infinite',
            }}
          >
            sync
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            Synchronizing movement vault…
          </p>
        </div>
      ) : (
        <>
          <StoreStatsOverview
            products={products}
            requests={requests}
            lowStockItems={lowStockItems}
          />

          {/* Tab nav */}
          <div
            style={{
              display: 'flex',
              gap: 0,
              borderBottom: '1px solid hsl(var(--border))',
              background: '#fff',
              marginBottom: 16,
              overflowX: 'auto',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '13px 20px',
                  border: 'none',
                  borderBottom:
                    activeTab === tab.id
                      ? '2px solid hsl(var(--primary))'
                      : '2px solid transparent',
                  marginBottom: -1,
                  background: 'none',
                  cursor: 'pointer',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 12,
                  color:
                    activeTab === tab.id ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  {tab.icon}
                </span>
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span
                    style={{
                      background: 'hsl(var(--accent))',
                      color: '#000',
                      borderRadius: 99,
                      padding: '1px 7px',
                      fontSize: 9,
                      fontWeight: 'var(--font-weight-medium, 500)',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

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
              sortConfig={sortConfig}
              handleOpenModal={handleOpenModal}
              setDeleteConfirm={setDeleteConfirm}
              isDeleting={isDeleting}
            />
          )}

          {activeTab === 'requests' && (
            <ResourceRequestsTab requests={requests} handleStatusUpdate={handleStatusUpdate} />
          )}

          {activeTab === 'audit' && <LogisticsAuditTab auditLogs={auditLogs} toast={toast} />}
        </>
      )}

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
    </div>
  )
}
