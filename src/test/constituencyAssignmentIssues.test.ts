import { describe, expect, it } from 'vitest'
import type { MemberAssignmentIssue } from '@/services/constituencyService'

describe('constituency assignment issues', () => {
  it('uses stable reconciliation issue codes', () => {
    const issue: MemberAssignmentIssue = {
      id: 'member-1',
      registrationNumber: 'TBM-GH-260001',
      fullName: 'Test Member',
      platform: 'GHANA',
      country: 'Ghana',
      region: null,
      constituency: null,
      chapter: null,
      issueCode: 'missing_constituency',
    }
    expect(issue.issueCode).toBe('missing_constituency')
  })
})
