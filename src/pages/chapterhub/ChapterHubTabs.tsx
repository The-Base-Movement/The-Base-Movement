type TabKey = 'members' | 'donations' | 'board' | 'activities' | 'settings' | 'requests'

interface Tab {
  key: TabKey
  label: string
}

interface Props {
  tabs: Tab[]
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function ChapterHubTabs({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div
      style={{ display: 'flex', borderBottom: '1px solid hsl(var(--border))', marginBottom: 20 }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          style={{
            flex: 1,
            padding: '10px 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 800,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            color: activeTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--on-surface-muted))',
            borderBottom:
              activeTab === tab.key ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            marginBottom: -1,
            transition: 'color 0.15s',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
