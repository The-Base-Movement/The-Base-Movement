import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Megaphone, 
  Send, 
  ArrowLeft,
  Loader2,
  Shield,
  MessageSquare,
  Mail,
  Smartphone
} from 'lucide-react'
import { Button } from "@/components/ui/neon-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Editor } from '@tinymce/tinymce-react'
import { toast } from "sonner"
import { adminService } from '@/services/adminService'
import type { Broadcast, Region } from '@/services/adminService'
import { cn } from "@/lib/utils"
import { useNavigate, useLocation } from 'react-router-dom'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BrandLine } from '@/components/ui/BrandLine'

export default function NewBroadcast() {
  const navigate = useNavigate()
  const location = useLocation()
  const editorRef = useRef<{ getContent: () => string } | null>(null)
  
  const state = location.state as { template?: { title: string, content: string, type: string, priority: string } } | null
  const initialTemplate = state?.template

  const [isSending, setIsSending] = useState(false)
  const [fullRegions, setFullRegions] = useState<Region[]>([])
  const [allConstituencies, setAllConstituencies] = useState<{ name: string, region_id: number }[]>([])
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)

  const [newBroadcast, setNewBroadcast] = useState<Omit<Broadcast, 'id' | 'sender_id' | 'created_at'>>({
    title: initialTemplate?.title || '',
    content: initialTemplate?.content || '',
    channel: 'In-app',
    target_type: (initialTemplate?.type as 'ALL' | 'REGION' | 'CONSTITUENCY') || 'ALL',
    target_value: '',
    priority: (initialTemplate?.priority as 'Normal' | 'High' | 'Urgent') || 'Normal',
    status: 'Sent'
  })

  const MAX_CHARACTERS = 2000 // Increased for HTML content

  const fetchData = useCallback(async () => {
    try {
      const [regions, cData] = await Promise.all([
        adminService.getRegions(),
        adminService.getConstituencies()
      ])
      setFullRegions(regions || [])
      setAllConstituencies(cData?.data || [])
    } catch (err) {
      console.error("[COMMUNICATION-HUB] operational metrics sync failure:", err)
      toast.error("Failed to synchronize mobilization operational metrics")
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSend = async () => {
    const content = editorRef.current ? editorRef.current.getContent() : newBroadcast.content
    
    if (!newBroadcast.title || !content || content === '<p></p>') {
      toast.error("Please fill in all required fields")
      return
    }

    if (newBroadcast.target_type !== 'ALL' && !newBroadcast.target_value) {
      toast.error("Please select a target region or constituency")
      return
    }

    setIsSending(true)
    try {
      const adminId = localStorage.getItem('adminId') || 'hq-system-admin'
      const payload: Omit<Broadcast, 'id' | 'created_at'> = { 
        ...newBroadcast, 
        content,
        sender_id: adminId
      }
      
      const success = await adminService.sendBroadcast(payload)
      if (success) {
        toast.success("Broadcast deployed to the field successfully")
        navigate('/admin/broadcasts')
      } else {
        toast.error("Failed to deploy broadcast")
      }
    } catch (err) {
      console.error("[COMMUNICATION-HUB] Critical dispatch failure:", err)
      toast.error("Critical failure in mobilization dispatch")
    } finally {
      setIsSending(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'SMS': return <Smartphone className="w-3 h-3" />
      case 'Email': return <Mail className="w-3 h-3" />
      case 'Push': return <Megaphone className="w-3 h-3" />
      default: return <MessageSquare className="w-3 h-3" />
    }
  }

  return (
    <div className="admin-page-container max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <Breadcrumbs />
        
        <div className="flex-columns items-center">
          <div>
            <h1 className="text-3xl font-bold text-on-surface tracking-tight flex items-center gap-3 font-meta">
              <Megaphone className="w-8 h-8 text-on-surface" />
              Send new broadcast
            </h1>
            <BrandLine className="mt-4" />
            <p className="text-muted-foreground/80 text-sm mt-1">Deploying a movement-wide communication to the field.</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/broadcasts')}
            className="rounded-sm text-[10px] font-bold tracking-tight h-11 px-8 border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Intelligence
          </Button>
        </div>
      </div>

      <Card className="rounded-sm border-border/40 shadow-xl overflow-hidden bg-background group border-none md:border-solid">
        <CardHeader className="p-8 bg-on-surface text-white border-b border-white/5 relative">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-red" />
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Deployment configuration</CardTitle>
              <p className="text-xs text-white/40 font-medium mt-0.5">Define your target audience and broadcast priority.</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold normal-case text-muted-foreground/40">Broadcast title</label>
            <Input 
              placeholder="e.g. National registration wave" 
              className="rounded-sm border-border/40 h-12 text-sm font-bold placeholder:font-normal shadow-sm bg-muted/5 focus:bg-background transition-colors"
              value={newBroadcast.title}
              onChange={(e) => setNewBroadcast({...newBroadcast, title: e.target.value})}
            />
          </div>

          {/* Channel, Target & Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold normal-case text-muted-foreground/40">Delivery channel</label>
              <Select 
                value={newBroadcast.channel}
                onValueChange={(v: 'SMS' | 'Email' | 'Push' | 'In-app') => setNewBroadcast({...newBroadcast, channel: v})}
              >
                <SelectTrigger className="rounded-sm border-border/40 h-12 text-[10px] font-bold normal-case shadow-sm bg-muted/5">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border/40">
                  <SelectItem value="In-app" className="text-[10px] font-bold normal-case">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" /> In-app message
                    </div>
                  </SelectItem>
                  <SelectItem value="Push" className="text-[10px] font-bold normal-case">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-3.5 h-3.5" /> Push notification
                    </div>
                  </SelectItem>
                  <SelectItem value="SMS" className="text-[10px] font-bold normal-case">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5" /> SMS broadcast
                    </div>
                  </SelectItem>
                  <SelectItem value="Email" className="text-[10px] font-bold normal-case">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> Email dispatch
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold normal-case text-muted-foreground/40">Target segment</label>
              <Select 
                value={newBroadcast.target_type}
                onValueChange={(v: 'ALL' | 'REGION' | 'CONSTITUENCY') => {
                  setNewBroadcast({
                    ...newBroadcast, 
                    target_type: v, 
                    target_value: v === 'ALL' ? '' : newBroadcast.target_value 
                  })
                }}
              >
                <SelectTrigger className="rounded-sm border-border/40 h-12 text-[10px] font-bold normal-case shadow-sm bg-muted/5">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border/40">
                  <SelectItem value="ALL" className="text-[10px] font-bold normal-case">National (all)</SelectItem>
                  <SelectItem value="REGION" className="text-[10px] font-bold normal-case">Regional</SelectItem>
                  <SelectItem value="CONSTITUENCY" className="text-[10px] font-bold normal-case">Constituency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold normal-case text-muted-foreground/40">Priority level</label>
              <Select 
                value={newBroadcast.priority}
                onValueChange={(v: 'Normal' | 'High' | 'Urgent') => setNewBroadcast({...newBroadcast, priority: v})}
              >
                <SelectTrigger className={cn(
                  "rounded-sm border-border/40 h-12 text-[10px] font-bold normal-case shadow-sm bg-muted/5",
                  newBroadcast.priority === 'Urgent' ? "text-destructive border-destructive/20 bg-destructive/5" : ""
                )}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-border/40">
                  <SelectItem value="Normal" className="text-[10px] font-bold normal-case">Normal</SelectItem>
                  <SelectItem value="High" className="text-[10px] font-bold normal-case text-orange-600">High priority</SelectItem>
                  <SelectItem value="Urgent" className="text-[10px] font-bold normal-case text-destructive">Urgent (Level Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Region & Constituency Row */}
          {newBroadcast.target_type !== 'ALL' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold normal-case text-muted-foreground/40">Select region</label>
                <Select 
                  value={fullRegions.find(r => r.name === newBroadcast.target_value)?.name || ""}
                  onValueChange={(v) => {
                    const region = fullRegions.find(r => r.name === v)
                    if (region) {
                      setSelectedRegionId(region.id)
                      setNewBroadcast({...newBroadcast, target_value: region.name})
                    }
                  }}
                >
                  <SelectTrigger className="rounded-sm border-border/40 h-12 text-[10px] font-bold normal-case shadow-sm bg-muted/5">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent className="rounded-sm border-border/40">
                    {(fullRegions || []).map((r: Region) => (
                      <SelectItem key={`region-${r.id}`} value={r.name} className="text-[10px] font-bold normal-case">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newBroadcast.target_type === 'CONSTITUENCY' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold normal-case text-muted-foreground/40">Select constituency</label>
                  <Select 
                    disabled={!selectedRegionId}
                    onValueChange={(v) => {
                      if (v === 'ALL_IN_REGION') {
                        const region = fullRegions.find(r => r.id === selectedRegionId)
                        if (region) {
                          setNewBroadcast({
                            ...newBroadcast, 
                            target_type: 'REGION',
                            target_value: region.name
                          })
                          toast.info(`Elevated to Regional target: ${region.name}`)
                        }
                      } else {
                        setNewBroadcast({...newBroadcast, target_value: v})
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-sm border-border/40 h-12 text-[10px] font-bold normal-case shadow-sm bg-muted/5">
                      <SelectValue placeholder={!selectedRegionId ? "Select region first" : "Select constituency"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm border-border/40">
                      <SelectItem value="ALL_IN_REGION" className="text-[10px] font-bold normal-case italic text-muted-foreground/40">All in Region</SelectItem>
                      {(allConstituencies || [])
                        .filter(c => c.region_id === selectedRegionId)
                        .map((c, idx) => (
                          <SelectItem key={`const-${idx}-${c.name}`} value={c.name} className="text-[10px] font-bold normal-case">{c.name}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Content with TinyMCE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold normal-case text-muted-foreground/40">Broadcast message (Rich Content)</label>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold",
                  newBroadcast.content.length > MAX_CHARACTERS * 0.9 ? "text-destructive" : "text-muted-foreground/40"
                )}>
                  {newBroadcast.content.length} / {MAX_CHARACTERS}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
            
            <div className="rounded-sm overflow-hidden border border-border/40 shadow-sm bg-muted/5">
              <Editor
                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                onInit={(_, editor) => (editorRef.current = editor)}
                initialValue={newBroadcast.content}
                init={{
                  height: 400,
                  menubar: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | link | help',
                  content_style: 'body { font-family: "Public Sans", sans-serif; font-size:14px; color: hsl(var(--on-surface)); background-color: transparent; } p { margin-bottom: 1em; }',
                  skin: 'oxide',
                  content_css: 'default',
                  placeholder: 'Compose your administrative directive with rich formatting...',
                  branding: false,
                  statusbar: false
                }}
                onEditorChange={(content) => {
                  setNewBroadcast(prev => ({ ...prev, content }))
                }}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-border/10 flex items-center justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/broadcasts')}
              className="rounded-sm h-12 px-10 text-[10px] font-bold tracking-tight border-border/40 hover:bg-stone-50 transition-all shadow-sm active:scale-95"
            >
              Abort Transmission
            </Button>
            <Button 
              variant="primary"
              disabled={isSending}
              onClick={handleSend}
              className="rounded-sm h-12 px-12 text-[10px] font-bold tracking-tight min-w-[200px] shadow-lg shadow-brand-green/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Launching...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Broadcast
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Info */}
      <div className="flex items-center gap-4 p-4 rounded-sm bg-muted/5 border border-border/40 text-muted-foreground/80">
        <div className="w-10 h-10 rounded-sm bg-background border border-border/40 flex items-center justify-center shrink-0">
          {getChannelIcon(newBroadcast.channel)}
        </div>
        <div>
          <p className="text-[10px] font-bold normal-case text-on-surface">Broadcast preview</p>
          <p className="text-[10px] leading-relaxed">
            Sending to {newBroadcast.target_type === 'ALL' ? 'all movement members' : `targeted ${newBroadcast.target_type.toLowerCase()} segments`} via {newBroadcast.channel}. 
            Estimated delivery to ~42,500 members. Rich content is supported on {newBroadcast.channel === 'SMS' ? 'Smartphone links' : 'this channel'}.
          </p>
        </div>
      </div>
    </div>
  )
}
