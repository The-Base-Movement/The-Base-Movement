import { useState } from 'react'
import { 
  User, 
  Shield, 
  Globe, 
  Lock, 
  Save,
  Users,
  Key
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
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

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'roles', label: 'Admin Roles', icon: Shield },
    { id: 'system', label: 'System Preferences', icon: Globe },
    { id: 'security', label: 'Security', icon: Lock },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-meta text-[var(--brand-black)] uppercase tracking-tighter">Admin Settings</h1>
          <p className="text-stone-500 text-sm mt-1">Configure your administrative profile and system preferences.</p>
        </div>
        <Button variant="primary" className="h-11 text-[10px] uppercase font-bold tracking-widest bg-[var(--brand-black)]">
          <Save className="w-4 h-4 mr-2" /> Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-[var(--brand-black)] text-white shadow-lg shadow-black/10" 
                  : "text-stone-500 hover:bg-stone-100"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'profile' && (
            <Card className="rounded-none border-stone-200 shadow-sm">
              <CardHeader className="p-8 border-b border-stone-100 bg-stone-50/30">
                <CardTitle className="text-lg font-black font-meta uppercase tracking-tight">Administrative Profile</CardTitle>
                <CardDescription className="text-xs">Manage your personal admin account details.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-stone-100 flex items-center justify-center border-2 border-dashed border-stone-200 text-stone-400 font-bold text-xl overflow-hidden">
                      SA
                    </div>
                    <button className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[8px] font-black uppercase tracking-widest">
                      Change
                    </button>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Full Name</Label>
                      <Input defaultValue="Super Admin" className="h-11 rounded-none border-stone-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Email Address</Label>
                      <Input defaultValue="admin@thebase.org" className="h-11 rounded-none border-stone-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Administrative Tier</Label>
                      <Input value="Headquarters (Tier 1)" disabled className="h-11 rounded-none border-stone-100 bg-stone-50 text-stone-400 italic" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Phone Number</Label>
                      <Input defaultValue="+233 20 000 0000" className="h-11 rounded-none border-stone-200" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'roles' && (
            <div className="space-y-6">
              <Card className="rounded-none border-stone-200 shadow-sm">
                <CardHeader className="p-8 border-b border-stone-100">
                  <CardTitle className="text-lg font-black font-meta uppercase tracking-tight">Role-Based Access Control</CardTitle>
                  <CardDescription className="text-xs">Manage permissions and assign admin tiers across the movement.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-stone-100">
                    {[
                      { role: 'Super Admin', desc: 'Full system access across all modules and regions.', count: 2, icon: Shield },
                      { role: 'Regional Admin', desc: 'Management rights restricted to assigned regions.', count: 16, icon: Globe },
                      { role: 'Chapter Lead', desc: 'Chapter-level oversight and member verification.', count: 124, icon: Users },
                      { role: 'Auditor', desc: 'Read-only access to financial and membership reports.', count: 4, icon: Key },
                    ].map((item) => (
                      <div key={item.role} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-stone-100 flex items-center justify-center text-[var(--brand-black)]">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[var(--brand-black)] uppercase tracking-tight">{item.role}</p>
                            <p className="text-[10px] text-stone-400 font-medium">{item.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{item.count} Active</span>
                          <Button variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest text-[var(--brand-red)]">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Button variant="outline" className="w-full h-14 border-2 border-dashed border-stone-200 text-stone-400 hover:border-[var(--brand-black)] hover:text-[var(--brand-black)] rounded-none text-[10px] font-black uppercase tracking-widest">
                Define Custom Permission Set
              </Button>
            </div>
          )}

          {activeTab === 'system' && (
            <Card className="rounded-none border-stone-200 shadow-sm">
              <CardHeader className="p-8 border-b border-stone-100">
                <CardTitle className="text-lg font-black font-meta uppercase tracking-tight">System Preferences</CardTitle>
                <CardDescription className="text-xs">Global configuration for platform behavior.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-red)]">Notifications</h4>
                  <div className="space-y-3">
                    {[
                      'Real-time alerts for new registrations',
                      'Weekly regional impact reports',
                      'Security login notifications',
                      'Poll results threshold alerts'
                    ].map((pref) => (
                      <div key={pref} className="flex items-center justify-between p-4 bg-stone-50 border border-stone-100">
                        <span className="text-xs font-bold text-stone-700">{pref}</span>
                        <div className="w-10 h-5 bg-[var(--brand-green)] flex items-center justify-end px-1 cursor-pointer">
                          <div className="w-3 h-3 bg-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
