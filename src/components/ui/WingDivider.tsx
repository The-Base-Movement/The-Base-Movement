/**
 * WingDivider — small Eagle Head ornamental section divider.
 *
 * Renders a thin line — eagle icon — thin line centred between sections.
 * Three colour variants:
 *   'default' → dark lines + eagle, for light backgrounds
 *   'gold'    → gold lines + eagle, for dark backgrounds
 *   'white'   → white lines + eagle, for green/coloured backgrounds
 *
 * Usage:
 *   <WingDivider />
 *   <WingDivider variant="gold" />
 *   <WingDivider variant="white" />
 *   <WingDivider size={24} my={24} />
 */

interface WingDividerProps {
  variant?: 'default' | 'gold' | 'white'
  /** Eagle icon size in px (default 28) */
  size?: number
  /** Vertical margin in px (default 28) */
  my?: number
  className?: string
}

const LINE_COLOR: Record<NonNullable<WingDividerProps['variant']>, string> = {
  default: 'rgba(0,0,0,0.15)',
  gold: 'hsl(var(--accent))',
  white: 'rgba(255,255,255,0.35)',
}

const EAGLE_SRC = '/branding/icons/eagle-head.png'

export function WingDivider({
  variant = 'default',
  size = 28,
  my = 28,
  className,
}: WingDividerProps) {
  const lineColor = LINE_COLOR[variant]

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: my,
        marginBottom: my,
        paddingLeft: 32,
        paddingRight: 32,
      }}
    >
      <div style={{ flex: 1, height: 1, background: lineColor, maxWidth: 180 }} />
      <img
        src={EAGLE_SRC}
        alt=""
        style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
      />
      <div style={{ flex: 1, height: 1, background: lineColor, maxWidth: 180 }} />
    </div>
  )
}
