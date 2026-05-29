interface JoinRequest {
  id: string
  member_id: string
  member_name: string
  member_reg_no: string
  member_avatar: string | null
  created_at: string
}

interface Props {
  joinRequests: JoinRequest[]
  processingRequestId: string | null
  onApprove: (requestId: string, memberId: string) => void
  onReject: (requestId: string, memberId: string) => void
}

export function RequestsTab({ joinRequests, processingRequestId, onApprove, onReject }: Props) {
  return (
    <div>
      {joinRequests.length === 0 ? (
        <div
          style={{
            padding: '48px 0',
            textAlign: 'center',
            border: '1px dashed hsl(var(--border))',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 36,
              color: 'hsl(var(--on-surface-muted))',
              opacity: 0.25,
              display: 'block',
              marginBottom: 10,
            }}
          >
            group_add
          </span>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
            }}
          >
            No pending join requests
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {joinRequests.map((req) => (
            <div
              key={req.id}
              className="panel"
              style={{
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  flexShrink: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 14,
                  color: 'hsl(var(--on-surface-muted))',
                  fontFamily: "'Public Sans', sans-serif",
                }}
              >
                {req.member_avatar ? (
                  <img
                    src={req.member_avatar}
                    alt={req.member_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  req.member_name.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {req.member_name}
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    marginTop: 2,
                  }}
                >
                  {req.member_reg_no} · Requested{' '}
                  {new Date(req.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={processingRequestId === req.id}
                  onClick={() => onApprove(req.id, req.member_id)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    check
                  </span>
                  Accept
                </button>
                <button
                  className="btn btn-dest btn-sm"
                  disabled={processingRequestId === req.id}
                  onClick={() => onReject(req.id, req.member_id)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                    close
                  </span>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
