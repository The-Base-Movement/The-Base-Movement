import { useEffect, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { toast } from 'sonner'
import { faqService, type FaqItem } from '@/services/faqService'
import { useDeleteModal } from '@/hooks/useDeleteModal'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { TINYMCE_LICENSE_KEY, TINYMCE_SCRIPT_SRC } from '@/lib/tinymce'
import { DotLoader } from '@/components/states'

const CATEGORY_OPTIONS = [
  'General & Mission',
  'Founder & Leadership',
  'Diaspora & Registration',
  'App & Security',
]

const EMPTY_FORM = {
  slug: '',
  category: CATEGORY_OPTIONS[0],
  question: '',
  answerHtml: '',
  isPublished: true,
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export default function FAQManagement() {
  const [items, setItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const { openDelete, modal } = useDeleteModal()

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      setItems(await faqService.getAllFaqItems())
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setFormData(EMPTY_FORM)
    setIsCreating(true)
  }

  function openEdit(item: FaqItem) {
    setFormData({
      slug: item.slug,
      category: item.category,
      question: item.question,
      answerHtml: item.answerHtml,
      isPublished: item.isPublished,
    })
    setEditingItem(item)
  }

  function closeModal() {
    setIsCreating(false)
    setEditingItem(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.question.trim() || !formData.answerHtml.trim()) {
      toast.error('Question and answer are required')
      return
    }
    setIsSubmitting(true)
    try {
      if (isCreating) {
        const slug = formData.slug.trim() || slugify(formData.question)
        const ok = await faqService.createFaqItem({
          slug,
          category: formData.category,
          question: formData.question.trim(),
          answerHtml: formData.answerHtml,
          sortOrder: items.length,
          isPublished: formData.isPublished,
        })
        if (ok) {
          toast.success('FAQ item created')
          closeModal()
          fetchItems()
        } else {
          toast.error('Failed to create FAQ item')
        }
      } else if (editingItem) {
        const ok = await faqService.updateFaqItem(editingItem.id, {
          slug: formData.slug.trim() || editingItem.slug,
          category: formData.category,
          question: formData.question.trim(),
          answerHtml: formData.answerHtml,
          isPublished: formData.isPublished,
        })
        if (ok) {
          toast.success('FAQ item updated')
          closeModal()
          fetchItems()
        } else {
          toast.error('Failed to update FAQ item')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDelete(item: FaqItem) {
    openDelete({
      itemName: item.question,
      title: 'Delete FAQ item',
      description: 'Are you sure you want to permanently delete this FAQ item?',
      isPermanent: true,
      successMessage: 'FAQ item deleted',
      errorMessage: 'Delete failed',
      onConfirm: async () => {
        const success = await faqService.deleteFaqItem(item.id)
        if (success) fetchItems()
        return success
      },
    })
  }

  async function handleTogglePublish(item: FaqItem) {
    const ok = await faqService.updateFaqItem(item.id, { isPublished: !item.isPublished })
    if (ok) {
      toast.success(item.isPublished ? 'Unpublished' : 'Published')
      fetchItems()
    } else {
      toast.error('Failed to update publish status')
    }
  }

  async function handleReorder(item: FaqItem, direction: 'up' | 'down') {
    const ok = await faqService.reorderFaqItem(items, item.id, direction)
    if (ok) fetchItems()
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 0',
        }}
      >
        <DotLoader label="Loading FAQ items…" />
      </div>
    )
  }

  return (
    <div className="main">
      <AdminPageHeader
        title="FAQ management"
        icon="quiz"
        description="Manage the questions and answers shown on the public FAQ page."
        actions={
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              add
            </span>
            Add FAQ item
          </button>
        }
      />

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {items.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'hsl(var(--on-surface-muted))' }}>
            No FAQ items yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                {['Order', 'Category', 'Question', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 16px',
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={i === 0}
                      onClick={() => handleReorder(item, 'up')}
                      style={{ padding: 4, minWidth: 0 }}
                      aria-label="Move up"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        arrow_upward
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={i === items.length - 1}
                      onClick={() => handleReorder(item, 'down')}
                      style={{ padding: 4, minWidth: 0 }}
                      aria-label="Move down"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        arrow_downward
                      </span>
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: 13, maxWidth: 360 }}>
                    {item.question}
                    <div style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
                      /faq#{item.slug}
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <button
                      type="button"
                      className={`pill ${item.isPublished ? 'pill-ok' : 'pill-mute'}`}
                      onClick={() => handleTogglePublish(item)}
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {item.isPublished ? 'Published' : 'Hidden'}
                    </button>
                  </td>
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => openEdit(item)}
                      style={{ marginRight: 8 }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-dest btn-sm"
                      onClick={() => handleDelete(item)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(isCreating || editingItem) && (
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
          onClick={closeModal}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="panel"
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: 16,
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              {isCreating ? 'Add FAQ item' : 'Edit FAQ item'}
            </h3>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      boxSizing: 'border-box',
                    }}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, marginBottom: 6 }}>
                    Slug (URL anchor)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    placeholder={formData.question ? slugify(formData.question) : 'auto-generated'}
                    onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, marginBottom: 6 }}>Question</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    height: 38,
                    padding: '0 12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, marginBottom: 6 }}>Answer</label>
                <Editor
                  key={editingItem?.id ?? 'new'}
                  tinymceScriptSrc={TINYMCE_SCRIPT_SRC}
                  licenseKey={TINYMCE_LICENSE_KEY}
                  initialValue={formData.answerHtml}
                  onEditorChange={(html) => setFormData((prev) => ({ ...prev, answerHtml: html }))}
                  init={{
                    height: 320,
                    menubar: false,
                    plugins: ['autolink', 'lists', 'link', 'charmap'],
                    toolbar: 'undo redo | bold italic | bullist numlist | link | removeformat',
                    statusbar: false,
                    branding: false,
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                Published (visible on the public FAQ page)
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn btn-outline" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : isCreating ? 'Create' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal}
    </div>
  )
}
