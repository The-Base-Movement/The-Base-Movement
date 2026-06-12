export function SelIcon() {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        position: 'absolute',
        right: 9,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 16,
        color: 'hsl(var(--on-surface-muted))',
        pointerEvents: 'none',
      }}
    >
      expand_more
    </span>
  )
}
