import { Smartphone } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface ButtonCustomizerTabProps {
  siteSettings: Record<string, unknown>
  setSiteSettings: (settings: Record<string, unknown>) => void
  isSaving: boolean
  handleSave: () => void
}

export function ButtonCustomizerTab({
  siteSettings,
  setSiteSettings,
  isSaving,
  handleSave
}: ButtonCustomizerTabProps) {
  return (
    <Card className="rounded-sm border-stone-200 shadow-sm overflow-hidden bg-white">
      <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/20">
        <CardTitle className="text-sm font-bold text-stone-900">Button Architecture</CardTitle>
        <CardDescription className="text-tiny font-medium text-stone-400 mt-1">Configure the movement's global interactive element parameters and visual feedback systems.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <Label className="text-micro font-bold text-stone-500 normal-case">Global border radius</Label>
                <span className="text-micro font-mono font-bold text-primary">{(siteSettings.button_border_radius as string) || '0.125rem'}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: 'Square', value: '0px' },
                  { label: 'XS', value: '0.125rem' },
                  { label: 'SM', value: '0.25rem' },
                  { label: 'MD', value: '0.5rem' },
                  { label: 'Full', value: '9999px' }
                ].map((radius) => (
                  <Button
                    key={radius.value}
                    variant={siteSettings.button_border_radius === radius.value ? "primary" : "outline"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_border_radius: radius.value })}
                    className="h-10 text-[10px] font-bold px-0 rounded-none"
                  >
                    {radius.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Visual Feedback Systems</Label>
              <div className="flex items-center justify-between p-4 rounded-sm border border-stone-100 bg-stone-50/50">
                <div>
                  <p className="text-xs font-bold text-stone-900">Neon Glow Effects</p>
                  <p className="text-micro text-stone-400 font-medium">Toggle administrative glow signatures on hover.</p>
                </div>
                <button 
                  onClick={() => setSiteSettings({ ...siteSettings, button_neon_enabled: !siteSettings.button_neon_enabled })}
                  className={cn(
                    "w-10 h-5 rounded-full flex items-center px-1 transition-colors",
                    siteSettings.button_neon_enabled ? "bg-[hsl(var(--primary))] justify-end" : "bg-stone-200 justify-start"
                  )}
                >
                  <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                </button>
              </div>
            </div>

            {/* Typography Weight */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Typography Weight</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Normal', value: '400' },
                  { label: 'Bold', value: '700' },
                  { label: 'Black', value: '900' }
                ].map((weight) => (
                  <Button
                    key={weight.value}
                    variant={siteSettings.button_font_weight === weight.value ? "primary" : "outline"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_font_weight: weight.value })}
                    className="h-10 text-[10px] font-bold rounded-none"
                  >
                    {weight.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Primary Button Text */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Primary Button Text</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Light Text', value: '0 0% 100%' },
                  { label: 'Dark Text', value: '220 15% 15%' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={siteSettings.button_primary_text_color === option.value ? "primary" : "outline"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_primary_text_color: option.value })}
                    className="h-10 text-[10px] font-bold rounded-none"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Gold Button Text */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Gold Button Text</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Light Text (Recommended)', value: '0 0% 100%' },
                  { label: 'Dark Text', value: '220 15% 15%' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={siteSettings.button_gold_text_color === option.value ? "primary" : "outline"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_gold_text_color: option.value })}
                    className="h-10 text-[10px] font-bold rounded-none"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Destructive Button Text */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Destructive Button Text</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Light Text (Recommended)', value: '0 0% 100%' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={siteSettings.button_destructive_text_color === option.value ? "primary" : "outline"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_destructive_text_color: option.value })}
                    className="h-10 text-[10px] font-bold rounded-none"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Active Tab Background */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Active Tab Background</Label>
              <div className="flex gap-3">
                <div 
                  className="w-11 h-11 rounded-sm border border-stone-200 shrink-0" 
                  style={{ backgroundColor: `hsl(${(siteSettings.button_active_tab_bg_color as string) || (siteSettings.primary_color as string)})` }}
                />
                <Input 
                  value={(siteSettings.button_active_tab_bg_color as string) || ''} 
                  onChange={(e) => setSiteSettings({ ...siteSettings, button_active_tab_bg_color: e.target.value })}
                  className="h-11 rounded-sm border-stone-200 text-xs font-medium font-mono"
                  placeholder="0 0% 0%"
                />
              </div>
            </div>

            {/* Active Tab Text — hardcoded white for contrast safety */}
            <div className="space-y-2 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Active Tab Text</Label>
              <p className="text-[10px] text-stone-400 leading-relaxed">Always white — ensures readable contrast on any active tab background color.</p>
            </div>

            {/* Inactive Tab Background */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Inactive Tab Background</Label>
              <div className="flex gap-3">
                <div 
                  className="w-11 h-11 rounded-sm border border-stone-200 shrink-0" 
                  style={{ backgroundColor: `hsl(${(siteSettings.button_inactive_tab_bg_color as string) || '0 0% 100%'})` }}
                />
                <Input 
                  value={(siteSettings.button_inactive_tab_bg_color as string) || ''} 
                  onChange={(e) => setSiteSettings({ ...siteSettings, button_inactive_tab_bg_color: e.target.value })}
                  className="h-11 rounded-sm border-stone-200 text-xs font-medium font-mono"
                  placeholder="0 0% 100%"
                />
              </div>
            </div>

            {/* Inactive Tab Text */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <Label className="text-micro font-bold text-stone-500 normal-case">Inactive Tab Text</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Light Text', value: '0 0% 100%' },
                  { label: 'Dark Text', value: '156 100% 21%' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={siteSettings.button_inactive_tab_text_color === option.value ? "primary" : "outline"}
                    onClick={() => setSiteSettings({ ...siteSettings, button_inactive_tab_text_color: option.value })}
                    className="h-10 text-[10px] font-bold rounded-none"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 bg-stone-50/50 p-8 rounded-sm border border-stone-100 relative">
            <style>
              {`
                .preview-gallery-container {
                  --button-radius: ${siteSettings.button_border_radius || '0.125rem'};
                  --button-font-weight: ${siteSettings.button_font_weight || '700'};
                  --primary-foreground: ${siteSettings.button_primary_text_color || '0 0% 100%'};
                  --accent-foreground: ${siteSettings.button_gold_text_color || '0 0% 100%'};
                  --destructive-foreground: ${siteSettings.button_destructive_text_color || '0 0% 100%'};
                  --active-tab-bg: ${siteSettings.button_active_tab_bg_color || siteSettings.primary_color};
                  --inactive-tab-bg: ${siteSettings.button_inactive_tab_bg_color || '0 0% 100%'};
                  --inactive-tab-text: ${siteSettings.button_inactive_tab_text_color || '156 100% 21%'};
                }
                .preview-gallery-container button {
                  border-radius: var(--button-radius) !important;
                  font-weight: var(--button-font-weight) !important;
                }
              `}
            </style>

            <div className="preview-gallery-container space-y-8">
              <h4 className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-2 mb-6">
                <Smartphone className="w-4 h-4 text-primary" />
                Component Preview Gallery (Unsaved)
              </h4>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 tracking-tight">Primary / Action</p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="primary" neon={siteSettings.button_neon_enabled as boolean}>Join Movement</Button>
                    <Button variant="primary" size="sm" neon={siteSettings.button_neon_enabled as boolean}>Action</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 tracking-tight">Accent / Gold</p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="gold" neon={siteSettings.button_neon_enabled as boolean}>Official Vision</Button>
                    <Button variant="gold" size="sm" neon={siteSettings.button_neon_enabled as boolean}>Vision</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 tracking-tight">Active Tabs / Navigation</p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="active-tab" neon={siteSettings.button_neon_enabled as boolean}>Active Tab</Button>
                    <Button variant="default" neon={siteSettings.button_neon_enabled as boolean}>Inactive Tab</Button>
                  </div>
                </div>


                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 tracking-tight">Outline / Ghost (Interactive)</p>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="outline" neon={siteSettings.button_neon_enabled as boolean}>Standard Outline</Button>
                    <Button variant="ghost" neon={siteSettings.button_neon_enabled as boolean}>Ghost Action</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-stone-400 tracking-tight">Destructive / Alert</p>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      variant="destructive"
                      neon={siteSettings.button_neon_enabled as boolean}
                    >
                      Solid Alert
                    </Button>
                    <Button 
                      variant="outline-destructive"
                      neon={siteSettings.button_neon_enabled as boolean}
                    >
                      Outline Alert
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex justify-end border-t border-stone-100">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-sm text-micro font-bold tracking-tight px-10 h-12 active:scale-95"
          >
            {isSaving ? 'Syncing...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
