export const getSentimentColor = (score: number) => {
  if (score >= 0.5) return { color: 'hsl(var(--primary))', bg: 'rgba(0, 168, 89, 0.1)' }
  if (score <= -0.5) return { color: 'hsl(var(--destructive))', bg: 'rgba(206, 17, 38, 0.1)' }
  return { color: 'hsl(var(--on-surface-muted))', bg: 'rgba(0, 0, 0, 0.05)' }
}

export const getSentimentLabel = (score: number) => {
  if (score >= 0.5) return 'Positive'
  if (score <= -0.5) return 'Critical'
  return 'Neutral'
}
