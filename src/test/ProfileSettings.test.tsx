import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HelmetProvider } from 'react-helmet-async'

const getUserMock = vi.fn()
const fromMock = vi.fn()
const updateMemberProfileMock = vi.fn()
const updateProfileMock = vi.fn()
const logActivityMock = vi.fn()

vi.mock('react-easy-crop', () => ({
  default: () => null,
}))

vi.mock('@/context/PerformanceContext', () => ({
  usePerformance: () => ({
    lowBandwidthMode: false,
    setLowBandwidthMode: vi.fn(),
  }),
}))

vi.mock('@/lib/sessionStore', () => ({
  sessionStore: {
    getItem: (key: string) => {
      if (key === 'userPlatform') return 'GHANA'
      if (key === 'userRegNo') return 'TBM-GH-260001'
      if (key === 'userAvatar') return null
      return null
    },
    setItem: vi.fn(),
  },
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  },
}))

vi.mock('@/services/adminService', () => ({
  adminService: {
    getChapters: vi.fn().mockResolvedValue([{ name: 'Accra Chapter' }]),
    getCountries: vi.fn().mockResolvedValue([{ name: 'Ghana', dialing_code: '+233' }]),
    getMemberProfile: vi.fn().mockResolvedValue({
      id: 'TBM-GH-260001',
      name: 'Jane Patriot',
      email: 'jane@example.com',
      phone: '+233241234567',
      region: 'Greater Accra',
      constituency: 'Ayawaso West',
      profession: 'Organizer',
      status: 'Active',
      joined: '1/1/2026',
      avatarUrl: 'https://cdn.example.com/avatar.webp',
      platform: 'GHANA',
      gender: 'Female',
      ageRange: '26 - 40',
      country: 'Ghana',
    }),
    getMemberProfileByAuthId: vi.fn().mockResolvedValue(null),
    updateMemberProfile: updateMemberProfileMock,
  },
}))

vi.mock('@/services/authService', () => ({
  authService: {
    updateProfile: updateProfileMock,
  },
}))

vi.mock('@/services/userActivityService', () => ({
  userActivityService: {
    logActivity: logActivityMock,
  },
}))

vi.mock('@/services/jobTaxonomyService', () => ({
  emptyJobSelection: {
    industryId: null,
    subCategoryId: null,
    roleId: null,
    isOther: false,
    customTitle: '',
  },
  jobTaxonomyService: {
    toSelection: vi.fn().mockReturnValue({
      industryId: null,
      subCategoryId: null,
      roleId: null,
      isOther: false,
      customTitle: '',
    }),
  },
}))

vi.mock('@/pages/settings/MembershipCardPanel', () => ({
  MembershipCardPanel: () => <div>Membership card</div>,
}))

vi.mock('@/pages/settings/VerificationStatusPanel', () => ({
  VerificationStatusPanel: () => <div>Verification</div>,
}))

vi.mock('@/pages/settings/VoterRegistrationPanel', () => ({
  VoterRegistrationPanel: () => <div>Voter registration</div>,
}))

vi.mock('@/pages/settings/PersonalInfoForm', () => ({
  PersonalInfoForm: () => <div>Personal info</div>,
}))

vi.mock('@/pages/settings/PerformancePrefsPanel', () => ({
  PerformancePrefsPanel: () => <div>Performance</div>,
}))

vi.mock('@/pages/settings/ProfileSettingsHeader', () => ({
  ProfileSettingsHeader: () => <div>Profile header</div>,
}))

vi.mock('@/pages/settings/DangerZonePanel', () => ({
  DangerZonePanel: () => <div>Danger zone</div>,
}))

vi.mock('@/pages/settings/NotificationsPanel', () => ({
  NotificationsPanel: () => <div>Notifications</div>,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import ProfileSettings from '@/pages/ProfileSettings'

describe('ProfileSettings', () => {
  beforeEach(() => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'auth-user-1' } } })
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })
    updateMemberProfileMock.mockResolvedValue(true)
    updateProfileMock.mockResolvedValue(undefined)
    logActivityMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('syncs member avatar and profile details to auth metadata when saving', async () => {
    const user = userEvent.setup()

    render(
      <HelmetProvider>
        <ProfileSettings />
      </HelmetProvider>
    )

    await user.click(await screen.findByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(updateMemberProfileMock).toHaveBeenCalledWith(
        'TBM-GH-260001',
        expect.objectContaining({
          avatarUrl: 'https://cdn.example.com/avatar.webp',
        })
      )
    })

    expect(updateProfileMock).toHaveBeenCalledWith({
      full_name: 'Jane Patriot',
      avatar_url: 'https://cdn.example.com/avatar.webp',
      phone: '+233241234567',
    })
  })
})
