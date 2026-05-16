import React from 'react'
import type { InventoryItem } from '@/services/adminService'

interface ProductFormDialogProps {
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  selectedProduct: Partial<InventoryItem> | null
  setSelectedProduct: React.Dispatch<React.SetStateAction<Partial<InventoryItem> | null>>
  isSaving: boolean
  handleSave: () => void
  isUploadingImage: boolean
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeImage: (url: string) => void
}

const inputSt: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700, fontSize: 12, borderRadius: 4,
  color: 'hsl(var(--on-surface))', boxSizing: 'border-box',
}

const labelSt: React.CSSProperties = {
  fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 11,
  color: 'hsl(var(--on-surface-muted))', display: 'block', marginBottom: 6,
}

export function ProductFormDialog({
  isModalOpen,
  setIsModalOpen,
  selectedProduct,
  setSelectedProduct,
  isSaving,
  handleSave,
  isUploadingImage,
  handleImageUpload,
  removeImage
}: ProductFormDialogProps) {
  if (!isModalOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
    }}>
      <div className="panel animate-in zoom-in-95 duration-200" style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="ph">
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>{selectedProduct?.id ? 'Edit inventory item' : 'New movement gear'}</h3>
            <p style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', fontWeight: 700, margin: '4px 0 0' }}>Configure product metadata and logistical constraints.</p>
          </div>
          <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: 0, width: 32, height: 32 }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelSt}>Product Name</label>
              <input name="name-c63960" id="input-c63960" 
                style={inputSt}
                value={selectedProduct?.name || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, name: e.target.value }))}
                placeholder="e.g. Movement Flagship Tee"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelSt}>Category</label>
                <select name="name-4461bf" id="select-4461bf" 
                  style={inputSt}
                  value={selectedProduct?.category || ''} 
                  onChange={e => setSelectedProduct(prev => ({ ...prev!, category: e.target.value }))}
                >
                  <option value="">Select category</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Print">Print material</option>
                  <option value="Digital">Digital goods</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelSt}>Price</label>
                  <input name="name-88b8ac" id="input-88b8ac" 
                    style={inputSt}
                    value={selectedProduct?.price || ''} 
                    onChange={e => setSelectedProduct(prev => ({ ...prev!, price: e.target.value }))}
                    placeholder="25.00"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelSt}>Stock</label>
                  <input name="name-ce252a" id="input-ce252a" 
                    style={inputSt}
                    type="number"
                    value={selectedProduct?.stock || 0} 
                    onChange={e => setSelectedProduct(prev => ({ ...prev!, stock: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelSt}>Short Summary</label>
              <textarea name="name-820e70" id="textarea-820e70" 
                style={{ ...inputSt, height: 80, padding: 12, resize: 'none' }}
                value={selectedProduct?.description || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, description: e.target.value }))}
                placeholder="Short patriotic summary..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelSt}>Full Details</label>
              <textarea name="name-a45e1f" id="textarea-a45e1f" 
                style={{ ...inputSt, height: 120, padding: 12, resize: 'vertical' }}
                value={selectedProduct?.longDescription || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, longDescription: e.target.value }))}
                placeholder="Complete product specs and movement significance..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelSt}>Product Gallery</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {(selectedProduct?.images || []).map((url, idx) => (
                  <div key={url} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 4, overflow: 'hidden', border: '1px solid hsl(var(--border))', background: 'hsl(var(--container-low))' }}>
                    <img src={url} alt={`Product ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      onClick={() => removeImage(url)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                ))}
                <label style={{ aspectRatio: '1/1', borderRadius: 4, border: '1px dashed hsl(var(--border))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'hsl(var(--container-low))' }}>
                  <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                  {isUploadingImage ? (
                    <span className="material-symbols-outlined animate-spin" style={{ color: 'hsl(var(--on-surface-muted))' }}>sync</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ color: 'hsl(var(--on-surface-muted))' }}>add</span>
                      <span style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', marginTop: 4 }}>Add image</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={labelSt}>Icon Fallback</label>
              <input name="name-24e641" id="input-24e641" 
                style={{ ...inputSt, textAlign: 'center', width: 80 }}
                value={selectedProduct?.image?.startsWith('http') ? '' : (selectedProduct?.image || '')} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, image: e.target.value }))}
                placeholder="👕"
              />
            </div>
          </div>
        </div>

        <div style={{ padding: 20, background: 'hsl(var(--container-low))', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ minWidth: 160 }} onClick={handleSave} disabled={isSaving}>
            {isSaving ? <span className="material-symbols-outlined animate-spin">sync</span> : 'Confirm changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
