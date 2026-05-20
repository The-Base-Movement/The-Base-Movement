export function Sparkline({ heights, accent }: { heights: number[]; accent: string }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '18px', width: '100%' }}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            flex: 1,
            background: accent,
            opacity: i >= heights.length - 5 ? 0.85 : 0.18,
            borderRadius: '1px',
            minHeight: '3px',
            height: `${h}px`,
            display: 'block',
          }}
        />
      ))}
    </div>
  )
}
