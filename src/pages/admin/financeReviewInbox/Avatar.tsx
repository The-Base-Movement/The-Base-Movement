export default function Avatar({
  url,
  name,
  size = 28,
}: {
  url?: string | null
  name: string
  size?: number
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        title={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid hsl(var(--background))',
          flexShrink: 0,
        }}
      />
    )
  }

  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'hsl(var(--primary))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        color: '#fff',
        fontWeight: 'var(--font-weight-medium, 500)',
        fontFamily: "'Public Sans', sans-serif",
        border: '2px solid hsl(var(--background))',
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
