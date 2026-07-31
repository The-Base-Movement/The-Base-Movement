import type { PageSEOConfig, SEOAnalysis, SEORuleResult } from '@/types/seo'

/**
 * Combined Rank Math + AIOSEO Scoring Engine
 * Evaluates page title, meta description, URL slug, focus keyword, and social metadata.
 * Returns total score (0-100), overall grade, and individual rule breakdown.
 */
export function analyzeSEO(config: PageSEOConfig): SEOAnalysis {
  const rules: SEORuleResult[] = []
  const keyword = (config.focusKeyword || '').trim().toLowerCase()
  const title = (config.title || '').trim()
  const titleLower = title.toLowerCase()
  const desc = (config.description || '').trim()
  const descLower = desc.toLowerCase()
  const path = (config.path || '').trim()
  const pathLower = path.toLowerCase()

  // ── 1. Basic SEO Checks (35 Points) ────────────────────────────────────────

  // Focus Keyword Specified
  const hasKeyword = keyword.length > 0
  rules.push({
    id: 'has-keyword',
    category: 'basic',
    title: 'Focus Keyword Defined',
    score: hasKeyword ? 10 : 0,
    maxScore: 10,
    passed: hasKeyword,
    message: hasKeyword
      ? `Focus keyword set to "${config.focusKeyword}".`
      : 'Add a primary focus keyword to evaluate keyword density and targeting.',
    tip: 'Specify the primary search term you want this page to rank for.',
  })

  // Focus Keyword in Title
  const keywordInTitle = hasKeyword && titleLower.includes(keyword)
  rules.push({
    id: 'keyword-in-title',
    category: 'basic',
    title: 'Focus Keyword in Page Title',
    score: keywordInTitle ? 10 : 0,
    maxScore: 10,
    passed: keywordInTitle,
    message: keywordInTitle
      ? 'Focus keyword is included in the page title.'
      : hasKeyword
        ? `Page title does not contain the focus keyword "${config.focusKeyword}".`
        : 'Specify a focus keyword first.',
    tip: 'Include your focus keyword naturally near the beginning of your title.',
  })

  // Focus Keyword at Start of Title
  const keywordAtTitleStart =
    hasKeyword && keywordInTitle && titleLower.indexOf(keyword) < title.length * 0.4
  rules.push({
    id: 'keyword-title-start',
    category: 'basic',
    title: 'Focus Keyword Near Start of Title',
    score: keywordAtTitleStart ? 5 : 0,
    maxScore: 5,
    passed: keywordAtTitleStart,
    message: keywordAtTitleStart
      ? 'Focus keyword appears near the beginning of the title.'
      : 'Move your focus keyword closer to the start of the title tag.',
    tip: 'Search engines place higher weight on keywords that appear near the beginning of title tags.',
  })

  // Focus Keyword in Meta Description
  const keywordInDesc = hasKeyword && descLower.includes(keyword)
  rules.push({
    id: 'keyword-in-desc',
    category: 'basic',
    title: 'Focus Keyword in Meta Description',
    score: keywordInDesc ? 10 : 0,
    maxScore: 10,
    passed: keywordInDesc,
    message: keywordInDesc
      ? 'Focus keyword is included in the meta description.'
      : hasKeyword
        ? `Meta description does not contain "${config.focusKeyword}".`
        : 'Specify a focus keyword first.',
    tip: 'Keywords in meta descriptions are highlighted in search results when users query them.',
  })

  // ── 2. Title Optimization (20 Points) ──────────────────────────────────────

  const titleLen = title.length
  const titleOptimal = titleLen >= 45 && titleLen <= 60
  const titleAcceptable = titleLen >= 30 && titleLen <= 65
  const titleScore = titleOptimal ? 15 : titleAcceptable ? 8 : 0

  rules.push({
    id: 'title-length',
    category: 'title',
    title: 'Title Length (45–60 characters)',
    score: titleScore,
    maxScore: 15,
    passed: titleOptimal,
    message: titleOptimal
      ? `Title length is ideal (${titleLen} characters).`
      : titleLen < 45
        ? `Title is too short (${titleLen} chars). Aim for 45–60 characters.`
        : `Title is too long (${titleLen} chars). It will be truncated in search results (>60 chars).`,
    tip: 'Optimal title length is between 45 and 60 characters for desktop and mobile search snippets.',
  })

  const titleFormat = title.includes('|') || title.includes('–') || title.includes('-')
  rules.push({
    id: 'title-branding',
    category: 'title',
    title: 'Title Brand & Delimiter Format',
    score: titleFormat ? 5 : 0,
    maxScore: 5,
    passed: titleFormat,
    message: titleFormat
      ? 'Title includes proper brand qualifier or delimiter (| or –).'
      : 'Add brand qualifier at the end (e.g. "| The Base Movement").',
    tip: 'Brand qualifiers build entity recognition with Google & Bing.',
  })

  // ── 3. Meta Description Optimization (20 Points) ──────────────────────────

  const descLen = desc.length
  const descOptimal = descLen >= 145 && descLen <= 162
  const descAcceptable = descLen >= 120 && descLen <= 165
  const descScore = descOptimal ? 15 : descAcceptable ? 8 : 0

  rules.push({
    id: 'desc-length',
    category: 'description',
    title: 'Meta Description Length (145–160 characters)',
    score: descScore,
    maxScore: 15,
    passed: descOptimal,
    message: descOptimal
      ? `Meta description length is optimal (${descLen} characters).`
      : descLen < 145
        ? `Meta description is short (${descLen} chars). Aim for 145–160 characters.`
        : `Meta description is long (${descLen} chars) and will be truncated with '...'.`,
    tip: 'Meta descriptions between 145 and 160 characters maximize search result snippet real estate.',
  })

  const descPunctuation = /[.!?]$/.test(desc)
  rules.push({
    id: 'desc-callout',
    category: 'description',
    title: 'Complete Sentence & Punctuation',
    score: descPunctuation ? 5 : 0,
    maxScore: 5,
    passed: descPunctuation,
    message: descPunctuation
      ? 'Meta description ends with clean terminal punctuation.'
      : 'End your meta description with a period, exclamation mark, or call-to-action.',
    tip: 'Full sentences improve click-through rates (CTR) on search results pages.',
  })

  // ── 4. URL / Slug Optimization (15 Points) ────────────────────────────────

  // Clean slug check (path contains focus keyword or clean words)
  const slugClean = path === '/' || !/[^a-z0-9/-]/i.test(path)
  const keywordInSlug =
    hasKeyword && (path === '/' || pathLower.includes(keyword.replace(/\s+/g, '-')))
  const slugScore = (slugClean ? 5 : 0) + (keywordInSlug || path === '/' ? 10 : 5)

  rules.push({
    id: 'slug-keyword',
    category: 'slug',
    title: 'Clean URL & Keyword Alignment',
    score: slugScore,
    maxScore: 15,
    passed: slugClean && (keywordInSlug || path === '/'),
    message:
      keywordInSlug || path === '/'
        ? 'URL path is clean and aligns with focus keyword.'
        : 'URL path is readable but does not match focus keyword slug.',
    tip: 'Short, clean URLs with hyphenated keywords perform best in search engine rankings.',
  })

  // ── 5. Social Media & Technical Completeness (10 Points) ────────────────────

  const hasOgImage = !!(config.ogImage || config.twitterImage)
  rules.push({
    id: 'og-image',
    category: 'social',
    title: 'Open Graph & Social Share Image',
    score: hasOgImage ? 5 : 0,
    maxScore: 5,
    passed: hasOgImage,
    message: hasOgImage
      ? 'Social preview image is configured.'
      : 'Add an Open Graph image URL for social media link previews.',
    tip: 'Rich 1200x630 share images significantly boost engagement on Twitter, WhatsApp, & Facebook.',
  })

  const hasCanonical = !!(config.canonicalUrl || config.path)
  rules.push({
    id: 'canonical-url',
    category: 'technical',
    title: 'Canonical Tag & Indexability',
    score: hasCanonical && !config.noindex ? 5 : 3,
    maxScore: 5,
    passed: hasCanonical && !config.noindex,
    message: !config.noindex
      ? 'Page is set to indexable with canonical URL.'
      : 'Page has noindex tag enabled (search engines will ignore this page).',
    tip: 'Ensure canonical URLs point to the authoritative domain address.',
  })

  // Calculate Total Score
  const totalScore = Math.min(
    100,
    rules.reduce((sum, r) => sum + r.score, 0)
  )
  const passedCount = rules.filter((r) => r.passed).length

  let grade: 'GOOD' | 'OK' | 'POOR' = 'POOR'
  let gradeColor = 'hsl(var(--destructive))'

  if (totalScore >= 80) {
    grade = 'GOOD'
    gradeColor = 'hsl(142 76% 36%)' // Vibrant Emerald Green
  } else if (totalScore >= 50) {
    grade = 'OK'
    gradeColor = 'hsl(45 93% 47%)' // Warm Gold / Amber
  }

  return {
    totalScore,
    grade,
    gradeColor,
    rules,
    passedCount,
    totalCount: rules.length,
  }
}
