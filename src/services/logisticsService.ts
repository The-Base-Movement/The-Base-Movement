import { supabase } from '@/lib/supabase'
import type { 
  InventoryItem, 
  ResourceRequest, 
  LogisticsAuditEntry, 
  Region, 
  Order, 
  OrderStats,
  LogisticsVelocity,
  InventoryAlert,
  LogisticsLatency,
  DBInventoryItem
} from '@/types/admin'
import type { Product } from '@/types/product'

// --- Internal Database Interfaces ---

interface DBProduct {
  id: string
  name: string
  slug: string
  price_ghs: number
  description: string
  long_description?: string
  status: string
  category: string
  rating?: number
  reviews?: number
  image_url: string
  sizes?: string[]
  colors?: string[]
  is_featured?: boolean
  customization_allowed?: boolean
  specifications?: Record<string, string | number | boolean | null>
  product_images?: { id: string, url: string, alt_text: string, display_order: number }[]
  product_reviews?: { id: string, author_name: string, rating: number, content: string, is_verified: boolean, created_at: string }[]
}

interface DBReview {
  id: string;
  author_name: string;
  rating: number;
  content: string;
  created_at: string;
}

interface DBJoinItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  store_inventory: { name: string } | null;
}

interface DBOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  created_at: string;
  store_inventory: { name: string } | null;
}

class LogisticsService {
  private static instance: LogisticsService

  private constructor() {}

  public static getInstance(): LogisticsService {
    if (!LogisticsService.instance) {
      LogisticsService.instance = new LogisticsService()
    }
    return LogisticsService.instance
  }

  // --- Store & Inventory ---

  async getInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('store_inventory')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) {
      console.warn('[DATABASE] Failed to fetch inventory:', error)
      return []
    }

    return (data as unknown as DBInventoryItem[] || []).map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: `GHS ${i.price_ghs}`,
      stock: i.stock_quantity,
      status: i.status,
      image: i.image_emoji || i.image_url || '📦',
      images: i.image_url ? [i.image_url] : [],
      color: i.brand_color,
      description: i.description,
      longDescription: i.long_description
    }))
  }

  async getStoreProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('store_inventory')
      .select('*')
      .eq('status', 'Available')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) {
      console.warn('[DATABASE] Failed to fetch store products:', error)
      return []
    }

    return (data || []).map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug || i.name.toLowerCase().replace(/\s+/g, '-'),
      price: `GHS ${i.price_ghs}`,
      description: i.description || 'Official movement gear. Designed for patriots.',
      status: i.status,
      category: i.category,
      rating: i.rating || 4.8,
      reviews: i.reviews || 0,
      image: i.image_url,
      longDescription: i.long_description || i.description || 'Official movement gear. Designed for patriots.',
      sizes: i.sizes || ['S', 'M', 'L', 'XL'],
      colors: i.colors || ['Black', 'Green']
    }))
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('store_inventory')
      .select(`
        *,
        product_reviews:reviews (*)
      `)
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) {
      console.error('[DATABASE] Error fetching product by slug:', error)
      return null
    }

    if (!data) {
      const all = await this.getStoreProducts()
      return all.find(p => p.slug === slug) || null
    }

    const typedData = data as unknown as DBProduct


    return {
      id: typedData.id,
      name: typedData.name,
      slug: typedData.slug,
      price: `GHS ${typedData.price_ghs}`,
      description: typedData.description || 'Official movement gear. Designed for patriots.',
      status: typedData.status,
      category: typedData.category,
      rating: typedData.rating || 4.8,
      reviews: typedData.reviews || 0,
      image: typedData.image_url,
      longDescription: typedData.long_description || typedData.description,
      sizes: typedData.sizes || ['S', 'M', 'L', 'XL'],
      colors: typedData.colors || ['Black', 'Green'],
      is_featured: typedData.is_featured,
      customization_allowed: typedData.customization_allowed,
      specifications: typedData.specifications,
      gallery_images: [],
      reviews_data: (typedData.product_reviews as unknown as DBReview[] || []).map((rev) => ({
        id: rev.id,
        patriot_name: rev.author_name,
        rating: rev.rating,
        content: rev.content,
        is_verified: true,
        created_at: rev.created_at
      }))
    }
  }

  async addInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<boolean> {
    const { error } = await supabase
      .from('store_inventory')
      .insert({
        name: item.name,
        category: item.category,
        price_ghs: parseFloat(item.price.replace(/[^0-9.]/g, '')),
        stock_quantity: item.stock,
        status: item.status,
        image_emoji: item.image,
        brand_color: item.color,
        description: item.description,
        long_description: item.longDescription
      })
      .select()
      .single()

    if (error) {
      console.error('[DATABASE] Failed to add inventory item:', error)
      return false
    }

    return true
  }

  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<boolean> {
    const updateData: Record<string, string | number> = {}
    if (item.name) updateData.name = item.name
    if (item.category) updateData.category = item.category
    if (item.price) updateData.price_ghs = parseFloat(item.price.replace(/[^0-9.]/g, ''))
    if (item.stock !== undefined) updateData.stock_quantity = item.stock
    if (item.status) updateData.status = item.status
    if (item.image) updateData.image_emoji = item.image
    if (item.color) updateData.brand_color = item.color
    if (item.description !== undefined) updateData.description = item.description
    if (item.longDescription !== undefined) updateData.long_description = item.longDescription

    const { error } = await supabase
      .from('store_inventory')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to update inventory item:', error)
      return false
    }

    return true
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('store_inventory')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to soft delete inventory item:', error)
      return false
    }

    return true
  }

  async getTrashedInventory(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('store_inventory')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) {
      console.warn('[DATABASE] Failed to fetch trashed inventory:', error)
      return []
    }

    return (data as unknown as DBInventoryItem[] || []).map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: `GHS ${i.price_ghs}`,
      stock: i.stock_quantity,
      status: i.status,
      image: i.image_emoji || i.image_url || '📦',
      images: i.image_url ? [i.image_url] : [],
      color: i.brand_color,
      deletedAt: i.deleted_at
    }))
  }

  async restoreInventoryItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('store_inventory')
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to restore inventory item:', error)
      return false
    }
    return true
  }

  async permanentlyDeleteInventoryItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('store_inventory')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Permanent inventory deletion failed:', error)
      return false
    }
    return true
  }

  // --- Resource Requests ---

  async getResourceRequests(): Promise<ResourceRequest[]> {
    const { data, error } = await supabase
      .from('resource_requests')
      .select('*, resource_request_items(*, store_inventory(name))')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch resource requests:', error)
      return []
    }

    interface DBResourceItem {
      id: string;
      product_id: string;
      quantity: number;
      store_inventory: { name: string } | null;
    }

    return data.map(req => ({
      id: req.id,
      requesterId: req.requester_id,
      region: req.region,
      constituency: req.constituency,
      status: req.status,
      priority: req.priority,
      notes: req.notes,
      createdAt: req.created_at,
      items: (req.resource_request_items as unknown as DBResourceItem[] || []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.store_inventory?.name,
        quantity: item.quantity
      }))
    }))
  }

  async updateResourceRequestStatus(id: string, status: ResourceRequest['status']): Promise<boolean> {
    const { error } = await supabase
      .from('resource_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to update request status:', error)
      return false
    }

    return true
  }

  async getLogisticsAudit(limit = 50): Promise<LogisticsAuditEntry[]> {
    try {
      const { data, error } = await supabase
        .from('logistics_audit')
        .select('*, store_inventory(name)')
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(entry => ({
        id: entry.id,
        requestId: entry.request_id,
        productId: entry.product_id,
        productName: entry.store_inventory?.name,
        action: entry.action,
        quantityChange: entry.quantity_change,
        sourceLocation: entry.source_location,
        destinationLocation: entry.destination_location,
        performedBy: entry.performed_by,
        notes: entry.notes,
        timestamp: entry.timestamp
      }))
    } catch (error) {
      console.error('[DATABASE] Failed to fetch logistics audit ledger:', error)
      return []
    }
  }

  // --- Regional Data ---

  async getRegions(): Promise<Region[]> {
    const { data, error } = await supabase
      .from('ghana_regions')
      .select(`
        id,
        name,
        ghana_constituencies (
          name
        )
      `)
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Regional data fetch failed:', error)
      return this.getRegionsFallback()
    }

    return data.map((r) => ({
      id: r.id,
      name: r.name,
      constituencies: (r.ghana_constituencies || []).map((c: { name: string }) => c.name)
    }))
  }

  async getConstituencies(): Promise<{ data: { name: string, region_id: number }[] }> {
    const { data, error } = await supabase
      .from('ghana_constituencies')
      .select('name, region_id')
      .order('name', { ascending: true })

    if (error) {
      console.error('[DATABASE] Constituencies fetch failed:', error)
      return { data: [] }
    }
    return { data: data || [] }
  }

  private getRegionsFallback(): Region[] {
    const ghanaRegions = [
      'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
      'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North'
    ]
    return ghanaRegions.map((name, index) => ({
      id: index + 1,
      name,
      constituencies: []
    }))
  }

  async updateRegion(id: string, name: string): Promise<boolean> {
    const { error } = await supabase
      .from('ghana_regions')
      .update({ name })
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Region update failed:', error)
      return false
    }
    return true
  }

  async deleteConstituency(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('ghana_constituencies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Constituency deletion failed:', error)
      return false
    }
    return true
  }

  // --- Orders ---

  async getOrders(limit = 50): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select(`
          *,
          store_order_items (
            id,
            order_id,
            product_id,
            quantity,
            price_at_purchase,
            created_at,
            store_inventory(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error


      return (data || []).map((o) => ({
        ...o,
        items: (o.store_order_items as unknown as DBJoinItem[] || []).map((item) => ({
          ...item,
          product_name: item.store_inventory?.name
        }))
      })) as Order[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch orders:', error)
      return []
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select(`
          *,
          store_order_items (
            id,
            order_id,
            product_id,
            quantity,
            price_at_purchase,
            created_at,
            store_inventory(name)
          )
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      if (!data) return null


      return {
        ...data,
        items: (data.store_order_items as unknown as DBOrderItem[] || []).map((item) => ({
          ...item,
          product_name: item.store_inventory?.name
        }))
      } as Order
    } catch (error) {
      console.error('[DATABASE] Failed to fetch order by ID:', error)
      return null
    }
  }

  async getOrderStats(): Promise<OrderStats> {
    try {
      const { data, error } = await supabase
        .from('store_orders')
        .select('status, total_amount, created_at, dispatched_at, delivered_at')

      if (error) throw error

      const orders = data || []
      const today = new Date().toISOString().slice(0, 10)

      const deliveredOrders = orders.filter(o => o.status === 'Delivered' && o.dispatched_at && o.delivered_at)
      let totalDays = 0
      deliveredOrders.forEach(o => {
        const start = new Date(o.dispatched_at!).getTime()
        const end = new Date(o.delivered_at!).getTime()
        totalDays += (end - start) / (1000 * 60 * 60 * 24)
      })

      return {
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'Pending').length,
        processingOrders: orders.filter(o => o.status === 'Processing').length,
        dispatchedOrders: orders.filter(o => o.status === 'Dispatched').length,
        deliveredOrders: orders.filter(o => o.status === 'Delivered').length,
        cancelledOrders: orders.filter(o => o.status === 'Cancelled').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        revenueToday: orders
          .filter(o => o.created_at?.slice(0, 10) === today)
          .reduce((sum, o) => sum + (o.total_amount || 0), 0),
        avgDeliveryDays: deliveredOrders.length > 0 ? totalDays / deliveredOrders.length : 0
      }
    } catch (error) {
      console.error('[DATABASE] Failed to fetch order stats:', error)
      return {
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        dispatchedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        revenueToday: 0,
        avgDeliveryDays: 0
      }
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    try {
      const updates: Partial<Order> = { status, updated_at: new Date().toISOString() }
      
      if (status === 'Dispatched') {
        updates.dispatched_at = new Date().toISOString()
      } else if (status === 'Delivered') {
        updates.delivered_at = new Date().toISOString()
      }

      // 1. Update the order
      const { error: orderError } = await supabase
        .from('store_orders')
        .update(updates)
        .eq('id', orderId)

      if (orderError) throw orderError

      // 2. If Dispatched, deduct stock from inventory
      if (status === 'Dispatched') {
        const order = await this.getOrderById(orderId)
        if (order && order.items) {
          for (const item of order.items) {
            // Atomic decrement logic would be better via RPC, but for now we do sequential updates
            const { data: product } = await supabase
              .from('store_inventory')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single()

            if (product) {
              const newStock = Math.max(0, product.stock_quantity - item.quantity)
              await supabase
                .from('store_inventory')
                .update({ stock_quantity: newStock })
                .eq('id', item.product_id)
              
              // 3. Log to logistics audit
              await supabase
                .from('logistics_audit')
                .insert({
                  product_id: item.product_id,
                  action: 'DISPATCHED',
                  quantity_change: -item.quantity,
                  source_location: 'Central Hub',
                  performed_by: 'System / Logistics Engine',
                  notes: `Auto-deducted for Order #${orderId.slice(0, 8)}`,
                  timestamp: new Date().toISOString()
                })
            }
          }
        }
      }

      return true
    } catch (error) {
      console.error('[DATABASE] Order status update failed:', error)
      return false
    }
  }

  async getLogisticsLatency(): Promise<LogisticsLatency[]> {
    try {
      const { data, error } = await supabase
        .from('logistics_velocity_operational metrics')
        .select('region, avg_dispatch_hours, avg_delivery_hours, total_orders')

      if (error || !data) return []

      return data.map(item => {
        const totalHours = (item.avg_dispatch_hours || 0) + (item.avg_delivery_hours || 0)
        const avgDays = Number((totalHours / 24).toFixed(1))
        
        return {
          region: item.region,
          avgDispatchToDeliveryDays: avgDays || 0,
          totalDispatches: item.total_orders || 0,
          efficiency: (avgDays < 3 && avgDays > 0) ? 'High' : (avgDays < 5 && avgDays > 0) ? 'Medium' : 'Low'
        }
      })
    } catch (error) {
      console.error('[DATABASE] Failed to fetch logistics latency:', error)
      return []
    }
  }

  async getLogisticsVelocity(): Promise<LogisticsVelocity[]> {
    try {
      const { data, error } = await supabase
        .from('logistics_velocity_operational metrics')
        .select('*')
      if (error) throw error
      return (data || []) as LogisticsVelocity[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch logistics velocity:', error)
      return []
    }
  }

  async getRegionalAvailability(productId: string, region: string): Promise<{ available: boolean; message: string }> {
    // Logic: In a real system, this would check a 'regional_stock' table.
    // For now, we simulate logic where certain heavy/limited items aren't in remote regions.
    
    const remoteRegions = ['Upper West', 'Upper East', 'North East', 'Savannah']
    const isRemote = remoteRegions.includes(region)
    
    // Simulate some products being restricted
    // (In production, this would be a query to store_inventory_regional)
    const isRestricted = productId.length % 7 === 0 // Mock restriction logic
    
    if (isRemote && isRestricted) {
      return { 
        available: false, 
        message: `This item is currently out of stock for the ${region} region due to logistical constraints.` 
      }
    }
    
    return { 
      available: true, 
      message: `Available for fulfillment in ${region}.` 
    }
  }

  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    try {
      const { data: allItems, error: fetchError } = await supabase
        .from('store_inventory')
        .select('id, name, stock_quantity, low_stock_threshold, category')
      
      if (fetchError) throw fetchError
      return (allItems || []).filter(item => 
        item.stock_quantity <= (item.low_stock_threshold || 10)
      ) as InventoryAlert[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch inventory alerts:', error)
      return []
    }
  }

  async replenishInventory(): Promise<boolean> {
    try {
      const alerts = await this.getInventoryAlerts()
      if (alerts.length === 0) return true

      for (const item of alerts) {
        const replenishedStock = (item.low_stock_threshold || 10) * 5 // Set to 5x threshold
        const { error } = await supabase
          .from('store_inventory')
          .update({ stock_quantity: replenishedStock })
          .eq('id', item.id)
        
        if (error) throw error

        // Log replenishment
        await supabase
          .from('logistics_audit')
          .insert({
            product_id: item.id,
            action: 'REPLENISHED',
            quantity_change: replenishedStock - item.stock_quantity,
            source_location: 'Central Hub',
            performed_by: 'System / Logistics Engine',
            notes: 'Automated bulk replenishment protocol',
            timestamp: new Date().toISOString()
          })
      }
      return true
    } catch (error) {
      console.error('[DATABASE] Replenishment protocol failed:', error)
      return false
    }
  }

}

export const logisticsService = LogisticsService.getInstance()
