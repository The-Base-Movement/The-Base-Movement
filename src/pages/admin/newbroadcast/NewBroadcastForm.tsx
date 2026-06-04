import { Link } from 'react-router-dom'
import { Editor } from '@tinymce/tinymce-react'
import { toast } from 'sonner'
import { fieldStyle, labelStyle, priorityBorderColor } from './utils'
import type { Broadcast, Region } from '@/services/adminService'

interface NewBroadcastFormProps {
  newBroadcast: Omit<Broadcast, 'id' | 'sender_id' | 'created_at'>
  setNewBroadcast: React.Dispatch<
    React.SetStateAction<Omit<Broadcast, 'id' | 'sender_id' | 'created_at'>>
  >
  fullRegions: Region[]
  allConstituencies: { name: string; region_id: number }[]
  selectedRegionId: number | null
  setSelectedRegionId: (id: number | null) => void
  isSending: boolean
  handleSend: () => Promise<void>
  editorRef: React.MutableRefObject<{ getContent: () => string } | null>
}

export function NewBroadcastForm({
  newBroadcast,
  setNewBroadcast,
  fullRegions,
  allConstituencies,
  selectedRegionId,
  setSelectedRegionId,
  isSending,
  handleSend,
  editorRef,
}: NewBroadcastFormProps) {
  return (
    <div className="panel" style={{ maxWidth: 900 }}>
      {/* Dark gradient header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0f1310,#1f2620)',
          borderTop: '3px solid hsl(var(--destructive))',
          borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--primary))' }}
        >
          shield
        </span>
        <div>
          <h3
            style={{
              margin: 0,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13.5,
              color: '#fff',
            }}
          >
            Deployment configuration
          </h3>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,.45)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              marginTop: 2,
            }}
          >
            Define your target audience and broadcast priority
          </div>
        </div>
      </div>

      <div style={{ padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title */}
        <div>
          <label htmlFor="input-broadcast-title" style={labelStyle}>
            Broadcast title <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <input
            id="input-broadcast-title"
            aria-label="e.g. National registration wave"
            name="title"
            type="text"
            placeholder="e.g. National registration wave"
            style={{ ...fieldStyle, height: 44 }}
            value={newBroadcast.title}
            onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
          />
        </div>

        {/* Channel + Target + Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <label htmlFor="select-broadcast-channel" style={labelStyle}>
              Delivery channel
            </label>
            <select
              name="channel"
              id="select-broadcast-channel"
              style={{ ...fieldStyle, appearance: 'none' as const }}
              value={newBroadcast.channel}
              onChange={(e) =>
                setNewBroadcast({
                  ...newBroadcast,
                  channel: e.target.value as 'SMS' | 'Email' | 'Push' | 'In-app',
                })
              }
            >
              <option value="In-app">In-app message</option>
              <option value="Push">Push notification</option>
              <option value="SMS">SMS broadcast</option>
              <option value="Email">Email dispatch</option>
            </select>
          </div>
          <div>
            <label htmlFor="select-broadcast-target" style={labelStyle}>
              Target segment
            </label>
            <select
              name="target_type"
              id="select-broadcast-target"
              style={{ ...fieldStyle, appearance: 'none' as const }}
              value={newBroadcast.target_type}
              onChange={(e) =>
                setNewBroadcast({
                  ...newBroadcast,
                  target_type: e.target.value as 'ALL' | 'REGION' | 'CONSTITUENCY',
                  target_value: '',
                })
              }
            >
              <option value="ALL">National (all)</option>
              <option value="REGION">Regional</option>
              <option value="CONSTITUENCY">Constituency</option>
            </select>
          </div>
          <div>
            <label htmlFor="select-broadcast-priority" style={labelStyle}>
              Priority level
            </label>
            <select
              name="priority"
              id="select-broadcast-priority"
              style={{
                ...fieldStyle,
                appearance: 'none' as const,
                borderColor: priorityBorderColor(newBroadcast.priority),
                color:
                  newBroadcast.priority === 'Urgent'
                    ? 'hsl(var(--destructive))'
                    : 'hsl(var(--on-surface))',
              }}
              value={newBroadcast.priority}
              onChange={(e) =>
                setNewBroadcast({
                  ...newBroadcast,
                  priority: e.target.value as 'Normal' | 'High' | 'Urgent',
                })
              }
            >
              <option value="Normal">Normal</option>
              <option value="High">High priority</option>
              <option value="Urgent">Urgent (Level Red)</option>
            </select>
          </div>
        </div>

        {/* Region + Constituency (conditional) */}
        {newBroadcast.target_type !== 'ALL' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: newBroadcast.target_type === 'CONSTITUENCY' ? '1fr 1fr' : '1fr',
              gap: 14,
            }}
          >
            <div>
              <label htmlFor="select-broadcast-region" style={labelStyle}>
                Select region <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
              </label>
              <select
                name="target_region"
                id="select-broadcast-region"
                style={{ ...fieldStyle, appearance: 'none' as const }}
                value={fullRegions.find((r) => r.name === newBroadcast.target_value)?.name || ''}
                onChange={(e) => {
                  const region = fullRegions.find((r) => r.name === e.target.value)
                  if (region) {
                    setSelectedRegionId(region.id)
                    setNewBroadcast({ ...newBroadcast, target_value: region.name })
                  }
                }}
              >
                <option value="">Select region</option>
                {fullRegions.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {newBroadcast.target_type === 'CONSTITUENCY' && (
              <div>
                <label htmlFor="select-broadcast-constituency" style={labelStyle}>
                  Select constituency <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
                </label>
                <select
                  name="target_constituency"
                  id="select-broadcast-constituency"
                  style={{
                    ...fieldStyle,
                    appearance: 'none' as const,
                    opacity: !selectedRegionId ? 0.45 : 1,
                  }}
                  disabled={!selectedRegionId}
                  value={newBroadcast.target_value}
                  onChange={(e) => {
                    if (e.target.value === 'ALL_IN_REGION') {
                      const region = fullRegions.find((r) => r.id === selectedRegionId)
                      if (region) {
                        setNewBroadcast({
                          ...newBroadcast,
                          target_type: 'REGION',
                          target_value: region.name,
                        })
                        toast.info(`Elevated to Regional target: ${region.name}`)
                      }
                    } else {
                      setNewBroadcast({ ...newBroadcast, target_value: e.target.value })
                    }
                  }}
                >
                  <option value="">
                    {!selectedRegionId ? 'Select region first' : 'Select constituency'}
                  </option>
                  <option value="ALL_IN_REGION">All in region</option>
                  {allConstituencies
                    .filter((c) => c.region_id === selectedRegionId)
                    .map((c, idx) => (
                      <option key={idx} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Rich text editor */}
        <div>
          <label id="label-broadcast-message" style={labelStyle}>
            Broadcast message <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
          </label>
          <div
            style={{
              border: '1px solid hsl(var(--border))',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <Editor
              aria-labelledby="label-broadcast-message"
              apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
              onInit={(_, editor) => (editorRef.current = editor)}
              initialValue={newBroadcast.content}
              init={{
                height: 380,
                menubar: false,
                plugins: [
                  'advlist',
                  'autolink',
                  'lists',
                  'link',
                  'charmap',
                  'preview',
                  'searchreplace',
                  'visualblocks',
                  'code',
                  'insertdatetime',
                  'table',
                  'wordcount',
                ],
                toolbar:
                  'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright | bullist numlist outdent indent | removeformat | link | help',
                content_style:
                  "body { font-family: 'Public Sans', sans-serif; font-size:14px; } p { margin-bottom: 1em; }",
                skin: 'oxide',
                placeholder: 'Compose your administrative directive with rich formatting...',
                branding: false,
                statusbar: false,
              }}
              onEditorChange={(content) => setNewBroadcast((prev) => ({ ...prev, content }))}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '14px 18px',
          borderTop: '1px solid hsl(var(--border))',
          display: 'flex',
          gap: 10,
          justifyContent: 'flex-end',
          background: 'hsl(var(--container-low))',
          borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
        }}
      >
        <Link to="/admin/broadcasts">
          <button type="button" className="btn btn-outline btn-sm">
            Cancel
          </button>
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
  )
}
