import KpiStrip from '@/pages/admin/mlintelligence/KpiStrip'
import ForecastCharts from '@/pages/admin/mlintelligence/ForecastCharts'
import type { ForecastResponse } from '@/services/mlService'

const confidenceColor: Record<string, string> = {
  High: 'hsl(var(--primary))',
  Medium: 'hsl(var(--accent))',
  Low: 'hsl(var(--on-surface-muted))',
}

interface Props {
  forecast: ForecastResponse
}

export default function ForecastTab({ forecast }: Props) {
  return (
    <>
      <KpiStrip
        items={[
          {
            label: 'National Members',
            value: forecast.national_total.toLocaleString(),
            bar: 'hsl(var(--on-surface))',
          },
          {
            label: 'Active Members',
            value: forecast.national_active.toLocaleString(),
            bar: 'hsl(var(--primary))',
          },
          {
            label: 'Regions Tracked',
            value: forecast.total_regions.toString(),
            bar: 'hsl(var(--accent))',
          },
          {
            label: 'Fastest Growing',
            value: forecast.fastest_growing_region,
            bar: 'hsl(var(--primary))',
          },
        ]}
      />

      <ForecastCharts forecast={forecast} />

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
          }}
        >
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
            }}
          >
            30 / 60 / 90-Day Membership Projections
          </div>
          <div
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              marginTop: 2,
            }}
          >
            Linear extrapolation from current 30-day cohort velocity
          </div>
        </div>

        <div className="desktop-only" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Region</th>
                <th style={{ textAlign: 'right' }}>Current</th>
                <th style={{ textAlign: 'right' }}>New (30d)</th>
                <th style={{ textAlign: 'right' }}>Growth %</th>
                <th style={{ textAlign: 'right' }}>+30d</th>
                <th style={{ textAlign: 'right' }}>+60d</th>
                <th style={{ textAlign: 'right' }}>+90d</th>
                <th style={{ textAlign: 'center' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {forecast.regions.map((region) => (
                <tr key={region.region}>
                  <td
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 'var(--font-weight-medium, 500)',
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {region.region}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {region.current_members.toLocaleString()}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--primary))',
                    }}
                  >
                    +{region.new_members_30d}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color:
                        region.growth_rate_pct > 0
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {region.growth_rate_pct}%
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {region.forecast_30d.toLocaleString()}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {region.forecast_60d.toLocaleString()}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {region.forecast_90d.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 11,
                        color: confidenceColor[region.confidence],
                      }}
                    >
                      {region.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-only">
          {forecast.regions.map((region) => (
            <div
              key={region.region}
              style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--border))' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {region.region}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    color: confidenceColor[region.confidence],
                  }}
                >
                  {region.confidence} confidence
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[
                  { label: '+30d', value: region.forecast_30d },
                  { label: '+60d', value: region.forecast_60d },
                  { label: '+90d', value: region.forecast_90d },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 10,
                        color: 'hsl(var(--on-surface-muted))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 14,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      {item.value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          color: 'hsl(var(--on-surface-muted))',
        }}
      >
        Generated {new Date(forecast.generated_at).toLocaleString()}
      </div>
    </>
  )
}
