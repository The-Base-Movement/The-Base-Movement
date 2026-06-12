import { useState } from 'react'
import type {
  RapidResponseDirective,
  CrisisIncident,
  MediaCounterNarrative,
  Broadcast,
} from '@/types/admin'

const formatGhanaTime = (dateStr: string | Date, options: Intl.DateTimeFormatOptions) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Accra',
      ...options,
    }).format(new Date(dateStr))
  } catch {
    return '...'
  }
}

interface ActivityStreamPanelProps {
  directives: RapidResponseDirective[]
  broadcasts: Broadcast[]
  incidents: CrisisIncident[]
  narratives: MediaCounterNarrative[]
  onUpdateIncidentStatus: (id: string, currentStatus: CrisisIncident['status']) => Promise<void>
  onDispatchNarrative: (
    id: string,
    currentStatus: MediaCounterNarrative['dispatch_status']
  ) => Promise<void>
}

export function ActivityStreamPanel({
  directives,
  broadcasts,
  incidents,
  narratives,
  onUpdateIncidentStatus,
  onDispatchNarrative,
}: ActivityStreamPanelProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'intelligence'>('activity')

  return (
    <div
      style={{
        borderRadius: 6,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid hsl(var(--border))',
          flexShrink: 0,
          background: 'hsl(var(--container-low))',
        }}
      >
        <button
          onClick={() => setActiveTab('activity')}
          style={{
            padding: '10px 16px',
            fontSize: 11,
            fontWeight: 'var(--font-weight-semibold, 600)',
            border: 'none',
            borderBottom: `2px solid ${activeTab === 'activity' ? 'hsl(var(--primary))' : 'transparent'}`,
            background: activeTab === 'activity' ? 'hsl(var(--container-low))' : 'transparent',
            color:
              activeTab === 'activity' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
            cursor: 'pointer',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Tactical stream
        </button>
        <button
          onClick={() => setActiveTab('intelligence')}
          style={{
            padding: '10px 16px',
            fontSize: 11,
            fontWeight: 'var(--font-weight-semibold, 600)',
            border: 'none',
            borderBottom: `2px solid ${activeTab === 'intelligence' ? 'hsl(var(--primary))' : 'transparent'}`,
            background: activeTab === 'intelligence' ? 'hsl(var(--container-low))' : 'transparent',
            color:
              activeTab === 'intelligence' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
            cursor: 'pointer',
            fontFamily: "'Public Sans', sans-serif",
          }}
        >
          Intelligence center
        </button>
      </div>
      <div className="sidebar-scroll" style={{ overflowY: 'auto', flex: 1, padding: '0 16px' }}>
        {(
          activeTab === 'activity'
            ? directives.length === 0 && broadcasts.length === 0
            : incidents.length === 0 && narratives.length === 0
        ) ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 0',
              gap: 12,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 32, color: 'hsl(var(--primary))' }}
            >
              check_circle
            </span>
            <p
              style={{
                fontSize: 10.5,
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Sector clear
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'activity' && (
              <>
                {directives.slice(0, 10).map((dir) => (
                  <div
                    key={dir.id}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '11px 0',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: 'hsl(var(--primary))',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: 'white' }}
                      >
                        bolt
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 11.5,
                          lineHeight: 1.45,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        <b
                          style={{
                            fontWeight: 'var(--font-weight-semibold, 600)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {dir.title}
                        </b>
                      </p>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 'var(--font-weight-normal, 400)',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {dir.target_region} · {dir.priority.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
                {broadcasts.slice(0, 10).map((b) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '11px 0',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background:
                          b.priority === 'Urgent'
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--border))',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: 'white' }}
                      >
                        campaign
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 11.5,
                          lineHeight: 1.45,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        <b
                          style={{
                            fontWeight: 'var(--font-weight-semibold, 600)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {b.title}
                        </b>
                      </p>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 'var(--font-weight-normal, 400)',
                          color: 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {b.target_type === 'ALL' ? 'National' : b.target_value} ·{' '}
                        {formatGhanaTime(b.created_at, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
            {activeTab === 'intelligence' && (
              <>
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '11px 0',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background:
                          inc.severity === 'DEFCON1' || inc.severity === 'SEVERE'
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--accent))',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: 'white' }}
                      >
                        warning
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 11.5,
                          lineHeight: 1.45,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        <b
                          style={{
                            fontWeight: 'var(--font-weight-semibold, 600)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {inc.region}
                        </b>{' '}
                        — {inc.incident_type.replace(/_/g, ' ').toLowerCase()}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: 'var(--font-weight-normal, 400)',
                            color:
                              inc.status === 'RESOLVED'
                                ? 'hsl(var(--primary))'
                                : inc.status === 'CONTAINED'
                                  ? 'hsl(var(--accent))'
                                  : 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          {formatGhanaTime(inc.created_at, {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}{' '}
                          · {inc.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    {inc.status !== 'RESOLVED' && (
                      <button
                        onClick={() => onUpdateIncidentStatus(inc.id, inc.status)}
                        className="btn btn-outline"
                        style={{ height: 28, fontSize: 10, padding: '0 8px' }}
                      >
                        {inc.status === 'INVESTIGATING' ? 'Contain' : 'Resolve'}
                      </button>
                    )}
                  </div>
                ))}
                {narratives.slice(0, 5).map((nar) => (
                  <div
                    key={nar.id}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '11px 0',
                      borderBottom: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: 'hsl(var(--accent))',
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 16, color: 'white' }}
                      >
                        chat
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 11.5,
                          lineHeight: 1.45,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        <b
                          style={{
                            fontWeight: 'var(--font-weight-semibold, 600)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {nar.target_platform}
                        </b>{' '}
                        — digital directive
                      </p>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          textTransform: 'uppercase',
                          letterSpacing: '.04em',
                          color:
                            nar.dispatch_status === 'DEPLOYED'
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--on-surface-muted))',
                        }}
                      >
                        {nar.dispatch_status.toLowerCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => onDispatchNarrative(nar.id, nar.dispatch_status)}
                      className={
                        nar.dispatch_status === 'PENDING' ? 'btn btn-dest' : 'btn btn-outline'
                      }
                      style={{ height: 28, fontSize: 10, padding: '0 8px' }}
                    >
                      {nar.dispatch_status === 'PENDING' ? 'Dispatch' : 'Recall'}
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
