import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import SEO from '@/components/SEO'
import { BrandLine } from '@/components/ui/BrandLine'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { useFaqItems } from '@/hooks/queries/usePublicContent'

const KNOWN_CATEGORY_ORDER = [
  'General & Mission',
  'Founder & Leadership',
  'Diaspora & Registration',
  'App & Security',
]

function stripHtml(html: string) {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').trim()
}

export default function FAQ() {
  const { data: items = [] } = useFaqItems()
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  // undefined = user hasn't clicked yet, fall back to the hash-matched (or first) item
  const [manualOpenId, setManualOpenId] = useState<string | null | undefined>(undefined)
  const hasScrolledRef = useRef(false)

  const hashSlug = window.location.hash.replace('#', '')
  const defaultItem = items.find((i) => i.slug === hashSlug) || items[0]
  const openId = manualOpenId !== undefined ? manualOpenId : (defaultItem?.id ?? null)

  useEffect(() => {
    if (hasScrolledRef.current || !hashSlug || items.length === 0) return
    hasScrolledRef.current = true
    requestAnimationFrame(() => {
      document.getElementById(hashSlug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [items, hashSlug])

  const toggleAccordion = (id: string) => {
    setManualOpenId((prev) => {
      const current = prev !== undefined ? prev : (defaultItem?.id ?? null)
      return current === id ? null : id
    })
  }

  const categories = useMemo(() => {
    const present = new Set(items.map((i) => i.category))
    const ordered = KNOWN_CATEGORY_ORDER.filter((c) => present.has(c))
    const extra = [...present].filter((c) => !KNOWN_CATEGORY_ORDER.includes(c))
    return ['All', ...ordered, ...extra]
  }, [items])

  const filteredFaqs = items.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesSearch =
      !searchQuery.trim() ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stripHtml(item.answerHtml).toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripHtml(item.answerHtml),
      },
    })),
  }

  return (
    <main className="min-h-screen pb-24" style={{ background: 'hsl(var(--container-low))' }}>
      <style>{`
        .faq-answer a { color: hsl(var(--primary)); font-weight: 600; text-decoration: none; }
        .faq-answer a:hover { text-decoration: underline; }
        .faq-answer p { margin: 0 0 12px; }
        .faq-answer p:last-child { margin-bottom: 0; }
      `}</style>
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
                  id={item.slug}
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
                    <div
                      className="px-6 pb-6 pt-0 border-t border-slate-100 text-sm text-slate-600 leading-relaxed font-body-md"
                      style={{ overflowWrap: 'break-word' }}
                    >
                      <div
                        className="pt-4 faq-answer"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(item.answerHtml, {
                            ADD_ATTR: ['target'],
                          }),
                        }}
                      />
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
