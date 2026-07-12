// Local branded fallback avatars — replaces external placeholder services
// (pravatar, unsplash) so member imagery never depends on third-party links.

export const MALE_AVATAR = '/avatars/male.png'
export const FEMALE_AVATAR = '/avatars/female.png'

/**
 * Branded fallback avatar. Uses the matching image when gender is known;
 * otherwise picks one deterministically from the seed (name/id) so the same
 * person always gets the same face.
 */
export function fallbackAvatar(seed?: string | null, gender?: string | null): string {
  const g = gender?.trim().toLowerCase()
  if (g?.startsWith('f')) return FEMALE_AVATAR
  if (g?.startsWith('m')) return MALE_AVATAR
  let hash = 0
  for (const char of seed ?? '') hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash) % 2 === 1 ? FEMALE_AVATAR : MALE_AVATAR
}
