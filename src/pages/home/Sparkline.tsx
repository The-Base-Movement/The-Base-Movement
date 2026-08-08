const TRACK_HEIGHT = 18
const MIN_BAR = 3

/**
 * Micro trend chart for the home stat cards. `values` is a cumulative series
 * (one point per week) straight from get_public_stats(); heights are scaled
 * here so the component never needs to know the metric's magnitude.
 *
 * Renders nothing without at least two real points — an invented shape would
 * read as a growth claim the data does not support.
 */
export function Sparkline({ values, accent }: { values: number[]; accent: string }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  if (max <= 0) return null

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '18px', width: '100%' }}
    >
      {values.map((v, i) => (
        <span
          key={i}
          style={{
            flex: 1,
            background: accent,
            opacity: i >= values.length - 5 ? 0.85 : 0.18,
            borderRadius: '1px',
            minHeight: `${MIN_BAR}px`,
            height: `${Math.max(MIN_BAR, Math.round((v / max) * TRACK_HEIGHT))}px`,
            display: 'block',
          }}
        />
      ))}
    </div>
  )
}
