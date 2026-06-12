import { useState } from 'react'
import { cn } from '@/lib/utils'
import { adminService } from '../services/adminService'
import { useBranding } from '@/hooks/useBranding'
import SEO from '@/components/SEO'
import { ContactInfoPanel } from './contact/components/ContactInfoPanel'
import { ContactForm } from './contact/components/ContactForm'
import { Breadcrumbs } from '@/components/Breadcrumbs'
export default function Contact() {
  const { settings } = useBranding()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    platform: '',
    // Ghana fields
    region: '',
    constituency: '',
    // Diaspora fields
    country: '',
    chapter: '',
    message: '',
  })

  const contactEmail = settings.primary_email

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const success = await adminService.submitContactForm({
      name: formData.fullName,
      email: formData.email,
      subject: formData.platform ? `Platform: ${formData.platform}` : 'General Inquiry',
      message: formData.message,
      metadata: {
        phone: formData.phone,
        platform: formData.platform,
        ...(formData.region && { region: formData.region }),
        ...(formData.constituency && { constituency: formData.constituency }),
        ...(formData.country && { country: formData.country }),
        ...(formData.chapter && { chapter: formData.chapter }),
      },
    })

    if (success) {
      setSubmitted(true)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target
    // When platform changes, clear all platform-specific sub-fields
    if (id === 'platform') {
      setFormData((prev) => ({
        ...prev,
        platform: value,
        region: '',
        constituency: '',
        country: '',
        chapter: '',
      }))
      return
    }
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <main className="bg-surface-warm font-body-md min-h-screen pb-24">
      <SEO
        title="Get in Touch"
        description="Have a question or want to get involved? Reach out to our team. We are a movement of ordinary citizens building an extraordinary nation."
        canonical="/contact"
      />
      {/* Header */}
      <div className="contact-hero text-white pt-24 pb-16 relative overflow-hidden">
        <div className="page-container relative z-10 text-center">
          <Breadcrumbs variant="dark" />
          <h1 className="text-white text-5xl md:text-7xl font-medium tracking-tighter mb-4">
            Get in touch
          </h1>
          <div className={cn('bl', 'mx-auto')}>
            <div />
            <div />
            <div />
          </div>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-body-md prose-standard">
            Have a question or want to get involved? Reach out to our team. We are a movement of
            ordinary citizens building an extraordinary nation.
          </p>
        </div>
      </div>

      <div className="page-container mt-12 md:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact Info */}
          <ContactInfoPanel
            contactEmail={contactEmail as string}
            contactPhone={settings.primary_phone as string}
            contactAddress={settings.primary_address as string}
            contactAddressUrl={settings.primary_address_url as string}
          />

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 sm:p-8 md:p-12 border border-slate-200 rounded-none shadow-sm h-full">
              <h2 className="text-2xl font-medium text-charcoal-dark mb-8 font-meta tracking-tight">
                Send us a message
              </h2>

              {submitted ? (
                <div className="text-center py-12 md:py-20">
                  <div className="w-20 h-20 bg-surface-warm flex items-center justify-center mx-auto mb-6">
                    <span
                      className="material-symbols-outlined text-[var(--brand-green)]"
                      style={{ fontSize: 40 }}
                    >
                      send
                    </span>
                  </div>
                  <h3 className="text-xl font-medium text-charcoal-dark mb-3 font-meta tracking-tight">
                    Message sent
                  </h3>
                  <p className="text-slate-600 text-sm md:text-base max-w-xs mx-auto">
                    Thank you for reaching out. Our team will get back to you shortly.
                  </p>
                </div>
              ) : (
                <ContactForm
                  formData={formData}
                  handleChange={handleChange}
                  onFieldChange={handleFieldChange}
                  handleSubmit={handleSubmit}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
