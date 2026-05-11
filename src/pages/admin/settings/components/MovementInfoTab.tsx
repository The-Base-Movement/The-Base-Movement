import { Mail, Megaphone, Palette, FileText } from 'lucide-react'
import { Button } from '@/components/ui/neon-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card'
import { adminService } from '@/services/adminService'

interface MovementInfoTabProps {
  siteSettings: Record<string, unknown>
  setSiteSettings: (settings: any) => void
  isSaving: boolean
  setIsSaving: (val: boolean) => void
  toast: any
}

export function MovementInfoTab({
  siteSettings,
  setSiteSettings,
  isSaving,
  setIsSaving,
  toast
}: MovementInfoTabProps) {
  return (
    <div className="space-y-8">
      <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
          <CardTitle className="text-sm font-bold text-stone-900">Authoritative Communications</CardTitle>
          <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Configure the movement's primary contact points and newsletter dispatch parameters.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="max-w-2xl space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label className="text-micro font-bold text-stone-500 normal-case">Primary contact email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <Input 
                    value={(siteSettings.primary_email as string) || ''} 
                    onChange={(e) => setSiteSettings({ ...siteSettings, primary_email: e.target.value })}
                    className="pl-10 h-11 rounded-sm border-stone-200 text-xs font-medium" 
                  />
                </div>
                <p className="text-micro text-stone-400 italic">Used for contact forms and general inquiries.</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-micro font-bold text-stone-500 normal-case">Newsletter dispatch email</Label>
                <div className="relative">
                  <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                  <Input 
                    value={(siteSettings.newsletter_email as string) || ''} 
                    onChange={(e) => setSiteSettings({ ...siteSettings, newsletter_email: e.target.value })}
                    className="pl-10 h-11 rounded-sm border-stone-200 text-xs font-medium" 
                  />
                </div>
                <p className="text-micro text-stone-400 italic">Authoritative sender for all movement broadcasts.</p>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-stone-100">
              <h3 className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Movement Palette Control
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { key: 'primary_color', label: 'Primary Brand (Green)', desc: 'HSL value for the dominant identity color.' },
                  { key: 'accent_color', label: 'Accent Highlight (Gold)', desc: 'HSL value for secondary emphasis.' },
                  { key: 'destructive_color', label: 'Destructive/Alert (Red)', desc: 'HSL value for high-urgency elements.' },
                  { key: 'muted_foreground_color', label: 'Muted Text (General)', desc: 'HSL value for secondary labels/hints.' },
                  { key: 'on_surface_muted_color', label: 'Muted Text (Dark)', desc: 'HSL value for text on dark backgrounds.' }
                ].map((color) => (
                  <div key={color.key} className="space-y-2">
                    <Label className="text-micro font-bold text-stone-500 normal-case">{color.label}</Label>
                    <div className="flex gap-3">
                      <div 
                        className="w-11 h-11 rounded-sm border border-stone-200 shrink-0" 
                        style={{ backgroundColor: `hsl(${siteSettings[color.key] as string})` }}
                      />
                      <Input 
                        value={(siteSettings[color.key] as string) || ''} 
                        onChange={(e) => setSiteSettings({ ...siteSettings, [color.key]: e.target.value })}
                        className="h-11 rounded-sm border-stone-200 text-xs font-medium font-mono"
                        placeholder="0 0% 0%"
                      />
                    </div>
                    <p className="text-micro text-stone-400 italic leading-tight">{color.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-stone-100">
              <h3 className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Tactical Typography Orchestration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-micro font-bold text-stone-500 normal-case">Global font scale</Label>
                    <span className="text-micro font-mono font-bold text-primary">{(siteSettings.font_scale_global as number || 1.0).toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.8" 
                    max="1.5" 
                    step="0.05"
                    value={(siteSettings.font_scale_global as number) || 1.0}
                    onChange={(e) => setSiteSettings({ ...siteSettings, font_scale_global: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-stone-100 rounded-sm appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-micro text-stone-400 italic leading-tight">Adjusts the base font size for all paragraphs and body text.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <Label className="text-micro font-bold text-stone-500 normal-case">Heading emphasis scale</Label>
                    <span className="text-micro font-mono font-bold text-primary">{(siteSettings.font_scale_headings as number || 1.0).toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.8" 
                    max="2.0" 
                    step="0.05"
                    value={(siteSettings.font_scale_headings as number) || 1.0}
                    onChange={(e) => setSiteSettings({ ...siteSettings, font_scale_headings: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-stone-100 rounded-sm appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-micro text-stone-400 italic leading-tight">Specifically scales H1-H6 headings for high-impact visibility.</p>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end border-t border-stone-100">
              <Button 
                variant="active-tab"
                size="lg"
                onClick={async () => {
                  setIsSaving(true)
                  const toastId = toast.loading('Syncing movement configurations...')
                  try {
                    const settingsToUpdate = [
                      { key: 'primary_email', value: siteSettings.primary_email },
                      { key: 'newsletter_email', value: siteSettings.newsletter_email },
                      { key: 'primary_color', value: siteSettings.primary_color },
                      { key: 'accent_color', value: siteSettings.accent_color },
                      { key: 'destructive_color', value: siteSettings.destructive_color },
                      { key: 'registration_form_ghana_url', value: siteSettings.registration_form_ghana_url },
                      { key: 'registration_form_diaspora_url', value: siteSettings.registration_form_diaspora_url },
                      { key: 'font_scale_global', value: siteSettings.font_scale_global },
                      { key: 'font_scale_headings', value: siteSettings.font_scale_headings },
                      { key: 'muted_foreground_color', value: siteSettings.muted_foreground_color },
                      { key: 'on_surface_muted_color', value: siteSettings.on_surface_muted_color }
                    ]
                    
                    await Promise.all(settingsToUpdate.map(s => 
                      adminService.updateSiteSetting(s.key, s.value)
                    ))

                    window.dispatchEvent(new CustomEvent('site_settings_updated'))
                    toast.success('Movement configurations synchronized', { id: toastId })
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : 'Failed to update movement telemetry', { id: toastId })
                  } finally {
                    setIsSaving(false)
                  }
                }}
                disabled={isSaving}
                className="rounded-sm text-micro font-bold tracking-tight px-10 h-12 shadow-lg shadow-brand-green/20 transition-all active:scale-95"
              >
                {isSaving ? 'Syncing...' : 'Synchronize Configurations'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
