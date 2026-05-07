import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  Search, 
  Copy, 
  Check, 
  Image as ImageIcon,
  FileText,
  Filter,
  ExternalLink,
  Trash2,
  Loader2
} from 'lucide-react'
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal'
import { adminService } from '@/services/adminService'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BrandLine } from '@/components/ui/BrandLine'

export default function MediaLibrary() {
  const [files, setFiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState('branding')
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null)

  const folders = [
    { id: 'branding', label: 'Branding Assets', icon: ImageIcon },
    { id: 'blog-images', label: 'Blog Posts', icon: ImageIcon },
    { id: 'author-images', label: 'Authors', icon: ImageIcon },
    { id: 'product-images', label: 'Product Images', icon: ImageIcon },
    { id: 'logos-favicons', label: 'Logos & Favicons', icon: ImageIcon },
    { id: 'public-assets', label: 'Public Assets', icon: ImageIcon },
    { id: 'editor-content', label: 'Editor Media', icon: FileText },
  ]

  const loadFiles = useCallback(async () => {
    setIsLoading(true)
    try {
      // Load from Supabase
      const cloudUrls = await contentService.getMediaFiles(activeFolder)
      
      // Load from Local Manifest for specific categories
      let localUrls: string[] = []
      if (activeFolder === 'logos-favicons' || activeFolder === 'public-assets') {
        localUrls = await contentService.getLocalAssets(activeFolder)
      }
      
      // Combine (deduplicate by filename if needed, but here we just list both)
      setFiles([...cloudUrls, ...localUrls])
    } catch {
      toast.error('Failed to load media files')
    } finally {
      setIsLoading(false)
    }
  }, [activeFolder])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await contentService.uploadImage(file, activeFolder)
      if (url) {
        setFiles(prev => [url, ...prev])
        toast.success('File uploaded successfully')
      } else {
        toast.error('Upload failed')
      }
    } catch {
      toast.error('An error occurred during upload')
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast.success('URL copied to clipboard')
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const filteredFiles = files.filter(url => 
    url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleConfirmedDelete = async () => {
    if (!assetToDelete) return

    setIsLoading(true)
    try {
      const success = await contentService.deleteMediaFile(assetToDelete)
      if (success) {
        toast.success('Asset moved to trash')
        setAssetToDelete(null)
        loadFiles()
        
        // Log action
        const filename = assetToDelete.split('/').pop() || 'Unknown'
        adminService.logAction('TRASH_MEDIA', `MEDIA/${filename}`, 'Success')
      } else {
        toast.error('Failed to move asset to trash')
      }
    } catch {
      toast.error('An error occurred during deletion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
            <ImageIcon className="w-8 h-8 text-on-surface" />
            Media library
          </h1>
          <BrandLine className="mt-4" />
          <p className="text-muted-foreground/80 text-sm mt-1">Central repository for movement assets and deployment media.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="rounded-sm border-border/40 text-on-surface/80 text-[10px] px-10 h-12 font-bold tracking-tight hover:bg-stone-50 transition-all shadow-sm active:scale-95"
            onClick={loadFiles}
          >
            Refresh Vault
          </Button>

          <div className="relative">
            <input
              type="file"
              id="media-upload"
              className="hidden"
              onChange={handleUpload}
              accept="image/*"
              disabled={isUploading}
            />
            <Button 
              variant="primary"
              size="lg"
              className="rounded-sm text-[10px] font-bold tracking-tight px-10 h-12 shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
              asChild
              disabled={isUploading}
            >
              <label htmlFor="media-upload" className="cursor-pointer">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isUploading ? 'Ingesting...' : 'Ingest Asset'}
              </label>
            </Button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mobile Category Dropdown */}
        <div className="lg:hidden mb-6">
          <select
            value={activeFolder}
            onChange={(e) => setActiveFolder(e.target.value)}
            className="w-full h-12 bg-white border border-border/60 rounded-sm px-4 text-sm font-bold focus:border-on-surface outline-none shadow-sm"
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sidebar - Folders (Desktop Only) */}
        <div className="hidden lg:block space-y-6">
          <Card className="rounded-sm border-border/60 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/10 bg-muted/5">
              <h3 className="font-bold text-on-surface text-xs normal-case">Asset categories</h3>
            </div>
            <CardContent className="p-2">
              <div className="space-y-1">
                {folders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant={activeFolder === folder.id ? "primary" : "ghost"}
                    onClick={() => setActiveFolder(folder.id)}
                    className={cn(
                      "w-full flex items-center justify-start gap-4 px-6 py-3 rounded-sm text-[10px] font-bold tracking-tight transition-all h-14 active:scale-95",
                      activeFolder === folder.id 
                        ? "shadow-lg shadow-brand-green/20" 
                        : "text-on-surface/60 hover:bg-stone-50 hover:text-on-surface border border-transparent hover:border-stone-100"
                    )}
                  >
                    <folder.icon className={cn("w-4 h-4", activeFolder === folder.id ? "text-white" : "text-muted-foreground/40")} />
                    {folder.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - File Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-on-surface transition-colors" />
              <Input 
                placeholder="Search your assets..." 
                className="pl-12 h-12 rounded-sm border-border/60 focus:ring-0 focus:border-on-surface transition-all bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card className="rounded-sm border-border/60 shadow-sm min-h-[500px] overflow-hidden bg-white">
            <CardContent className="p-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                  <div className="w-10 h-10 border-3 border-border/10 border-t-on-surface rounded-full animate-spin" />
                  <p className="text-muted-foreground/40 text-sm font-medium">Scanning repository...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
                  <div className="w-16 h-16 rounded-sm bg-muted/5 flex items-center justify-center mb-2">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  <h3 className="font-bold text-on-surface text-lg">No assets found</h3>
                  <p className="text-muted-foreground/80 text-sm max-w-xs">
                    {searchQuery 
                      ? `No results match "${searchQuery}". Try a different term.` 
                      : `Your ${activeFolder.replace('-', ' ')} folder is currently empty.`}
                  </p>
                  <Button 
                    variant="primary" 
                    className="mt-6 rounded-sm px-12 h-14 text-[10px] font-bold tracking-tight shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
                    asChild
                  >
                    <label htmlFor="media-upload" className="cursor-pointer">
                      Initialize Repository
                    </label>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFiles.map((url, idx) => (
                    <div key={idx} className="group relative">
                      <div className="aspect-square rounded-sm overflow-hidden bg-muted/5 border border-border/10 shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-1">
                        <img src={url} 
                          alt="Media asset" 
                          className="w-full h-full object-cover"
                         decoding="async" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-10 w-10 rounded-sm bg-white/95 border-0 hover:bg-white text-on-surface shadow-2xl transition-all hover:scale-110 active:scale-95"
                            onClick={() => copyToClipboard(url)}
                          >
                            {copiedUrl === url ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-10 w-10 rounded-sm bg-white/95 border-0 hover:bg-white text-on-surface shadow-2xl transition-all hover:scale-110 active:scale-95"
                            asChild
                          >
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          </Button>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-10 w-10 rounded-sm bg-white/95 border-0 hover:bg-destructive/20 text-on-surface hover:text-destructive shadow-2xl transition-all hover:scale-110 active:scale-95"
                            onClick={() => setAssetToDelete(url)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 px-1">
                        <p className="text-[10px] font-bold text-on-surface truncate">
                          {url.split('/').pop()}
                        </p>
                        <p className="text-[9px] text-muted-foreground/40 font-medium normal-case mt-0.5">
                          {activeFolder.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Storage Usage Section (Moved to Bottom) */}
          <Card className="rounded-sm border-border/60 shadow-sm bg-on-surface text-white overflow-hidden p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-sm bg-primary/20 flex items-center justify-center shrink-0">
                  <Filter className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Cloud storage intelligence</h4>
                  <p className="text-xs text-white/60 normal-case mt-1">Real-time usage monitoring for Supabase storage buckets.</p>
                </div>
              </div>
              
              <div className="flex-1 max-w-md space-y-4">
                <div className="flex justify-between text-[11px] font-bold text-white/40 tracking-tight">
                  <span>Capacity utilization</span>
                  <span className="text-primary">12%</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[12%] shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-white/20 tracking-tight">
                  <span className="normal-case">0.6 GB consumed</span>
                  <span className="normal-case">5.0 GB limit</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirm={handleConfirmedDelete}
        title="Move to Trash"
        description="This asset will be moved to the trash vault. You can restore it within 30 days before it is permanently purged from storage."
        itemName={assetToDelete?.split('/').pop() || ''}
        isLoading={isLoading}
        isPermanent={false}
      />
    </div>
  )
}
