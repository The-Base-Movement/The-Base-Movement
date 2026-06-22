/**
 * BrandIcon — custom The Base Movement brand icons.
 *
 * Icons are full-colour PNGs — they work on any background.
 * When `bg` is supplied, the icon gets a coloured wrapper to make
 * it pop on dark or coloured sections.
 *
 * Usage:
 *   <BrandIcon name="eagle-head" size={40} />
 *   <BrandIcon name="shield" size={32} bg="green" />
 *   <BrandIcon name="megaphone" size={28} bg="gold" />
 *   <BrandIcon name="handshake" size={36} bg="white" />
 */

export type BrandIconName =
  | 'eagle-head'
  | 'shield'
  | 'people-circle'
  | 'handshake'
  | 'torch'
  | 'megaphone'
  | 'ghana-map'
  | 'ghana-flag'
  | 'upward-arrow'
  | 'whistle'
  | 'movement-arrow'
  | 'raised-fist'
  | 'lightning'
  | 'network'
  | 'mountain'
  | 'tree'
  | 'loudspeaker'
  | 'flag-bearer'
  | 'independence-monument'

interface BrandIconProps {
  name: BrandIconName
  size?: number
  /** Wrap the icon in a coloured background bubble */
  bg?: 'green' | 'gold' | 'white' | 'dark' | 'green-light'
  className?: string
  style?: React.CSSProperties
}

const BG_STYLES: Record<NonNullable<BrandIconProps['bg']>, React.CSSProperties> = {
  green: { background: 'hsl(var(--primary))', borderRadius: 'var(--radius-md)' },
  'green-light': { background: 'hsl(var(--primary) / 0.12)', borderRadius: 'var(--radius-md)' },
  gold: { background: 'hsl(var(--accent))', borderRadius: 'var(--radius-md)' },
  white: { background: '#ffffff', borderRadius: 'var(--radius-md)' },
  dark: {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 'var(--radius-md)',
    backdropFilter: 'blur(4px)',
  },
}

/**
 * BrandIcon component definition.
 */
export function BrandIcon({ name, size = 32, bg, className, style }: BrandIconProps) {
  const img = (
    <img
      src={`/branding/icons/${name}.png`}
      alt=""
      aria-hidden="true"
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  )

  if (!bg) {
    return (
      <span className={className} style={{ display: 'inline-flex', ...style }}>
        {img}
      </span>
    )
  }

  const padding = Math.round(size * 0.35)
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding,
        ...BG_STYLES[bg],
        ...style,
      }}
    >
      {img}
    </span>
  )
}
