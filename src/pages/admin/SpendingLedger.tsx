import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Modular imports
import type { Entry, FormState } from './spendingledger/types'
import { SpendingLedgerKPIs } from './spendingledger/SpendingLedgerKPIs'
import { SpendingLedgerTable } from './spendingledger/SpendingLedgerTable'
import { SpendingLedgerMobileList } from './spendingledger/SpendingLedgerMobileList'
import { SpendingFormModal } from './spendingledger/SpendingFormModal'
import { SpendingDeleteModal } from './spendingledger/SpendingDeleteModal'

const EMPTY_FORM: FormState = {
  chapter: '',
  amount: '',
  description: '',
  category: 'Printing',
  timestamp: new Date().toISOString().split('T')[0],
}

export default function SpendingLedger() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<Entry | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  async function load() {
    setLoading(true)
    const data = await adminService.getAllSpendingEntries()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  function openAdd() {
    setForm(EMPTY_FORM)
    setSelected(null)
    setModal('add')
  }

  function openEdit(entry: Entry) {
    setSelected(entry)
    setForm({
      chapter: entry.chapter,
      amount: entry.amount.toString(),
      description: entry.description,
      category: entry.category,
      timestamp: entry.timestamp.split('T')[0],
    })
    setModal('edit')
  }

  function openDelete(entry: Entry) {
    setSelected(entry)
    setModal('delete')
  }

  async function handleSave() {
    if (!form.description.trim() || !form.chapter.trim() || !form.amount) {
      toast.error('Please fill in all required fields.')
      return
    }
    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount.')
      return
    }

    setSaving(true)
    const payload = {
      chapter: form.chapter.trim(),
      amount,
      description: form.description.trim(),
      category: form.category,
      timestamp: new Date(form.timestamp).toISOString(),
    }

    let ok: boolean
    if (modal === 'add') {
      ok = await adminService.addSpendingEntry(payload)
    } else {
      ok = await adminService.updateSpendingEntry(selected!.id, payload)
    }

    setSaving(false)
    if (ok) {
      toast.success(modal === 'add' ? 'Entry added.' : 'Entry updated.')
      setModal(null)
      load()
    } else {
      toast.error('Failed to save. Check your permissions.')
    }
  }

  async function handleDelete() {
    if (!selected) return
    setSaving(true)
    const ok = await adminService.deleteSpendingEntry(selected.id)
    setSaving(false)
    if (ok) {
      toast.success('Entry deleted.')
      setModal(null)
      load()
    } else {
      toast.error('Failed to delete. Check your permissions.')
    }
  }

  const filtered = entries.filter((e) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      e.description.toLowerCase().includes(q) ||
      e.chapter.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    )
  })

  return (
    <div className="main">
      <AdminPageHeader
        title="Movement spending ledger"
        icon="account_balance_wallet"
        description="Record and manage strategic fund allocations and regional mobilization expenditures."
      />

      {/* KPIs */}
      <SpendingLedgerKPIs entries={entries} loading={loading} />

      {/* Table / List panel */}
      <SpendingLedgerTable
        filtered={filtered}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        openAdd={openAdd}
        openEdit={openEdit}
        openDelete={openDelete}
      />

      {/* Mobile cards */}
      <SpendingLedgerMobileList
        filtered={filtered}
        loading={loading}
        searchQuery={searchQuery}
        openEdit={openEdit}
        openDelete={openDelete}
      />

      {/* Add / Edit modal */}
      <SpendingFormModal
        isOpen={modal === 'add' || modal === 'edit'}
        isEdit={modal === 'edit'}
        onClose={() => setModal(null)}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
      />

      {/* Delete confirmation modal */}
      <SpendingDeleteModal
        isOpen={modal === 'delete'}
        onClose={() => setModal(null)}
        selected={selected}
        saving={saving}
        onDelete={handleDelete}
      />
    </div>
  )
}
