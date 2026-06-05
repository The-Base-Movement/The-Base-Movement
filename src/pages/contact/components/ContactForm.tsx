interface ContactFormProps {
  formData: {
    fullName: string
    email: string
    phone: string
    platform: string
    message: string
  }
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  handleSubmit: (e: React.FormEvent) => void
}

export function ContactForm({ formData, handleChange, handleSubmit }: ContactFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="fullName"
          className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
        >
          Full name <span className="text-[var(--brand-red)]">*</span>
        </label>
        <input
          name="name-c11fb5"
          id="fullName"
          type="text"
          autoComplete="name"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
          >
            Email address
          </label>
          <input
            name="name-2d2db6"
            id="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
          >
            Phone number
          </label>
          <input
            name="name-1ec9f2"
            id="phone"
            type="text"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="platform"
          className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
        >
          Your platform
        </label>
        <select
          name="name-36f857"
          id="platform"
          autoComplete="off"
          value={formData.platform}
          onChange={handleChange}
          className="w-full form-understate p-4 text-charcoal-dark appearance-none text-sm bg-slate-50/50"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right .7rem top 50%',
            backgroundSize: '.65rem auto',
          }}
        >
          <option value="">Select your platform</option>
          <option value="GHANA">Base Ghana</option>
          <option value="DIASPORA">Base Diaspora</option>
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="message"
          className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
        >
          Message <span className="text-[var(--brand-red)]">*</span>
        </label>
        <textarea
          name="name-aab423"
          id="message"
          autoComplete="off"
          value={formData.message}
          onChange={handleChange}
          className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
        ></textarea>
      </div>

      <button type="submit" className="btn btn-primary w-full" style={{ height: 52 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          send
        </span>
        Send Message
      </button>
    </form>
  )
}
