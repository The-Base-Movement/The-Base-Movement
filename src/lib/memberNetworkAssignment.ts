type AssignmentInput = {
  country?: string | null
  region?: string | null
  constituency?: string | null
  chapter?: string | null
}

const value = (input?: string | null) => input?.trim() || null

export function normalizeMemberNetworkAssignment(platform: string, input: AssignmentInput) {
  if (platform !== 'DIASPORA') {
    return {
      platform: 'GHANA' as const,
      country: 'Ghana',
      region: value(input.region),
      constituency: value(input.constituency),
      chapter: null,
    }
  }

  return {
    platform: 'DIASPORA' as const,
    country: value(input.country),
    region: null,
    constituency: null,
    chapter: value(input.chapter),
  }
}
