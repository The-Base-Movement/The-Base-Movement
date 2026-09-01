/**
 * Shared building blocks for the printable paper forms (adult membership and
 * Youth Wing). Extracted so the Youth Wing form reuses the exact print geometry
 * the adult form was tuned for, instead of a near-copy that drifts.
 *
 * Only the accent colour is parameterised: the two forms must not look alike.
 */

const BRAND_GREEN = 'hsl(156 100% 18%)'

export function SectionHeader({
  number,
  label,
  accent = BRAND_GREEN,
  badgeColor = 'hsl(45 80% 45%)',
  badgeTextColor = '#0f1310',
}: {
  number: number
  label: string
  accent?: string
  badgeColor?: string
  badgeTextColor?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        background: accent,
        color: '#ffffff',
        padding: '5px 12px',
        fontSize: '11.5px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        borderRadius: '2px',
        marginBottom: '10px',
        fontFamily: "'Public Sans', sans-serif",
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 17,
          height: 17,
          borderRadius: '50%',
          background: badgeColor,
          color: badgeTextColor,
          fontSize: '10.5px',
          fontWeight: 800,
        }}
      >
        {number}
      </span>
      {label}
    </div>
  )
}

export function FieldLine({
  label,
  required = false,
  hint,
}: {
  label: string
  required?: boolean
  hint?: string
}) {
  return (
    <div style={{ marginBottom: 9 }}>
      <p
        style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          color: '#334155',
          margin: '0 0 3px',
          fontFamily: "'Public Sans', sans-serif",
          lineHeight: 1.3,
        }}
      >
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}{' '}
        {hint && (
          <span style={{ textTransform: 'none', fontWeight: 400, color: '#64748b' }}>({hint})</span>
        )}
      </p>
      <div
        style={{
          height: 25,
          borderBottom: '1.5px solid #cbd5e1',
          width: '100%',
        }}
      />
    </div>
  )
}

export function CheckboxGroup({ items, columns = 0 }: { items: string[]; columns?: number }) {
  const layoutStyle: React.CSSProperties =
    columns > 0
      ? { display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '6px 16px' }
      : { display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }

  return (
    <div style={layoutStyle}>
      {items.map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 12,
              height: 12,
              border: '1.5px solid #64748b',
              borderRadius: 2,
              background: '#fff',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 500,
              color: '#1e293b',
              fontFamily: "'Public Sans', sans-serif",
              lineHeight: 1.3,
            }}
          >
            {item}
          </span>
        </div>
      ))}
    </div>
  )
}
