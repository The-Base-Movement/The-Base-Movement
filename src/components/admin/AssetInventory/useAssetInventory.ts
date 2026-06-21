import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  Asset,
  AssetCategory,
  AssetDetail,
  AssetCondition,
  ViewMode,
  AssetRequest,
  AssetAlert,
} from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildAssetFromRow(row: any): Asset {
  const openAssignment =
    (row.asset_assignments ?? []).find(
      (a: { checked_in_at: string | null }) => a.checked_in_at === null
    ) ?? null
  return {
    id: row.id,
    name: row.name,
    category_id: row.category_id,
    department_id: row.department_id,
    condition: row.condition,
    serial_number: row.serial_number,
    description: row.description,
    created_at: row.created_at,
    category_name: row.asset_categories?.name ?? '',
    purchase_price: row.purchase_price ?? null,
    purchase_date: row.purchase_date ?? null,
    asset_tag: row.asset_tag ?? null,
    qr_code_url: row.qr_code_url ?? null,
    assigned_to_id: openAssignment?.assigned_to ?? null,
    assigned_to_name: openAssignment?.users?.full_name ?? null,
    assignment_id: openAssignment?.id ?? null,
  }
}

export function useAssetInventory(departmentId: string, viewMode: ViewMode) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [filterDept, setFilterDept] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<AssetDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<AssetRequest[]>([])
  const [alerts, setAlerts] = useState<AssetAlert[]>([])

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('assets')
      .select(
        `id, name, category_id, department_id, condition,
         serial_number, description, created_at,
         purchase_price, purchase_date, asset_tag, qr_code_url,
         asset_categories ( name, lifespan_years ),
         asset_assignments ( id, assigned_to, checked_in_at, users ( full_name ) )`
      )
      .order('created_at', { ascending: false })

    if (viewMode === 'department') {
      query = query.eq('department_id', departmentId)
    } else if (filterDept) {
      query = query.eq('department_id', filterDept)
    }

    const { data, error } = await query
    if (error) {
      toast.error('Failed to load assets')
      setLoading(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAssets((data ?? []).map((r: any) => buildAssetFromRow(r)))
    if (viewMode === 'master') {
      const depts = [
        ...new Set((data ?? []).map((r: { department_id: string }) => r.department_id)),
      ]
      setDepartments(depts)
    }
    setLoading(false)
  }, [departmentId, viewMode, filterDept])

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('asset_categories')
      .select('id, name, department_id, created_at, lifespan_years')
      .or(`department_id.eq.${departmentId},department_id.is.null`)
      .order('name')
    setCategories(data ?? [])
  }, [departmentId])

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from('users').select('id, full_name').order('full_name')
    setMembers(data ?? [])
  }, [])

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('asset_requests')
      .select(
        'id, asset_id, requested_by, department_id, reason, status, reviewed_by, review_note, expected_return_date, created_at, assets(name), users!asset_requests_requested_by_fkey(full_name)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setPendingRequests(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((r: any) => ({
        id: r.id,
        asset_id: r.asset_id,
        asset_name: r.assets?.name ?? '',
        requested_by: r.requested_by,
        requester_name: r.users?.full_name ?? 'Unknown',
        department_id: r.department_id,
        reason: r.reason,
        status: r.status,
        reviewed_by: r.reviewed_by,
        review_note: r.review_note,
        expected_return_date: r.expected_return_date,
        created_at: r.created_at,
      }))
    )
  }, [])

  const fetchAlerts = useCallback(async () => {
    const { data } = await supabase
      .from('asset_alerts')
      .select('id, asset_id, assignment_id, alert_type, resolved, created_at')
      .eq('resolved', false)
    setAlerts(data ?? [])
  }, [])

  useEffect(() => {
    const t1 = setTimeout(() => fetchAssets(), 0)
    const t2 = setTimeout(() => fetchCategories(), 0)
    const t3 = setTimeout(() => fetchMembers(), 0)
    const t4 = setTimeout(() => fetchRequests(), 0)
    const t5 = setTimeout(() => fetchAlerts(), 0)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
    }
  }, [fetchAssets, fetchCategories, fetchMembers, fetchRequests, fetchAlerts])

  const loadDetail = useCallback(async (assetId: string) => {
    setDetailLoading(true)
    const [assetRes, logsRes, assignRes] = await Promise.all([
      supabase
        .from('assets')
        .select(
          `id, name, category_id, department_id, condition, serial_number, description, created_at,
             asset_categories(name),
             asset_assignments(id, assigned_to, checked_in_at, users(full_name))`
        )
        .eq('id', assetId)
        .single(),
      supabase
        .from('asset_maintenance_logs')
        .select('id, asset_id, logged_by, note, condition_after, created_at, users(full_name)')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false }),
      supabase
        .from('asset_assignments')
        .select(
          'id, asset_id, assigned_to, checked_out_at, checked_in_at, expected_return_date, notes, users(full_name)'
        )
        .eq('asset_id', assetId)
        .order('checked_out_at', { ascending: false }),
    ])
    if (assetRes.error) {
      toast.error('Failed to load asset details')
      setDetailLoading(false)
      return
    }
    setDetail({
      asset: buildAssetFromRow(assetRes.data),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maintenanceLogs: (logsRes.data ?? []).map((r: any) => ({
        id: r.id,
        asset_id: r.asset_id,
        logged_by: r.logged_by,
        logged_by_name: r.users?.full_name ?? 'Unknown',
        note: r.note,
        condition_after: r.condition_after,
        created_at: r.created_at,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignments: (assignRes.data ?? []).map((r: any) => ({
        id: r.id,
        asset_id: r.asset_id,
        assigned_to: r.assigned_to,
        assigned_to_name: r.users?.full_name ?? 'Unknown',
        checked_out_at: r.checked_out_at,
        checked_in_at: r.checked_in_at,
        expected_return_date: r.expected_return_date,
        notes: r.notes,
      })),
    })
    setDetailLoading(false)
  }, [])

  const closeDetail = useCallback(() => setDetail(null), [])

  const generateAndSaveQR = useCallback(
    async (assetId: string, _assetTag: string) => {
      try {
        const QRCode = await import('qrcode')
        const url = `${window.location.origin}/admin/it-department/assets?id=${assetId}`
        const dataUrl = await QRCode.default.toDataURL(url, { width: 300, margin: 2 })
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('asset-qr-codes')
          .upload(`${assetId}.png`, blob, { contentType: 'image/png', upsert: true })
        if (uploadErr) {
          console.error('QR upload failed', uploadErr)
          return
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from('asset-qr-codes').getPublicUrl(uploadData.path)
        await supabase.from('assets').update({ qr_code_url: publicUrl }).eq('id', assetId)
        await fetchAssets()
      } catch (err) {
        console.error('QR generation failed', err)
      }
    },
    [fetchAssets]
  )

  const addCategory = useCallback(
    async (name: string) => {
      const { error } = await supabase
        .from('asset_categories')
        .insert({ name, department_id: departmentId })
      if (error) {
        toast.error('Failed to add category')
        return false
      }
      toast.success('Category added')
      await fetchCategories()
      return true
    },
    [departmentId, fetchCategories]
  )

  const addAsset = useCallback(
    async (payload: {
      name: string
      category_id: string
      serial_number: string
      description: string
      condition: AssetCondition
      purchase_price: number | null
      purchase_date: string | null
    }) => {
      const { data: inserted, error } = await supabase
        .from('assets')
        .insert({ ...payload, department_id: departmentId })
        .select('id, asset_tag')
        .single()
      if (error) {
        toast.error('Failed to add asset')
        return false
      }
      toast.success('Asset added')
      if (inserted?.id && inserted?.asset_tag) {
        generateAndSaveQR(inserted.id, inserted.asset_tag)
      }
      await fetchAssets()
      return true
    },
    [departmentId, fetchAssets, generateAndSaveQR]
  )

  const updateAsset = useCallback(
    async (
      id: string,
      payload: { name: string; category_id: string; serial_number: string; description: string }
    ) => {
      const { error } = await supabase.from('assets').update(payload).eq('id', id)
      if (error) {
        toast.error('Failed to update asset')
        return false
      }
      toast.success('Asset updated')
      await fetchAssets()
      if (detail?.asset.id === id) await loadDetail(id)
      return true
    },
    [fetchAssets, detail, loadDetail]
  )

  const deleteAsset = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id)
      if (error) {
        toast.error('Failed to delete asset')
        return false
      }
      toast.success('Asset deleted')
      if (detail?.asset.id === id) closeDetail()
      await fetchAssets()
      return true
    },
    [fetchAssets, detail, closeDetail]
  )

  const updateCondition = useCallback(
    async (assetId: string, condition: AssetCondition, note: string, loggedBy: string) => {
      const { error } = await supabase.rpc('update_asset_condition', {
        p_asset_id: assetId,
        p_condition: condition,
        p_note: note,
        p_logged_by: loggedBy,
      })
      if (error) {
        toast.error('Failed to update condition')
        return false
      }
      toast.success('Condition updated')
      await fetchAssets()
      await loadDetail(assetId)
      return true
    },
    [fetchAssets, loadDetail]
  )

  const checkOut = useCallback(
    async (payload: {
      asset_id: string
      assigned_to: string
      expected_return_date: string | null
      notes: string
    }) => {
      const { error } = await supabase.from('asset_assignments').insert(payload)
      if (error) {
        toast.error('Failed to check out asset')
        return false
      }
      toast.success('Asset checked out')
      await fetchAssets()
      await loadDetail(payload.asset_id)
      return true
    },
    [fetchAssets, loadDetail]
  )

  const checkIn = useCallback(
    async (assignmentId: string, assetId: string) => {
      const { error } = await supabase
        .from('asset_assignments')
        .update({ checked_in_at: new Date().toISOString() })
        .eq('id', assignmentId)
        .is('checked_in_at', null)
      if (error) {
        toast.error('Failed to check in asset')
        return false
      }
      toast.success('Asset checked in')
      await fetchAssets()
      await loadDetail(assetId)
      return true
    },
    [fetchAssets, loadDetail]
  )

  const submitRequest = useCallback(
    async (payload: {
      asset_id: string
      department_id: string
      reason: string
      expected_return_date: string | null
      requested_by: string
    }) => {
      const { error } = await supabase.from('asset_requests').insert(payload)
      if (error) {
        toast.error('Failed to submit request')
        return false
      }
      toast.success('Request submitted')
      await fetchRequests()
      return true
    },
    [fetchRequests]
  )

  const approveRequest = useCallback(
    async (
      requestId: string,
      assetId: string,
      assignTo: string,
      returnDate: string | null,
      reviewNote: string,
      reviewedBy: string
    ) => {
      const { error: reqErr } = await supabase
        .from('asset_requests')
        .update({ status: 'approved', reviewed_by: reviewedBy, review_note: reviewNote })
        .eq('id', requestId)
      if (reqErr) {
        toast.error('Failed to approve request')
        return false
      }
      const { error: assignErr } = await supabase.from('asset_assignments').insert({
        asset_id: assetId,
        assigned_to: assignTo,
        expected_return_date: returnDate,
        notes: reviewNote,
      })
      if (assignErr) {
        toast.error('Assignment failed after approval')
        return false
      }
      toast.success('Request approved — asset checked out')
      await fetchRequests()
      await fetchAssets()
      return true
    },
    [fetchRequests, fetchAssets]
  )

  const denyRequest = useCallback(
    async (requestId: string, reviewNote: string, reviewedBy: string) => {
      const { error } = await supabase
        .from('asset_requests')
        .update({ status: 'denied', reviewed_by: reviewedBy, review_note: reviewNote })
        .eq('id', requestId)
      if (error) {
        toast.error('Failed to deny request')
        return false
      }
      toast.success('Request denied')
      await fetchRequests()
      return true
    },
    [fetchRequests]
  )

  const resolveAlert = useCallback(
    async (alertId: string) => {
      const { error } = await supabase
        .from('asset_alerts')
        .update({ resolved: true })
        .eq('id', alertId)
      if (error) {
        toast.error('Failed to resolve alert')
        return false
      }
      toast.success('Alert resolved')
      await fetchAlerts()
      return true
    },
    [fetchAlerts]
  )

  const escalateToMissing = useCallback(
    async (assetId: string, assignmentId: string | null) => {
      const { error } = await supabase.from('asset_alerts').insert({
        asset_id: assetId,
        assignment_id: assignmentId,
        alert_type: 'missing',
      })
      if (error) {
        toast.error('Failed to escalate')
        return false
      }
      toast.success('Escalated to missing')
      await fetchAlerts()
      return true
    },
    [fetchAlerts]
  )

  return {
    assets,
    categories,
    members,
    departments,
    filterDept,
    setFilterDept,
    loading,
    detail,
    detailLoading,
    loadDetail,
    closeDetail,
    addCategory,
    addAsset,
    updateAsset,
    deleteAsset,
    updateCondition,
    checkOut,
    checkIn,
    pendingRequests,
    alerts,
    fetchRequests,
    fetchAlerts,
    submitRequest,
    approveRequest,
    denyRequest,
    resolveAlert,
    escalateToMissing,
    generateAndSaveQR,
  }
}
