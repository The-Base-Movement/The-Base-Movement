import { channelIconName } from './utils'

interface NewBroadcastPreviewProps {
  channel: string
  targetType: string
}

export function NewBroadcastPreview({ channel, targetType }: NewBroadcastPreviewProps) {
  return (
    <div
      style={{
        marginTop: 14,
        maxWidth: 900,
        padding: '14px 18px',
        border: '1px solid hsl(var(--border))',
        borderRadius: 6,
        background: 'hsl(var(--container-low))',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18, color: 'hsl(var(--on-surface-muted))' }}
        >
          {channelIconName(channel)}
        </span>
      </div>
      <div>
        <b
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 12,
            display: 'block',
            marginBottom: 3,
          }}
        >
          Broadcast preview
        </b>
        <p
          style={{
            margin: 0,
            fontSize: 11.5,
            color: 'hsl(var(--on-surface-muted))',
            lineHeight: 1.55,
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 700,
          }}
        >
          Sending to{' '}
          {targetType === 'ALL'
            ? 'all movement members'
            : `targeted ${targetType.toLowerCase()} segments`}{' '}
          via {channel}. Estimated delivery to ~42,500 members. Rich content is supported on{' '}
          {channel === 'SMS' ? 'smartphone links' : 'this channel'}.
        </p>
      </div>
    </div>
  )
}
