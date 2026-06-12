import { render } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/hooks/useBranding', () => ({
  useBranding: () => ({ settings: { logo_url: '/branding/logo.png' } }),
}))

import SEO from '@/components/SEO'

const renderSEO = (props = {}) =>
  render(
    <HelmetProvider>
      <SEO {...props} />
    </HelmetProvider>
  )

describe('SEO', () => {
  it('renders default title when no title prop given', () => {
    renderSEO()
    expect(document.title).toBe('The Base Movement – Ghana First, Jobs for the Youth!')
  })

  it('appends site name to custom title', () => {
    renderSEO({ title: 'Our Agenda' })
    expect(document.title).toBe('Our Agenda | The Base Movement')
  })

  it('does not render canonical on noindex pages', () => {
    renderSEO({ noindex: true })
    const canonical = document.querySelector('link[rel="canonical"]')
    expect(canonical).toBeNull()
  })
})
