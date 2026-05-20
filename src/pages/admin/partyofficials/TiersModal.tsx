import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { inputSt, type PartyTier } from './utils'

interface TiersModalProps {
  setIsTiersModalOpen: (open: boolean) => void
  tiers: PartyTier[]
  tierFormData: Partial<PartyTier>
  setTierFormData: React.Dispatch<React.SetStateAction<Partial<PartyTier>>>
  editingTierId: string | null
  setEditingTierId: (id: string | null) => void
  fetchTiers: () => Promise<void>
}

export function TiersModal({
  setIsTiersModalOpen,
  tiers,
  tierFormData,
  setTierFormData,
  editingTierId,
  setEditingTierId,
  fetchTiers,
}: TiersModalProps) {
  const handleDeleteTier = async (id: string) => {
    if (confirm('Are you sure you want to delete this tier?')) {
      const { error } = await supabase.from('party_tiers').delete().eq('id', id)
      if (error) {
        toast.error('Failed to delete tier')
      } else {
        toast.success('Tier deleted')
        fetchTiers()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTierId) {
      const { error } = await supabase
        .from('party_tiers')
        .update(tierFormData)
        .eq('id', editingTierId)
      if (error) {
        toast.error('Failed to update tier')
      } else {
        toast.success('Tier updated')
        setTierFormData({ name: '', title: '', description: '', order_index: 0 })
        setEditingTierId(null)
        fetchTiers()
      }
    } else {
      const { error } = await supabase.from('party_tiers').insert([tierFormData])
      if (error) {
        toast.error('Failed to create tier')
      } else {
        toast.success('Tier created')
        setTierFormData({ name: '', title: '', description: '', order_index: 0 })
        setEditingTierId(null)
        fetchTiers()
      }
    }
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        overflowY: 'auto',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
      onClick={() => setIsTiersModalOpen(false)}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 4,
          width: '100%',
          maxWidth: 600,
          margin: 'auto',
          flexShrink: 0,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
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
            background: 'hsl(var(--on-surface))',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 15,
                color: '#fff',
                margin: 0,
              }}
            >
              Manage Party Tiers
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTiersModalOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Existing Tiers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tiers.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'hsl(var(--container-low))',
                    borderRadius: 4,
                    border: '1px solid hsl(var(--border))',
                    overflow: 'hidden',
                  }}
                >
                  {/* Title section */}
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'hsl(var(--on-surface))' }}>
                      {t.title}{' '}
                      <span
                        style={{
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          fontWeight: 600,
                        }}
                      >
                        ({t.name})
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', marginTop: 2 }}
                    >
                      Order: {t.order_index}
                    </div>
                  </div>
                  {/* Footer actions */}
                  <div style={{ display: 'flex', borderTop: '1px solid hsl(var(--border))' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      style={{
                        flex: 1,
                        borderRadius: 0,
                        border: 'none',
                        borderRight: '1px solid hsl(var(--border))',
                        justifyContent: 'center',
                      }}
                      onClick={() => {
                        setTierFormData(t)
                        setEditingTierId(t.id)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      style={{
                        flex: 1,
                        borderRadius: 0,
                        border: 'none',
                        justifyContent: 'center',
                        color: 'hsl(var(--destructive))',
                      }}
                      onClick={() => handleDeleteTier(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <h4
            style={{
              fontSize: 13,
              fontWeight: 800,
              marginBottom: 12,
              borderTop: '1px solid hsl(var(--border))',
              paddingTop: 20,
            }}
          >
            {editingTierId ? 'Edit Tier' : 'Create New Tier'}
          </h4>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label
                  htmlFor="tier-name"
                  style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}
                >
                  Internal Name (e.g. executive)
                </label>
                <input
                  id="tier-name"
                  name="name"
                  required
                  style={inputSt}
                  value={tierFormData.name || ''}
                  onChange={(e) =>
                    setTierFormData({
                      ...tierFormData,
                      name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                    })
                  }
                  disabled={!!editingTierId}
                />
              </div>
              <div>
                <label
                  htmlFor="tier-title"
                  style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}
                >
                  Display Title
                </label>
                <input
                  id="tier-title"
                  name="title"
                  required
                  style={inputSt}
                  value={tierFormData.title || ''}
                  onChange={(e) => setTierFormData({ ...tierFormData, title: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="tier-description"
                style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}
              >
                Description
              </label>
              <textarea
                id="tier-description"
                name="description"
                style={{ ...inputSt, height: 60, padding: '8px 12px', resize: 'vertical' }}
                value={tierFormData.description || ''}
                onChange={(e) => setTierFormData({ ...tierFormData, description: e.target.value })}
              />
            </div>
            <div>
              <label
                htmlFor="tier-order"
                style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}
              >
                Order Index (lower = higher up)
              </label>
              <input
                id="tier-order"
                name="order_index"
                required
                type="number"
                style={inputSt}
                value={tierFormData.order_index ?? 0}
                onChange={(e) =>
                  setTierFormData({
                    ...tierFormData,
                    order_index: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              {editingTierId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setTierFormData({ name: '', title: '', description: '', order_index: 0 })
                    setEditingTierId(null)
                  }}
                  style={{ flex: 1, height: 42 }}
                >
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 42 }}>
                {editingTierId ? 'Save Tier' : 'Create Tier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  )
}
