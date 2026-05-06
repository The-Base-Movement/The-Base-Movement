import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { Button } from '../components/ui/neon-button'
import { adminService } from '../services/adminService'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    platform: '',
    message: ''
  })

  useEffect(() => {
    async function fetchSettings() {
      const data = await adminService.getSiteSettings()
      setSettings(data)
    }
    fetchSettings()
  }, [])

  const contactEmail = (settings.primary_email as string) || 'info@thebasemovement.com'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const success = await adminService.submitContactForm({
      name: formData.fullName,
      email: formData.email,
      subject: formData.platform ? `Platform: ${formData.platform}` : 'General Inquiry',
      message: formData.message,
      metadata: {
        phone: formData.phone,
        platform: formData.platform
      }
    })

    if (success) {
      setSubmitted(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  return (
    <main className="bg-surface-warm font-body-md min-h-screen pb-24">
      {/* Header */}
      <div className="bg-charcoal-dark text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 bg-hero-gradient"></div>
        <div className="max-w-[1280px] mx-auto px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-h1 font-black mb-4 uppercase tracking-tighter font-meta">Contact Us</h1>
          <div className="flex h-1 w-24 mx-auto mb-6">
            <div className="flex-1 bg-[var(--brand-red)]"></div>
            <div className="flex-1 bg-[var(--brand-gold)]"></div>
            <div className="flex-1 bg-[var(--brand-green)]"></div>
          </div>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-body-md">
            Have a question or want to get involved? Reach out to our team. We are a movement of ordinary citizens building an extraordinary nation.
          </p>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 mt-12 md:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal-dark mb-4 font-meta uppercase tracking-tight">Get In Touch</h2>
              <p className="text-slate-600 mb-8 leading-relaxed text-sm md:text-base">
                Whether you're in Ghana or the Diaspora, your voice matters to this movement. Let us know how you'd like to contribute.
              </p>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-[var(--brand-green)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-meta">Email</p>
                  <p className="text-charcoal-dark font-medium text-sm md:text-base truncate">{contactEmail}</p>
                </div>
              </div>

              <div className="bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 md:w-6 md:h-6 text-[var(--brand-green)]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-meta">Phone</p>
                  <p className="text-charcoal-dark font-medium text-sm md:text-base">Contact via email for inquiries</p>
                </div>
              </div>

              <div className="bg-white p-5 md:p-6 border border-slate-200 rounded-none civic-card-shadow flex items-start gap-4 transition-transform hover:-translate-y-1">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-warm flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[var(--brand-green)]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-meta">Location</p>
                  <p className="text-charcoal-dark font-medium text-sm md:text-base">Ghana & Global Diaspora</p>
                </div>
              </div>

              {/* Headquarters Image */}
              <div className="overflow-hidden border border-slate-200 shadow-sm group bg-white">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src="/party-headquarters.webp" 
                    alt="The Base Party Headquarters" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   decoding="async" loading="lazy" />
                </div>
                <div className="p-5 border-t border-slate-100">
                  <p className="text-[10px] font-meta font-bold text-[var(--brand-green)] uppercase tracking-widest">Official Headquarters</p>
                  <p className="text-xs text-slate-500 mt-2 font-body-md leading-relaxed">
                    Our central hub in Accra, serving as the heart of movement operations and community engagement.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white p-6 sm:p-8 md:p-12 border border-slate-200 rounded-none shadow-sm h-full">
              <h2 className="text-2xl font-bold text-charcoal-dark mb-8 font-meta uppercase tracking-tight">Send Us a Message</h2>
              
              {submitted ? (
                <div className="text-center py-12 md:py-20">
                  <div className="w-20 h-20 bg-surface-warm flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10 text-[var(--brand-green)]" />
                  </div>
                  <h3 className="text-xl font-bold text-charcoal-dark mb-3 font-meta uppercase tracking-tight">Message Sent</h3>
                  <p className="text-slate-600 text-sm md:text-base max-w-xs mx-auto">Thank you for reaching out. Our team will get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-[10px] font-bold text-charcoal-dark font-meta uppercase tracking-widest">
                      FULL NAME <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <input 
                      id="fullName" 
                      type="text" 
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-[10px] font-bold text-charcoal-dark font-meta uppercase tracking-widest">EMAIL ADDRESS</label>
                      <input 
                        id="email" 
                        type="email" 
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-[10px] font-bold text-charcoal-dark font-meta uppercase tracking-widest">PHONE NUMBER</label>
                      <input 
                        id="phone" 
                        type="text" 
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="platform" className="text-[10px] font-bold text-charcoal-dark font-meta uppercase tracking-widest">YOUR PLATFORM</label>
                    <select 
                      id="platform" 
                      value={formData.platform}
                      onChange={handleChange}
                      className="w-full form-understate p-4 text-charcoal-dark appearance-none text-sm bg-slate-50/50"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                    >
                      <option value="">Select your platform</option>
                      <option value="GHANA">Base Ghana</option>
                      <option value="DIASPORA">Base Diaspora</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-[10px] font-bold text-charcoal-dark font-meta uppercase tracking-widest">
                      MESSAGE <span className="text-[var(--brand-red)]">*</span>
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
                    ></textarea>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-8 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" /> Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </main>
  )
}
