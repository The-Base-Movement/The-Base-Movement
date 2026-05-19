import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { toast } from 'sonner'

const CATEGORIES = [
  'Printing',
  'Transport',
  'Events',
  'Supplies',
  'Administration',
  'Canvassing',
  'Other',
]

interface Entry {
  id: string
  chapter: string
  amount: number
  description: string
  category: string
  timestamp: string
}

interface FormState {
  chapter: string
  amount: string
  description: string
  category: string
  timestamp: string
}

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

  const totalSpent = entries.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="main">
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 26,
            color: 'hsl(var(--on-surface))',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}
        >
          Expenses
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'hsl(var(--on-surface-muted))',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 600,
          }}
        >
          Record and manage how donated funds have been used.
        </p>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        {[
          {
            label: 'Total entries',
            value: loading ? '—' : entries.length.toString(),
            icon: 'receipt_long',
            bar: 'hsl(var(--on-surface))',
          },
          {
            label: 'Total spent',
            value: loading ? '—' : `₵ ${totalSpent.toLocaleString()}`,
            icon: 'payments',
            bar: 'hsl(var(--primary))',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: kpi.bar,
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'hsl(var(--on-surface-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0,
                }}
              >
                {kpi.label}
              </p>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
              >
                {kpi.icon}
              </span>
            </div>
            <p
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'hsl(var(--on-surface))',
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table panel */}
      <div className="panel">
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              search
            </span>
            <input
              aria-label="Search spending entries"
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                paddingLeft: 34,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontSize: 13,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button onClick={openAdd} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add
            </span>
            Add entry
          </button>
        </div>

        {/* Desktop table */}
        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--container-low))',
                }}
              >
                {['Description', 'Category', 'Chapter', 'Amount', 'Date', ''].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '10px 16px',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: i === 3 || i === 5 ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '48px 16px',
                      textAlign: 'center',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 13,
                      fontStyle: 'italic',
                    }}
                  >
                    Loading entries…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '56px 16px', textAlign: 'center' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 36,
                        color: 'hsl(var(--border))',
                        display: 'block',
                        marginBottom: 12,
                      }}
                    >
                      receipt_long
                    </span>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'hsl(var(--on-surface-muted))',
                        fontWeight: 500,
                        margin: 0,
                      }}
                    >
                      {searchQuery
                        ? 'No entries match your search.'
                        : 'No expenses yet. Add the first one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'hsl(var(--on-surface))',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.description}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 3,
                          background: 'hsl(var(--container-low))',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {entry.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: 0,
                        }}
                      >
                        {entry.chapter}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: 'hsl(var(--on-surface))',
                          margin: 0,
                          fontFamily: "'Public Sans', sans-serif",
                        }}
                      >
                        ₵ {Number(entry.amount).toLocaleString()}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: 0,
                        }}
                      >
                        {new Date(entry.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(entry)} className="btn btn-outline btn-sm">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            edit
                          </span>
                        </button>
                        <button onClick={() => openDelete(entry)} className="btn btn-dest btn-sm">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontSize: 13,
                fontStyle: 'italic',
              }}
            >
              Loading entries…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 16px', textAlign: 'center' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 32,
                  color: 'hsl(var(--border))',
                  display: 'block',
                  marginBottom: 10,
                }}
              >
                receipt_long
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                {searchQuery
                  ? 'No entries match your search.'
                  : 'No expenses yet. Add the first one.'}
              </p>
            </div>
          ) : (
            filtered.map((entry) => (
              <div
                key={entry.id}
                style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'hsl(var(--on-surface))',
                        margin: '0 0 4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.description}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: '0 0 6px',
                      }}
                    >
                      {entry.chapter}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 3,
                          background: 'hsl(var(--container-low))',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {entry.category}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {new Date(entry.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: 'hsl(var(--on-surface))',
                        margin: '0 0 8px',
                        fontFamily: "'Public Sans', sans-serif",
                      }}
                    >
                      ₵ {Number(entry.amount).toLocaleString()}
                    </p>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => openEdit(entry)} className="btn btn-outline btn-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          edit
                        </span>
                      </button>
                      <button onClick={() => openDelete(entry)} className="btn btn-dest btn-sm">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModal(null)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 520,
              background: '#fff',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: 'hsl(var(--on-surface))',
                    fontFamily: "'Public Sans', sans-serif",
                    letterSpacing: '-0.01em',
                    margin: 0,
                  }}
                >
                  {modal === 'add' ? 'Add spending entry' : 'Edit spending entry'}
                </h3>
                <p
                  style={{
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  This will appear in the public "How funds are used" tab.
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                style={{
                  width: 32,
                  height: 32,
                  border: '1px solid hsl(var(--border))',
                  background: '#fff',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--on-surface-muted))',
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label
                  htmlFor="sl-description"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'hsl(var(--on-surface-muted))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  What was it for? *
                </label>
                <input
                  id="sl-description"
                  name="sl-description"
                  type="text"
                  placeholder="e.g. Printed 500 flyers for Kumasi East rally"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  style={{
                    width: '100%',
                    height: 40,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 600,
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    htmlFor="sl-amount"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Amount (GHS) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      ₵
                    </span>
                    <input
                      id="sl-amount"
                      name="sl-amount"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      style={{
                        width: '100%',
                        height: 40,
                        paddingLeft: 24,
                        paddingRight: 10,
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 4,
                        fontSize: 13,
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 600,
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="sl-category"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Category *
                  </label>
                  <select
                    id="sl-category"
                    name="sl-category"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 10px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      fontSize: 13,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 600,
                      background: '#fff',
                      color: 'hsl(var(--on-surface))',
                      boxSizing: 'border-box',
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label
                    htmlFor="sl-chapter"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Chapter *
                  </label>
                  <input
                    id="sl-chapter"
                    name="sl-chapter"
                    type="text"
                    placeholder="e.g. Accra Central"
                    value={form.chapter}
                    onChange={(e) => setForm((p) => ({ ...p, chapter: e.target.value }))}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      fontSize: 13,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 600,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="sl-date"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Date *
                  </label>
                  <input
                    id="sl-date"
                    name="sl-date"
                    type="date"
                    value={form.timestamp}
                    onChange={(e) => setForm((p) => ({ ...p, timestamp: e.target.value }))}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 10px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 4,
                      fontSize: 13,
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 600,
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                background: 'hsl(var(--container-low))',
              }}
            >
              <button onClick={() => setModal(null)} className="btn btn-outline btn-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? 'Saving…' : modal === 'add' ? 'Add entry' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {modal === 'delete' && selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setModal(null)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '20px 20px 16px' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'hsla(var(--destructive), 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: 'hsl(var(--destructive))' }}
                >
                  delete
                </span>
              </div>
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: 15,
                  color: 'hsl(var(--on-surface))',
                  fontFamily: "'Public Sans', sans-serif",
                  margin: '0 0 6px',
                }}
              >
                Delete entry?
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: 'hsl(var(--on-surface-muted))',
                  fontWeight: 500,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                "{selected.description}" will be removed from the public spending ledger. This
                cannot be undone.
              </p>
            </div>
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid hsl(var(--border))',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                background: 'hsl(var(--container-low))',
              }}
            >
              <button onClick={() => setModal(null)} className="btn btn-outline btn-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving} className="btn btn-dest btn-sm">
                {saving ? 'Deleting…' : 'Delete entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
