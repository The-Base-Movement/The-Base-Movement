import type { CanvassingCampaign } from '@/types/admin'

interface TacticalGuidelinesSidebarProps {
  newCampaign: Partial<CanvassingCampaign>
  selectedRegion: string
  selectedConstituency: string
}

export function TacticalGuidelinesSidebar({
  newCampaign,
  selectedRegion,
  selectedConstituency,
}: TacticalGuidelinesSidebarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Tactical guidelines */}
      <div
        className="panel"
        style={{
          background: 'linear-gradient(135deg,#0f1310,#1f2620)',
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 180,
            height: 180,
            background: 'radial-gradient(circle,rgba(218,165,32,.15),transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255,255,255,.08)',
            position: 'relative',
          }}
        >
          <h3
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-semibold, 600)',
              fontSize: 13.5,
              color: '#fff',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, color: 'hsl(var(--primary))' }}
            >
              shield
            </span>
            Tactical guidelines
          </h3>
        </div>
        <div
          style={{
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'relative',
          }}
        >
          {[
            {
              icon: 'my_location',
              title: 'Precise targeting',
              body: "Ensure the target constituency aligns with the movement's current strategic priority areas.",
            },
            {
              icon: 'flag',
              title: 'Clear objectives',
              body: 'Field agents perform best with clear, concise mission objectives and measurable contact goals.',
            },
            {
              icon: 'storage',
              title: 'Data integrity',
              body: 'All field interactions must be logged in real-time through the field agent clipboard protocol.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} style={{ display: 'flex', gap: 12 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                >
                  {icon}
                </span>
              </div>
              <div>
                <b
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-semibold, 600)',
                    fontSize: 12,
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  {title}
                </b>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: 'rgba(255,255,255,.55)',
                    lineHeight: 1.55,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-normal, 400)',
                  }}
                >
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System alert */}
      <div className="panel" style={{ borderLeft: '3px solid hsl(var(--destructive))' }}>
        <div style={{ padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 18,
              color: 'hsl(var(--destructive))',
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            warning
          </span>
          <div>
            <b
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-semibold, 600)',
                fontSize: 12,
                display: 'block',
                marginBottom: 4,
              }}
            >
              Irreversible once deployed
            </b>
            <p
              style={{
                margin: 0,
                fontSize: 11.5,
                color: 'hsl(var(--on-surface-muted))',
                lineHeight: 1.55,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
              }}
            >
              Verify all tactical parameters with regional chapter leadership before initiating.
              Deployed missions cannot be rolled back.
            </p>
          </div>
        </div>
      </div>

      {/* Quick reference KPIs */}
      <div className="panel">
        <div className="ph">
          <h3>Deployment checklist</h3>
        </div>
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { label: 'Mission title set', done: !!newCampaign.title },
            { label: 'Region selected', done: !!selectedRegion },
            { label: 'Constituency selected', done: !!selectedConstituency },
            {
              label: 'Date range defined',
              done: !!(newCampaign.start_date && newCampaign.end_date),
            },
            { label: 'Contact goal entered', done: (newCampaign.goal_contacts ?? 0) > 0 },
          ].map(({ label, done }, i, arr) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 0',
                borderBottom: i < arr.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: done ? 'rgba(0,107,63,.12)' : 'rgba(206,17,38,.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 13,
                    color: done ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                >
                  {done ? 'check' : 'radio_button_unchecked'}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: done
                    ? 'var(--font-weight-semibold, 600)'
                    : 'var(--font-weight-normal, 400)',
                  color: done ? 'hsl(var(--on-surface))' : 'hsl(var(--on-surface-muted))',
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default TacticalGuidelinesSidebar
