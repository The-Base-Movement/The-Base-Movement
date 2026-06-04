import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Asset, AssetCategory, AssetDetail, AssetCondition, ViewMode } from './types'

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

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('assets')
      .select(
        `id, name, category_id, department_id, condition,
         serial_number, description, created_at,
         asset_categories ( name ),
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
      .select('id, name, department_id, created_at')
      .or(`department_id.eq.${departmentId},department_id.is.null`)
      .order('name')
    setCategories(data ?? [])
  }, [departmentId])

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from('users').select('id, full_name').order('full_name')
    setMembers(data ?? [])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssets()
  }, [fetchAssets])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories()
  }, [fetchCategories])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMembers()
  }, [fetchMembers])

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
    }) => {
      const { error } = await supabase
        .from('assets')
        .insert({ ...payload, department_id: departmentId })
      if (error) {
        toast.error('Failed to add asset')
        return false
      }
      toast.success('Asset added')
      await fetchAssets()
      return true
    },
    [departmentId, fetchAssets]
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
  }
}
