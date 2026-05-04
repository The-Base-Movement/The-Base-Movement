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
  LogisticsLatency
} from '@/types/admin'
import type { Product } from '@/types/product'

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
      .order('name', { ascending: true })

    if (error) {
      console.warn('[DATABASE] Failed to fetch inventory:', error)
      return []
    }

    return data.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: `GHS ${i.price_ghs}`,
      stock: i.stock_quantity,
      status: i.status,
      image: i.image_emoji,
      color: i.brand_color
    }))
  }

  async getStoreProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('store_inventory')
      .select('*')
      .eq('status', 'Available')
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
      longDescription: i.description,
      sizes: i.sizes || ['S', 'M', 'L', 'XL'],
      colors: i.colors || ['Black', 'Green']
    }))
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('store_inventory')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      console.error('[DATABASE] Error fetching product by slug:', error)
      return null
    }

    if (!data) {
      const all = await this.getStoreProducts()
      return all.find(p => p.slug === slug) || null
    }

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      price: `GHS ${data.price_ghs}`,
      description: data.description || 'Official movement gear. Designed for patriots.',
      status: data.status,
      category: data.category,
      rating: data.rating || 4.8,
      reviews: data.reviews || 0,
      image: data.image_url,
      longDescription: data.description,
      sizes: data.sizes || ['S', 'M', 'L', 'XL'],
      colors: data.colors || ['Black', 'Green']
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
        brand_color: item.color
      })

    if (error) {
      console.error('[DATABASE] Failed to add inventory item:', error)
      return false
    }

    return true
  }

  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<boolean> {
    const updateData: Record<string, string | number | null | undefined> = {}
    if (item.name) updateData.name = item.name
    if (item.category) updateData.category = item.category
    if (item.price) updateData.price_ghs = parseFloat(item.price.replace(/[^0-9.]/g, ''))
    if (item.stock !== undefined) updateData.stock_quantity = item.stock
    if (item.status) updateData.status = item.status
    if (item.image) updateData.image_emoji = item.image
    if (item.color) updateData.brand_color = item.color

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
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DATABASE] Failed to delete inventory item:', error)
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

  async getLogisticsAudit(): Promise<LogisticsAuditEntry[]> {
    const { data, error } = await supabase
      .from('logistics_audit')
      .select('*, store_inventory(name)')
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('[DATABASE] Failed to fetch logistics audit:', error)
      return []
    }

    return data.map(entry => ({
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
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map((o) => ({
        ...o,
        items: o.store_order_items || []
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

      interface DBOrderItem {
        id: string;
        order_id: string;
        product_id: string;
        quantity: number;
        price_at_purchase: number;
        created_at: string;
        store_inventory: { name: string } | null;
      }

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
    const { error } = await supabase
      .from('store_orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      console.error('[DATABASE] Failed to update order status:', error)
      return false
    }

    return true
  }

  async getLogisticsLatency(): Promise<LogisticsLatency[]> {
    const regions = ['Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta', 'Northern']
    return regions.map(region => ({
      region,
      avgDispatchToDeliveryDays: Number((Math.random() * 5 + 1).toFixed(1)),
      totalDispatches: Math.floor(Math.random() * 500 + 100),
      efficiency: (Math.random() > 0.7 ? 'High' : Math.random() > 0.3 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low'
    }))
  }

  async getLogisticsVelocity(): Promise<LogisticsVelocity[]> {
    try {
      const { data, error } = await supabase
        .from('logistics_velocity_telemetry')
        .select('*')
      if (error) throw error
      return (data || []) as LogisticsVelocity[]
    } catch (error) {
      console.error('[DATABASE] Failed to fetch logistics velocity:', error)
      return []
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
}

export const logisticsService = LogisticsService.getInstance()
