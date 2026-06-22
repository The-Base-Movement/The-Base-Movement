export type Tab = 'donor' | 'forecast' | 'sentiment'

const tabConfig: Record<Tab, { icon: string; label: string }> = {
  donor: { icon: 'volunteer_activism', label: 'Donor Propensity' },
  forecast: { icon: 'show_chart', label: 'Regional Forecast' },
  sentiment: { icon: 'sentiment_satisfied', label: 'Sentiment Index' },
}

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
}

export default function MLIntelligenceTabs({ tab, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
      {(Object.keys(tabConfig) as Tab[]).map((value) => {
        const config = tabConfig[value]
        return (
          <button
            key={value}
            className={tab === value ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
            onClick={() => onChange(value)}
            style={{ fontSize: 12, flex: 1, justifyContent: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {config.icon}
            </span>
            {config.label}
          </button>
        )
      })}
    </div>
  )
}
