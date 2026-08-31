import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'

interface FAQItem {
  id: string
  category:
    | 'General & Mission'
    | 'Founder & Leadership'
    | 'Diaspora & Registration'
    | 'App & Security'
  question: string
  answer: React.ReactNode
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'q1',
    category: 'General & Mission',
    question: 'What is The Base Movement in Ghana?',
    answer: (
      <>
        The Base Movement is a grassroots socio-political organization in Ghana focused on
        industrialization, job creation, and economic accountability under the core mission{' '}
        <strong>&quot;Ghana First, Jobs for the Youth&quot;</strong>.
      </>
    ),
  },
  {
    id: 'q2',
    category: 'Founder & Leadership',
    question: 'Who is the founder of The Base Movement?',
    answer: (
      <>
        The Base Movement was founded by Ghanaian businessman and philanthropist{' '}
        <strong>Dr. George Oti Bonsu</strong> to empower youth, foster disciplined governance, and
        drive nationwide economic transformation.
      </>
    ),
  },
  {
    id: 'q3',
    category: 'Diaspora & Registration',
    question: 'How do I join The Base Movement from the Diaspora?',
    answer: (
      <>
        Ghanaians living abroad can join by visiting our official website and completing the online{' '}
        <Link
          to="/register?platform=DIASPORA"
          className="text-primary font-semibold hover:underline"
        >
          Diaspora Registration Form
        </Link>{' '}
        to get assigned to your international country chapter and receive your verified digital
        membership card.
      </>
    ),
  },
  {
    id: 'q4',
    category: 'App & Security',
    question: 'Does The Base Movement have an official mobile app?',
    answer: (
      <>
        Yes, The Base Movement provides an official, lightweight Progressive Web App (PWA) directly
        via our website at{' '}
        <Link to="/app" className="text-primary font-semibold hover:underline">
          thebasemovement.org.gh/app
        </Link>
        . It can be installed in seconds on Android, iPhone/iPad (iOS Safari), and Desktop without
        requiring Google Play Store or Apple App Store accounts.
      </>
    ),
  },
  {
    id: 'q5',
    category: 'General & Mission',
    question: 'How does The Base Movement plan to create youth jobs in Ghana?',
    answer: (
      <>
        Through our strategic <strong>1-Million Jobs Plan</strong> focused on priority economic
        sectors including agricultural industrialization, technical trades, digital technology, and
        local manufacturing across all 16 regions of Ghana. Read our complete blueprint on{' '}
        <Link to="/our-agenda" className="text-primary font-semibold hover:underline">
          The Plan
        </Link>{' '}
        page.
      </>
    ),
  },
  {
    id: 'q6',
    category: 'General & Mission',
    question: 'Where is the national headquarters of The Base Movement located?',
    answer: (
      <>
        Our national headquarters is located at{' '}
        <strong>HQXC+Q76 The Base Movement, Accra, Ghana</strong>. You can find full contact details
        and Google Maps location on our{' '}
        <Link to="/contact" className="text-primary font-semibold hover:underline">
          Contact Page
        </Link>
        .
      </>
    ),
  },
  {
    id: 'q7',
    category: 'Diaspora & Registration',
    question: 'How do I download the physical membership registration form?',
    answer: (
      <>
        Printable PDF membership entry forms for both Ghana and Diaspora networks can be previewed
        and downloaded directly on our{' '}
        <Link
          to="/registration-form-preview?platform=GHANA"
          target="_blank"
          className="text-primary font-semibold hover:underline"
        >
          Downloadable Registration Forms
        </Link>{' '}
        page. Once filled, scanned copies can be uploaded online for processing.
      </>
    ),
  },
  {
    id: 'q8',
    category: 'General & Mission',
    question: 'How can I support or donate to The Base Movement?',
    answer: (
      <>
        You can support community projects, youth training initiatives, and branch operations by
        visiting our secure{' '}
        <Link to="/donate" className="text-primary font-semibold hover:underline">
          Donation Portal
        </Link>{' '}
        or purchasing official movement merchandise at the{' '}
        <Link to="/store" className="text-primary font-semibold hover:underline">
          Base Store
        </Link>
        .
      </>
    ),
  },
]

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [openId, setOpenId] = useState<string | null>('q1')

  const toggleAccordion = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesSearch =
      !searchQuery.trim() ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === 'string' &&
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          item.id === 'q1'
            ? "The Base Movement is a grassroots socio-political organization in Ghana focused on industrialization, job creation, and economic accountability under the core mission 'Ghana First, Jobs for the Youth'."
            : item.id === 'q2'
              ? 'The Base Movement was founded by Ghanaian businessman and philanthropist Dr. George Oti Bonsu to empower youth and foster disciplined governance.'
              : item.id === 'q3'
                ? 'Ghanaians living abroad can join by visiting our official website (thebasemovement.org.gh/register) and completing the online Diaspora registration form to get verified.'
                : item.id === 'q4'
                  ? 'The Base Movement provides an official, lightweight Progressive Web App (PWA) directly via the website (thebasemovement.org.gh/app) that can be installed on Android, iOS, and Desktop without Google Play Store or Apple App Store.'
                  : item.id === 'q5'
                    ? 'Through a target 1-Million Jobs Plan focused on priority sectors including agricultural industrialization, technical trades, digital technology, and local manufacturing across all 16 regions.'
                    : item.id === 'q6'
                      ? 'The national headquarters is located at HQXC+Q76 The Base Movement, Accra, Ghana.'
                      : item.id === 'q7'
                        ? 'Printable PDF membership entry forms for both Ghana and Diaspora networks can be downloaded on the website at thebasemovement.org.gh/registration-form-preview.'
                        : 'You can support community projects, youth training initiatives, and branch operations by visiting our secure donation portal at thebasemovement.org.gh/donate.',
      },
    })),
  }

  const categories = [
    'All',
    'General & Mission',
    'Founder & Leadership',
    'Diaspora & Registration',
    'App & Security',
  ]

  return (
    <main className="min-h-screen pb-24" style={{ background: 'hsl(var(--container-low))' }}>
      <SEO
        title="Frequently Asked Questions (FAQ) | The Base Movement"
        description="Find clear answers to key questions about The Base Movement, founder Dr. George Oti Bonsu, joining from the Diaspora, app download, and youth job plans."
        keywords="what is the base movement in ghana, who is the founder of the base movement, dr george oti bonsu, how to join the base movement from diaspora, the base movement app download, the base movement faq"
        canonical="/faq"
        jsonLd={faqSchema}
      />

      {/* Header Banner */}
      <header className="bg-charcoal-dark text-white pt-24 pb-16 border-b-4 border-brand-green relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="page-container relative z-10 text-center max-w-3xl mx-auto">
          <Breadcrumbs />
          <span
            className="pill pill-ok"
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
              marginTop: 16,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              help
            </span>
            Official Knowledge Base
          </span>

          <h1 className="text-white text-4xl md:text-5xl font-medium tracking-tight mb-3 font-meta">
            Frequently Asked Questions
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BrandLine />
          </div>
          <p className="text-base text-slate-300 font-body-md leading-relaxed">
            Get instant, verified answers regarding The Base Movement, founder Dr. George Oti Bonsu,
            registration pipelines, mobile PWA app, and regional branch operations.
          </p>

          {/* Search Box */}
          <div className="mt-8 relative max-w-xl mx-auto">
            <span
              className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              style={{ fontSize: 20 }}
            >
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. founder, app, diaspora, jobs)…"
              className="w-full h-12 pl-12 pr-4 bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-full text-sm font-medium focus:outline-none focus:border-brand-green transition-colors backdrop-blur-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  close
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="page-container py-12 max-w-4xl mx-auto">
        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 16px', fontSize: 12, borderRadius: 'var(--radius-pill)' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((item) => {
              const isOpen = openId === item.id
              return (
                <div
                  key={item.id}
                  className="bg-white border border-border shadow-sm rounded-none transition-all duration-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 bg-transparent border-none cursor-pointer select-none hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-primary/10 text-primary p-2 rounded-sm shrink-0">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          quiz
                        </span>
                      </span>
                      <h3 className="text-base md:text-lg font-semibold text-charcoal-dark margin-0 tracking-tight">
                        {item.question}
                      </h3>
                    </div>
                    <span
                      className={`material-symbols-outlined text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                      style={{ fontSize: 22 }}
                    >
                      expand_more
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 border-t border-slate-100 text-sm text-slate-600 leading-relaxed font-body-md">
                      <div className="pt-4">{item.answer}</div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="bg-white p-12 text-center border border-border">
              <span
                className="material-symbols-outlined text-slate-300 mb-3"
                style={{ fontSize: 40 }}
              >
                search_off
              </span>
              <h3 className="text-base font-semibold text-charcoal-dark mb-1">
                No matching questions found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                We couldn&apos;t find any questions matching &quot;{searchQuery}&quot;. Try
                adjusting your search query or view all questions.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setActiveCategory('All')
                }}
                className="btn btn-sm btn-primary"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* CTA Contact Footer */}
        <div className="mt-16 bg-white p-8 border border-border text-center shadow-sm">
          <span className="material-symbols-outlined text-primary mb-3" style={{ fontSize: 32 }}>
            support_agent
          </span>
          <h3 className="text-xl font-bold text-charcoal-dark mb-2">Still have questions?</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Can&apos;t find the answer you&apos;re looking for? Reach out directly to our central
            communications and member support desk.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/contact"
              className="btn btn-primary px-6 py-2.5 text-xs font-bold rounded-full"
            >
              Contact Us
            </Link>
            <Link
              to="/register"
              className="btn btn-outline px-6 py-2.5 text-xs font-bold rounded-full"
            >
              Join The Base
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
