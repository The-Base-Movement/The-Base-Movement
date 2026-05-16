import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Editor } from '@tinymce/tinymce-react'
import { toast } from 'sonner'
import { adminService } from '@/services/adminService'
import type { Broadcast, Region } from '@/services/adminService'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 42,
  border: '1px solid hsl(var(--border))',
  borderRadius: 4,
  padding: '0 12px',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 13,
  outline: 'none',
  background: '#fff',
  color: 'hsl(var(--on-surface))',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 9.5,
  fontWeight: 800,
  color: 'hsl(var(--on-surface-muted))',
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  fontFamily: "'Public Sans', sans-serif",
  marginBottom: 6,
}

export default function NewBroadcast() {
  const navigate = useNavigate()
  const location = useLocation()
  const editorRef = useRef<{ getContent: () => string } | null>(null)

  const state = location.state as { template?: { title: string; content: string; type: string; priority: string } } | null
  const initialTemplate = state?.template

  const [isSending, setIsSending] = useState(false)
  const [fullRegions, setFullRegions] = useState<Region[]>([])
  const [allConstituencies, setAllConstituencies] = useState<{ name: string; region_id: number }[]>([])
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)

  const [newBroadcast, setNewBroadcast] = useState<Omit<Broadcast, 'id' | 'sender_id' | 'created_at'>>({
    title: initialTemplate?.title || '',
    content: initialTemplate?.content || '',
    channel: 'In-app',
    target_type: (initialTemplate?.type as 'ALL' | 'REGION' | 'CONSTITUENCY') || 'ALL',
    target_value: '',
    priority: (initialTemplate?.priority as 'Normal' | 'High' | 'Urgent') || 'Normal',
    status: 'Sent',
  })

  const fetchData = useCallback(async () => {
    try {
      const [regions, cData] = await Promise.all([
        adminService.getRegions(),
        adminService.getConstituencies(),
      ])
      setFullRegions(regions || [])
      setAllConstituencies(cData?.data || [])
    } catch {
      toast.error('Failed to load regions and constituencies.')
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSend = async () => {
    const content = editorRef.current ? editorRef.current.getContent() : newBroadcast.content
    if (!newBroadcast.title || !content || content === '<p></p>') {
      toast.error('Please fill in all required fields.')
      return
    }
    if (newBroadcast.target_type !== 'ALL' && !newBroadcast.target_value) {
      toast.error('Please select a target region or constituency.')
      return
    }
    setIsSending(true)
    try {
      const payload: Omit<Broadcast, 'id' | 'created_at' | 'sender_id'> = { ...newBroadcast, content }
      const success = await adminService.sendBroadcast(payload)
      if (success) {
        toast.success('Broadcast deployed to the field.')
        navigate('/admin/broadcasts')
      } else {
        toast.error('Failed to deploy broadcast.')
      }
    } catch {
      toast.error('Critical failure in mobilization dispatch.')
    } finally {
      setIsSending(false)
    }
  }

  const channelIconName = (ch: string) => {
    if (ch === 'SMS') return 'sms'
    if (ch === 'Email') return 'mail'
    if (ch === 'Push') return 'notifications'
    return 'chat_bubble'
  }

  const priorityBorderColor = (p: string) => {
    if (p === 'Urgent') return 'hsl(var(--destructive))'
    if (p === 'High') return '#d97706'
    return 'hsl(var(--border))'
  }

  return (
    <div className="main animate-in fade-in duration-500">

      {/* Top bar */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>Admin</Link>
            {' · '}
            <Link to="/admin/broadcasts" style={{ color: 'hsl(var(--primary))' }}>Communication hub</Link>
            {' · '}
            New broadcast
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'hsl(var(--primary))' }}>campaign</span>
            New broadcast
          </h2>
          <div className="bl"><div /><div /><div /></div>
        </div>
        <div className="actions">
          <Link to="/admin/broadcasts">
            <button className="btn btn-outline btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
              Abort
            </button>
          </Link>
        </div>
      </div>

      {/* Form panel */}
      <div className="panel" style={{ maxWidth: 900 }}>

        {/* Dark gradient header */}
        <div style={{ background: 'linear-gradient(135deg,#0f1310,#1f2620)', borderTop: '3px solid hsl(var(--destructive))', borderRadius: '6px 6px 0 0', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--primary))' }}>shield</span>
          <div>
            <h3 style={{ margin: 0, fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 13.5, color: '#fff' }}>Deployment configuration</h3>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', fontFamily: "'Public Sans', sans-serif", fontWeight: 700, marginTop: 2 }}>Define your target audience and broadcast priority</div>
          </div>
        </div>

        <div style={{ padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>
              Broadcast title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <input aria-label="e.g. National registration wave" name="name-6d4aa4" id="input-6d4aa4"
              type="text"
              placeholder="e.g. National registration wave"
              style={{ ...fieldStyle, height: 44 }}
              value={newBroadcast.title}
              onChange={e => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
            />
          </div>

          {/* Channel + Target + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Delivery channel</label>
              <select name="name-1031e4" id="select-1031e4"
                style={{ ...fieldStyle, appearance: 'none' as const }}
                value={newBroadcast.channel}
                onChange={e => setNewBroadcast({ ...newBroadcast, channel: e.target.value as 'SMS' | 'Email' | 'Push' | 'In-app' })}
              >
                <option value="In-app">In-app message</option>
                <option value="Push">Push notification</option>
                <option value="SMS">SMS broadcast</option>
                <option value="Email">Email dispatch</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target segment</label>
              <select name="name-ca5797" id="select-ca5797"
                style={{ ...fieldStyle, appearance: 'none' as const }}
                value={newBroadcast.target_type}
                onChange={e => setNewBroadcast({ ...newBroadcast, target_type: e.target.value as 'ALL' | 'REGION' | 'CONSTITUENCY', target_value: '' })}
              >
                <option value="ALL">National (all)</option>
                <option value="REGION">Regional</option>
                <option value="CONSTITUENCY">Constituency</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority level</label>
              <select name="name-1bb4d5" id="select-1bb4d5"
                style={{ ...fieldStyle, appearance: 'none' as const, borderColor: priorityBorderColor(newBroadcast.priority), color: newBroadcast.priority === 'Urgent' ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface))' }}
                value={newBroadcast.priority}
                onChange={e => setNewBroadcast({ ...newBroadcast, priority: e.target.value as 'Normal' | 'High' | 'Urgent' })}
              >
                <option value="Normal">Normal</option>
                <option value="High">High priority</option>
                <option value="Urgent">Urgent (Level Red)</option>
              </select>
            </div>
          </div>

          {/* Region + Constituency (conditional) */}
          {newBroadcast.target_type !== 'ALL' && (
            <div style={{ display: 'grid', gridTemplateColumns: newBroadcast.target_type === 'CONSTITUENCY' ? '1fr 1fr' : '1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Select region <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                <select name="name-d4e101" id="select-d4e101"
                  style={{ ...fieldStyle, appearance: 'none' as const }}
                  value={fullRegions.find(r => r.name === newBroadcast.target_value)?.name || ''}
                  onChange={e => {
                    const region = fullRegions.find(r => r.name === e.target.value)
                    if (region) {
                      setSelectedRegionId(region.id)
                      setNewBroadcast({ ...newBroadcast, target_value: region.name })
                    }
                  }}
                >
                  <option value="">Select region</option>
                  {fullRegions.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              {newBroadcast.target_type === 'CONSTITUENCY' && (
                <div>
                  <label style={labelStyle}>Select constituency <span style={{ color: 'hsl(var(--destructive))' }}>*</span></label>
                  <select name="name-497bec" id="select-497bec"
                    style={{ ...fieldStyle, appearance: 'none' as const, opacity: !selectedRegionId ? 0.45 : 1 }}
                    disabled={!selectedRegionId}
                    value={newBroadcast.target_value}
                    onChange={e => {
                      if (e.target.value === 'ALL_IN_REGION') {
                        const region = fullRegions.find(r => r.id === selectedRegionId)
                        if (region) {
                          setNewBroadcast({ ...newBroadcast, target_type: 'REGION', target_value: region.name })
                          toast.info(`Elevated to Regional target: ${region.name}`)
                        }
                      } else {
                        setNewBroadcast({ ...newBroadcast, target_value: e.target.value })
                      }
                    }}
                  >
                    <option value="">{!selectedRegionId ? 'Select region first' : 'Select constituency'}</option>
                    <option value="ALL_IN_REGION">All in region</option>
                    {allConstituencies
                      .filter(c => c.region_id === selectedRegionId)
                      .map((c, idx) => (
                        <option key={idx} value={c.name}>{c.name}</option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Rich text editor */}
          <div>
            <label style={labelStyle}>
              Broadcast message <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 4, overflow: 'hidden' }}>
              <Editor
                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                onInit={(_, editor) => (editorRef.current = editor)}
                initialValue={newBroadcast.content}
                init={{
                  height: 380,
                  menubar: false,
                  plugins: ['advlist', 'autolink', 'lists', 'link', 'charmap', 'preview', 'searchreplace', 'visualblocks', 'code', 'insertdatetime', 'table', 'wordcount'],
                  toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright | bullist numlist outdent indent | removeformat | link | help',
                  content_style: "body { font-family: 'Public Sans', sans-serif; font-size:14px; } p { margin-bottom: 1em; }",
                  skin: 'oxide',
                  placeholder: 'Compose your administrative directive with rich formatting...',
                  branding: false,
                  statusbar: false,
                }}
                onEditorChange={content => setNewBroadcast(prev => ({ ...prev, content }))}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'hsl(var(--container-low))', borderRadius: '0 0 6px 6px' }}>
          <Link to="/admin/broadcasts">
            <button type="button" className="btn btn-outline btn-sm">Cancel</button>
          </Link>
          <button
            className="btn btn-dest"
            disabled={isSending}
            style={{ minWidth: 180 }}
            onClick={handleSend}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {isSending ? 'hourglass_empty' : 'send'}
            </span>
            {isSending ? 'Launching...' : 'Send broadcast →'}
          </button>
        </div>
      </div>

      {/* Preview info */}
      <div style={{ marginTop: 14, maxWidth: 900, padding: '14px 18px', border: '1px solid hsl(var(--border))', borderRadius: 6, background: 'hsl(var(--container-low))', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}>{channelIconName(newBroadcast.channel)}</span>
        </div>
        <div>
          <b style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 800, fontSize: 12, display: 'block', marginBottom: 3 }}>Broadcast preview</b>
          <p style={{ margin: 0, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.55, fontFamily: "'Public Sans', sans-serif", fontWeight: 700 }}>
            Sending to {newBroadcast.target_type === 'ALL' ? 'all movement members' : `targeted ${newBroadcast.target_type.toLowerCase()} segments`} via {newBroadcast.channel}.{' '}
            Estimated delivery to ~42,500 members. Rich content is supported on {newBroadcast.channel === 'SMS' ? 'smartphone links' : 'this channel'}.
          </p>
        </div>
      </div>

    </div>
  )
}
