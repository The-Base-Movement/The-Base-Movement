export function impactColorForCount(memberCount: number): string {
  return memberCount > 1000
    ? 'var(--brand-green)'
    : memberCount > 500
      ? 'var(--brand-gold)'
      : 'var(--brand-red)'
}
