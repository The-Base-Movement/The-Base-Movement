/**
 * GenderAvatar
 * Renders a gender-appropriate silhouette SVG avatar as a fallback
 * when no profile photo is available.
 * Gender values: 'Male' | 'Female' | anything else → male silhouette
 */

interface GenderAvatarProps {
  gender?: string
  size?: number
}

export function GenderAvatar({ gender, size = 44 }: GenderAvatarProps) {
  const isFemale = gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'woman'

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-sm)',
        background: isFemale ? 'hsl(330 60% 92%)' : 'hsl(215 60% 92%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {isFemale ? (
        // Female silhouette
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="12" cy="6" r="4" fill="hsl(330 50% 55%)" />
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" fill="hsl(330 50% 55%)" />
          {/* Dress shape */}
          <path d="M9 13l-1.5 5h9L15 13c-1 1-4 1-6 0z" fill="hsl(330 45% 65%)" />
        </svg>
      ) : (
        // Male silhouette
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="12" cy="6" r="4" fill="hsl(215 50% 50%)" />
          <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" fill="hsl(215 50% 50%)" />
        </svg>
      )}
    </div>
  )
}
