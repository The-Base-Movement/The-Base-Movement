import { useState, useEffect, useCallback } from 'react'
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
import { SpendingCategoryModal } from './spendingledger/SpendingCategoryModal'

interface Category {
  id: string
  name: string
}

export default function SpendingLedger() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | 'categories' | null>(null)
  const [selected, setSelected] = useState<Entry | null>(null)
  const [form, setForm] = useState<FormState>({
    chapter: '',
    amount: '',
    description: '',
    category: '',
    timestamp: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [categories, setCategories] = useState<Category[]>([])

  const loadCategories = useCallback(async () => {
    const data = await adminService.getSpendingCategories()
    setCategories(data)
  }, [])

  async function load() {
    const data = await adminService.getAllSpendingEntries()
    setEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void load()
      void loadCategories()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadCategories])

  function openAdd() {
    setForm({
      chapter: '',
      amount: '',
      description: '',
      category: categories[0]?.name ?? '',
      timestamp: new Date().toISOString().split('T')[0],
    })
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
    if (!form.description.trim() || !form.chapter.trim() || !form.amount || !form.category.trim()) {
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
      category: form.category.trim(),
      timestamp: new Date(form.timestamp).toISOString(),
    }

    const ok =
      modal === 'add'
        ? await adminService.addSpendingEntry(payload)
        : await adminService.updateSpendingEntry(selected!.id, payload)

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

  const allFilterCategories = ['All', ...categories.map((c) => c.name)]

  const filtered = entries.filter((e) => {
    const matchesSearch =
      !searchQuery ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="main">
      <AdminPageHeader
        title="Movement spending ledger"
        icon="account_balance_wallet"
        description="Record and manage strategic fund allocations and regional mobilization expenditures."
        actions={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setModal('categories')}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                category
              </span>
              Categories
            </button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                add_circle
              </span>
              Add entry
            </button>
          </>
        }
      />

      <SpendingLedgerKPIs entries={entries} loading={loading} />

      <SpendingLedgerTable
        filtered={filtered}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        allCategories={allFilterCategories}
        openEdit={openEdit}
        openDelete={openDelete}
      />

      <SpendingLedgerMobileList
        filtered={filtered}
        loading={loading}
        searchQuery={searchQuery}
        openEdit={openEdit}
        openDelete={openDelete}
      />

      <SpendingFormModal
        isOpen={modal === 'add' || modal === 'edit'}
        isEdit={modal === 'edit'}
        onClose={() => setModal(null)}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
      />

      <SpendingDeleteModal
        isOpen={modal === 'delete'}
        onClose={() => setModal(null)}
        selected={selected}
        saving={saving}
        onDelete={handleDelete}
      />

      <SpendingCategoryModal
        isOpen={modal === 'categories'}
        onClose={() => setModal(null)}
        categories={categories}
        onChanged={loadCategories}
      />
    </div>
  )
}
