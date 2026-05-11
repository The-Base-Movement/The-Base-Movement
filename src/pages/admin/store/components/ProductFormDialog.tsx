import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/neon-button'
import { Loader2, Plus, X } from 'lucide-react'
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
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-sm border-border/60">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {selectedProduct?.id ? 'Edit inventory item' : 'New movement gear'}
          </DialogTitle>
          <DialogDescription className="text-xs font-bold text-muted-foreground/80">
            Configure product metadata and logistical constraints.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-micro font-bold tracking-tight">Name</Label>
            <Input 
              value={selectedProduct?.name || ''} 
              onChange={e => setSelectedProduct(prev => ({ ...prev!, name: e.target.value }))}
              className="col-span-3 h-10 rounded-sm border-border/60 text-xs" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-micro font-bold tracking-tight">Category</Label>
            <Select 
              value={selectedProduct?.category} 
              onValueChange={v => setSelectedProduct(prev => ({ ...prev!, category: v }))}
            >
              <SelectTrigger className="col-span-3 h-10 rounded-sm border-border/60 text-xs font-bold">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="rounded-sm">
                <SelectItem value="Apparel">Apparel</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Print">Print material</SelectItem>
                <SelectItem value="Digital">Digital goods</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <Label className="text-right text-micro font-bold tracking-tight">Price</Label>
              <Input 
                value={selectedProduct?.price || ''} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, price: e.target.value }))}
                className="h-10 rounded-sm border-border/60 text-xs font-bold" 
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <Label className="text-right text-micro font-bold tracking-tight">Stock</Label>
              <Input 
                type="number"
                value={selectedProduct?.stock || 0} 
                onChange={e => setSelectedProduct(prev => ({ ...prev!, stock: parseInt(e.target.value) }))}
                className="h-10 rounded-sm border-border/60 text-xs font-bold" 
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right text-micro font-bold tracking-tight mt-3">Summary</Label>
            <textarea 
              value={selectedProduct?.description || ''} 
              onChange={e => setSelectedProduct(prev => ({ ...prev!, description: e.target.value }))}
              placeholder="Short patriotic summary..."
              className="col-span-3 min-h-[80px] bg-white rounded-sm border border-border/60 p-3 text-xs focus:ring-1 focus:ring-brand-green outline-none" 
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right text-micro font-bold tracking-tight mt-3">Full details</Label>
            <textarea 
              value={selectedProduct?.longDescription || ''} 
              onChange={e => setSelectedProduct(prev => ({ ...prev!, longDescription: e.target.value }))}
              placeholder="Complete product specs and movement significance..."
              className="col-span-3 min-h-[120px] bg-white rounded-sm border border-border/60 p-3 text-xs focus:ring-1 focus:ring-brand-green outline-none" 
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right text-micro font-bold tracking-tight mt-3">Product gallery</Label>
            <div className="col-span-3 space-y-4">
              {/* Image Grid */}
              <div className="grid grid-cols-4 gap-2">
                {(selectedProduct?.images || []).map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-sm overflow-hidden border border-border/60 bg-muted/10 group">
                    <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
                    <button 
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-on-surface/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Upload Placeholder */}
                <label className="aspect-square rounded-sm border border-dashed border-muted-foreground/60 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/10 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/80" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-muted-foreground/80" />
                      <span className="text-[8px] font-bold text-muted-foreground/80">Add image</span>
                    </>
                  )}
                </label>
              </div>

              <div className="flex flex-col gap-2">
                 <Label className="text-micro font-bold text-muted-foreground/80 capitalize tracking-tight">Icon fallback</Label>
                 <Input 
                  value={selectedProduct?.image?.startsWith('http') ? '' : (selectedProduct?.image || '')} 
                  onChange={e => setSelectedProduct(prev => ({ ...prev!, image: e.target.value }))}
                  placeholder="👕, 🧢, 🎒"
                  className="h-9 rounded-sm border-border/60 text-lg text-center w-24" 
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="rounded-sm text-micro font-bold capitalize tracking-tight h-11 px-8 hover:bg-muted/10 transition-all active:scale-95">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="rounded-sm text-micro font-bold capitalize tracking-tight bg-on-surface text-white hover:bg-on-surface/90 h-11 px-10 min-w-[160px] shadow-lg transition-all hover:scale-[1.02] active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
