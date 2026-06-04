/**
 * WingDivider — Eagle Wing decorative section divider.
 *
 * Replaces plain horizontal lines between public-page sections.
 * Three variants:
 *   'default' → use on white/light backgrounds
 *   'gold'    → use on dark/black backgrounds
 *   'white'   → use on green/coloured backgrounds
 *
 * Usage:
 *   <WingDivider />
 *   <WingDivider variant="gold" />
 *   <WingDivider variant="white" maxWidth={400} />
 */

interface WingDividerProps {
  variant?: 'default' | 'gold' | 'white'
  maxWidth?: number | string
  className?: string
  my?: number // vertical margin in px (default 32)
}

const SRC: Record<NonNullable<WingDividerProps['variant']>, string> = {
  default: '/brand/divider-default.png',
  gold: '/brand/divider-gold.png',
  white: '/brand/divider-white.png',
}

export function WingDivider({
  variant = 'default',
  maxWidth = 560,
  className,
  my = 32,
}: WingDividerProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: my,
        marginBottom: my,
      }}
    >
      <img
        src={SRC[variant]}
        alt=""
        style={{
          width: '100%',
          maxWidth,
          height: 'auto',
          display: 'block',
          userSelect: 'none',
        }}
      />
    </div>
  )
}
