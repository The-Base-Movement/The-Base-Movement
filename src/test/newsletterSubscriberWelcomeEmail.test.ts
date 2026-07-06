import { describe, expect, it } from 'vitest'
import { newsletterSubscriberWelcomeEmail } from '../../supabase/functions/_shared/email-templates'

describe('newsletterSubscriberWelcomeEmail', () => {
  it('includes the subscriber confirmation copy and updates CTA', () => {
    const html = newsletterSubscriberWelcomeEmail({
      updatesUrl: 'https://thebasemovement.info/blog',
    })

    expect(html).toContain('Your newsletter subscription is active.')
    expect(html).toContain('Read the latest updates')
    expect(html).toContain('https://thebasemovement.info/blog')
  })
})
