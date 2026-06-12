import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useITLayout } from './ITLayoutContext'
import { LicenseKpis } from './licenses/LicenseKpis'
import { LicenseSpendChart } from './licenses/LicenseSpendChart'
import { LicenseTable } from './licenses/LicenseTable'
import { LicenseModal } from './licenses/LicenseModal'
import { LicenseDeleteModal } from './licenses/LicenseDeleteModal'
import type { License, LicenseFormData, Category, LicenseStatus } from './licenses/types'
import { EMPTY_FORM } from './licenses/types'

export default function ITLicenses() {
  useITLayout('Licenses', 'license', 'Track software subscriptions, domains, and renewals.')

  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'All'>('All')
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All')
  const [modal, setModal] = useState<{
    mode: 'add' | 'edit'
    data: LicenseFormData
    id?: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<License | null>(null)
  const [hardDeleteTarget, setHardDeleteTarget] = useState<License | null>(null)
  const [saving, setSaving] = useState(false)

  const loadLicenses = useCallback(async () => {
    const { data, error } = await supabase
      .from('it_licenses')
      .select('*')
      .order('renewal_date', { ascending: true })
    if (error) {
      toast.error('Failed to load licenses')
      return
    }
    setLicenses((data ?? []) as License[])
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLicenses()
  }, [loadLicenses])

  // ── Derived filtered list ──
  const filtered = useMemo(
    () =>
      licenses.filter((l) => {
        if (statusFilter !== 'All' && l.status !== statusFilter) return false
        if (categoryFilter !== 'All' && l.category !== categoryFilter) return false
        return true
      }),
    [licenses, statusFilter, categoryFilter]
  )

  // ── Mutations ──
  const handleSave = async (formData: LicenseFormData) => {
    setSaving(true)
    const payload = {
      software_name: formData.software_name.trim(),
      vendor: formData.vendor.trim(),
      category: formData.category,
      cost: formData.cost,
      billing_cycle: formData.billing_cycle,
      renewal_date: formData.renewal_date,
      auto_renew: formData.auto_renew,
      status: formData.status,
      url: formData.url?.trim() || null,
      notes: formData.notes?.trim() || null,
    }
    const { error } =
      modal!.mode === 'add'
        ? await supabase.from('it_licenses').insert(payload)
        : await supabase.from('it_licenses').update(payload).eq('id', modal!.id!)
    setSaving(false)
    if (error) {
      toast.error('Failed to save license')
      return
    }
    toast.success(modal!.mode === 'add' ? 'License added' : 'License updated')
    setModal(null)
    await loadLicenses()
  }

  const handleSoftDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const { error } = await supabase
      .from('it_licenses')
      .update({ status: 'Cancelled' })
      .eq('id', deleteTarget.id)
    setSaving(false)
    if (error) {
      toast.error('Failed to cancel license')
      return
    }
    toast.success(`${deleteTarget.software_name} cancelled`)
    setDeleteTarget(null)
    await loadLicenses()
  }

  const handleHardDelete = async () => {
    if (!hardDeleteTarget) return
    setSaving(true)
    const { error } = await supabase.from('it_licenses').delete().eq('id', hardDeleteTarget.id)
    setSaving(false)
    if (error) {
      toast.error('Failed to delete license')
      return
    }
    toast.success(`${hardDeleteTarget.software_name} permanently deleted`)
    setHardDeleteTarget(null)
    await loadLicenses()
  }

  const handleOpenEdit = (l: License) => {
    setModal({
      mode: 'edit',
      id: l.id,
      data: {
        software_name: l.software_name,
        vendor: l.vendor,
        category: l.category,
        cost: l.cost,
        billing_cycle: l.billing_cycle,
        renewal_date: l.renewal_date,
        auto_renew: l.auto_renew,
        status: l.status,
        url: l.url ?? '',
        notes: l.notes ?? '',
      },
    })
  }

  const active = useMemo(() => licenses.filter((l) => l.status === 'Active'), [licenses])

  return (
    <div className="main" style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <LicenseKpis licenses={licenses} loading={loading} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: active.length ? '260px 1fr' : '1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <LicenseSpendChart licenses={licenses} />

        <LicenseTable
          filteredLicenses={filtered}
          loading={loading}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onAdd={() => setModal({ mode: 'add', data: { ...EMPTY_FORM } })}
          onEdit={handleOpenEdit}
          onCancel={setDeleteTarget}
          onDelete={setHardDeleteTarget}
        />
      </div>

      {modal && (
        <LicenseModal
          key={modal.id || 'add'}
          isOpen={!!modal}
          mode={modal.mode}
          initialData={modal.data}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <LicenseDeleteModal
          isOpen={!!deleteTarget}
          title="Cancel License"
          description={
            <span>
              Mark <strong>{deleteTarget.software_name}</strong> as Cancelled? It will be kept in
              history but hidden from Active/Inactive views.
            </span>
          }
          confirmText="Cancel License"
          saving={saving}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleSoftDelete}
        />
      )}

      {hardDeleteTarget && (
        <LicenseDeleteModal
          isOpen={!!hardDeleteTarget}
          title="Permanently Delete"
          description={
            <span>
              Permanently delete <strong>{hardDeleteTarget.software_name}</strong>? This cannot be
              undone.
            </span>
          }
          confirmText="Delete Forever"
          saving={saving}
          onClose={() => setHardDeleteTarget(null)}
          onConfirm={handleHardDelete}
        />
      )}
    </div>
  )
}
