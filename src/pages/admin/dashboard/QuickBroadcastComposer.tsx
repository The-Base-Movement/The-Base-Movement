import type { Broadcast } from '@/types/admin'

interface QuickBroadcastComposerProps {
  broadcast: {
    title: string
    content: string
    target_type: Broadcast['target_type']
    target_value: string
    priority: Broadcast['priority']
    channel: Broadcast['channel']
  }
  setBroadcast: React.Dispatch<
    React.SetStateAction<{
      title: string
      content: string
      target_type: Broadcast['target_type']
      target_value: string
      priority: Broadcast['priority']
      channel: Broadcast['channel']
    }>
  >
  isSending: boolean
  regions: { id: number; name: string }[]
  constituencies: { id: number; name: string; region_id: number }[]
  diasporaChapters: { id: string; name: string; country: string }[]
  selectedRegionId: number | null
  setSelectedRegionId: (id: number | null) => void
  handleSendBroadcast: () => Promise<void>
}

export function QuickBroadcastComposer({
  broadcast,
  setBroadcast,
  isSending,
  regions,
  constituencies,
  diasporaChapters,
  selectedRegionId,
  setSelectedRegionId,
  handleSendBroadcast,
}: QuickBroadcastComposerProps) {
  return (
    <div className="panel compose">
      <div className="ph">
        <h3>New broadcast</h3>
        <span className="pill pill-mute">Mission Control</span>
      </div>

      <div className="field">
        <label htmlFor="input-b97fc0" className="lbl">
          Headline
        </label>
        <input
          name="name-b97fc0"
          id="input-b97fc0"
          className="title"
          value={broadcast.title}
          onChange={(e) => setBroadcast((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Mobilization directive..."
        />
      </div>

      <div className="field">
        <label htmlFor="textarea-daf71f" className="lbl">
          Message
        </label>
        <textarea
          name="name-daf71f"
          id="textarea-daf71f"
          value={broadcast.content}
          onChange={(e) => setBroadcast((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="Tactical update content..."
          style={{ minHeight: '80px' }}
        />
      </div>

      <div className="field">
        <label htmlFor="select-50d2d6" className="lbl">
          Target Audience
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <select
            name="name-50d2d6"
            id="select-50d2d6"
            className="reg"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              fontSize: '11px',
              padding: '4px 8px',
              color: 'hsl(var(--on-surface))',
              width: '100%',
            }}
            value={broadcast.target_type}
            onChange={(e) => {
              const type = e.target.value as Broadcast['target_type']
              setBroadcast((prev) => ({ ...prev, target_type: type, target_value: 'ALL' }))
              setSelectedRegionId(null)
            }}
          >
            <option value="ALL">National (All Members)</option>
            <option value="REGION">Regional Targeting</option>
            <option value="CONSTITUENCY">Constituency Targeting</option>
            <option value="DIASPORA">Diaspora Chapters</option>
          </select>

          {broadcast.target_type === 'REGION' && (
            <>
              <label htmlFor="select-e1e9ef" style={{ display: 'none' }}>
                Target Region
              </label>
              <select
                name="name-e1e9ef"
                id="select-e1e9ef"
                className="reg"
                value={broadcast.target_value}
                onChange={(e) =>
                  setBroadcast((prev) => ({ ...prev, target_value: e.target.value }))
                }
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  padding: '4px 8px',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <option value="ALL">Select Region...</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {broadcast.target_type === 'CONSTITUENCY' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <label htmlFor="select-dac9b9" style={{ display: 'none' }}>
                Filter Region
              </label>
              <select
                name="selectedRegionId"
                id="select-dac9b9"
                className="reg"
                value={selectedRegionId || ''}
                onChange={(e) => {
                  const id = e.target.value ? parseInt(e.target.value) : null
                  setSelectedRegionId(id)
                  setBroadcast((prev) => ({ ...prev, target_value: 'ALL' }))
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  padding: '4px 8px',
                  color: 'hsl(var(--on-surface))',
                  flex: 1,
                }}
              >
                <option value="">Filter by Region...</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <label htmlFor="select-81066f" style={{ display: 'none' }}>
                Target Constituency
              </label>
              <select
                name="name-81066f"
                id="select-81066f"
                className="reg"
                value={broadcast.target_value}
                onChange={(e) =>
                  setBroadcast((prev) => ({ ...prev, target_value: e.target.value }))
                }
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  padding: '4px 8px',
                  color: 'hsl(var(--on-surface))',
                  flex: 2,
                }}
                disabled={!selectedRegionId}
              >
                <option value="ALL">Select Constituency...</option>
                {constituencies
                  .filter((c) => !selectedRegionId || c.region_id === selectedRegionId)
                  .map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {broadcast.target_type === 'DIASPORA' && (
            <>
              <label htmlFor="select-ab1a39" style={{ display: 'none' }}>
                Target Diaspora Chapter
              </label>
              <select
                name="name-ab1a39"
                id="select-ab1a39"
                className="reg"
                value={broadcast.target_value}
                onChange={(e) =>
                  setBroadcast((prev) => ({ ...prev, target_value: e.target.value }))
                }
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  padding: '4px 8px',
                  color: 'hsl(var(--on-surface))',
                }}
              >
                <option value="ALL">All Diaspora Chapters</option>
                {diasporaChapters.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="left">
          <label htmlFor="select-b728c8" style={{ display: 'none' }}>
            Broadcast Priority
          </label>
          <select
            name="name-b728c8"
            id="select-b728c8"
            className="reg"
            value={broadcast.priority}
            onChange={(e) =>
              setBroadcast((prev) => ({
                ...prev,
                priority: e.target.value as Broadcast['priority'],
              }))
            }
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '10px',
              color: 'hsl(var(--on-surface-muted))',
              cursor: 'pointer',
            }}
          >
            <option value="Normal">Normal</option>
            <option value="High">High</option>
            <option value="Urgent">URGENT</option>
          </select>
          <div
            style={{
              width: '1px',
              height: '12px',
              background: 'hsl(var(--border))',
              margin: '0 8px',
            }}
          />
          <label htmlFor="select-0f0d2a" style={{ display: 'none' }}>
            Communication Channel
          </label>
          <select
            name="name-0f0d2a"
            id="select-0f0d2a"
            className="reg"
            value={broadcast.channel}
            onChange={(e) =>
              setBroadcast((prev) => ({ ...prev, channel: e.target.value as Broadcast['channel'] }))
            }
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '10px',
              color: 'hsl(var(--on-surface-muted))',
              cursor: 'pointer',
            }}
          >
            <option value="In-app">In-App</option>
            <option value="SMS">SMS</option>
            <option value="Push">Push</option>
            <option value="Email">Email</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-dest btn-sm"
            disabled={isSending}
            onClick={handleSendBroadcast}
          >
            {isSending ? 'Sending...' : 'Deploy Broadcast →'}
          </button>
        </div>
      </div>
    </div>
  )
}
export default QuickBroadcastComposer
