import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  Search, 
  Copy, 
  Check, 
  Image as ImageIcon,
  FileText,
  Filter,
  ExternalLink
} from 'lucide-react'
import { contentService } from '@/services/contentService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function MediaLibrary() {
  const [files, setFiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [activeFolder, setActiveFolder] = useState('blog-images')

  const folders = [
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

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-stone-900" />
            Media library
          </h1>
          <p className="text-stone-500 text-sm mt-1">Central repository for movement assets and deployment media.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl border-stone-200 text-stone-600 text-[10px] px-6 font-bold hover:bg-stone-50 shadow-sm h-10 transition-all"
            onClick={loadFiles}
          >
            Refresh library
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
              className="rounded-xl bg-stone-900 text-white text-[10px] px-6 font-bold hover:bg-stone-800 shadow-sm h-10 transition-all flex items-center gap-2"
              asChild
              disabled={isUploading}
            >
              <label htmlFor="media-upload" className="cursor-pointer">
                {isUploading ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {isUploading ? 'Uploading...' : 'Upload asset'}
              </label>
            </Button>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Folders */}
        <div className="space-y-6">
          <Card className="rounded-xl border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-100 bg-stone-50">
              <h3 className="font-bold text-stone-900 text-xs normal-case">Asset categories</h3>
            </div>
            <CardContent className="p-2">
              <div className="space-y-1">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      activeFolder === folder.id 
                        ? "bg-stone-900 text-white shadow-md" 
                        : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    )}
                  >
                    <folder.icon className={cn("w-4 h-4", activeFolder === folder.id ? "text-emerald-400" : "text-stone-400")} />
                    {folder.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-stone-200 shadow-sm bg-stone-900 text-white overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Filter className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Storage usage</h4>
                <p className="text-[10px] text-stone-400 normal-case">Supabase cloud</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[12%]" />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-stone-400">
                <span className="normal-case">0.6 GB used</span>
                <span className="normal-case">5 GB total</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content - File Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
              <Input 
                placeholder="Search your assets..." 
                className="pl-12 h-12 rounded-xl border-stone-200 focus:ring-0 focus:border-stone-400 transition-all bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card className="rounded-2xl border-stone-200 shadow-sm min-h-[500px] overflow-hidden bg-white">
            <CardContent className="p-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                  <div className="w-10 h-10 border-3 border-stone-100 border-t-stone-900 rounded-full animate-spin" />
                  <p className="text-stone-400 text-sm font-medium">Scanning repository...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] space-y-4 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center mb-2">
                    <ImageIcon className="w-8 h-8 text-stone-200" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-lg">No assets found</h3>
                  <p className="text-stone-500 text-sm max-w-xs">
                    {searchQuery 
                      ? `No results match "${searchQuery}". Try a different term.` 
                      : `Your ${activeFolder.replace('-', ' ')} folder is currently empty.`}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4 rounded-lg px-6"
                    asChild
                  >
                    <label htmlFor="media-upload" className="cursor-pointer">
                      Upload your first file
                    </label>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredFiles.map((url, idx) => (
                    <div key={idx} className="group relative">
                      <div className="aspect-square rounded-xl overflow-hidden bg-stone-50 border border-stone-100 shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-1">
                        <img 
                          src={url} 
                          alt="Media asset" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-9 w-9 rounded-lg bg-white/90 hover:bg-white text-stone-900 shadow-xl"
                            onClick={() => copyToClipboard(url)}
                          >
                            {copiedUrl === url ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-9 w-9 rounded-lg bg-white/90 hover:bg-white text-stone-900 shadow-xl"
                            asChild
                          >
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 px-1">
                        <p className="text-[10px] font-bold text-stone-900 truncate">
                          {url.split('/').pop()}
                        </p>
                        <p className="text-[9px] text-stone-400 font-medium normal-case mt-0.5">
                          {activeFolder.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
