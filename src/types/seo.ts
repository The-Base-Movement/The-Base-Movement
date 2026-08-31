export interface PageSEOConfig {
  path: string
  label: string
  title: string
  description: string
  focusKeyword: string
  keywords?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCard?: 'summary_large_image' | 'summary'
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  canonicalUrl?: string
  noindex?: boolean
  customJsonLd?: string
  updatedAt?: string
}

export interface SEORuleResult {
  id: string
  category: 'basic' | 'title' | 'description' | 'slug' | 'social' | 'technical'
  title: string
  score: number
  maxScore: number
  passed: boolean
  message: string
  tip?: string
}

export interface SEOAnalysis {
  totalScore: number
  grade: 'GOOD' | 'OK' | 'POOR'
  gradeColor: string
  rules: SEORuleResult[]
  passedCount: number
  totalCount: number
}

const TOP_GSC_KEYWORDS =
  'the base movement ghana, the base movement, Dr George Oti Bonsu, Dr. George Oti Bonsu, George Oti Bonsu, the base movement ghana registration online, the base registration online login, the base ghana, base movement ghana, the base movement ghana registration, thebasemovement.org.gh, the base movement app, oti bonsu base movement, george oti bonsu npp, the base movement founder, how to register for the base movement, the base movement registration link, the base movement login, the base movement head office accra, the base movement tesano, the base movement chapters, ghana first jobs for the youth, new political movements in ghana 2026, jobs for the youth ghana, third force political party ghana, the base ghana first, the base movement ghana registration form, the base movement ghana jobs, the base ghana first sues the base movement, the base ghana first registration, the base party'

export const DEFAULT_PAGE_CONFIGS: PageSEOConfig[] = [
  {
    path: '/',
    label: 'Home Page',
    title: 'The Base Movement | Ghana First, Jobs for the Youth',
    description:
      'Join The Base Movement in Ghana and across the diaspora. We are committed to youth employment, accountable leadership, civic action, and economic progress.',
    focusKeyword: 'The Base Movement',
    keywords: TOP_GSC_KEYWORDS,
    canonicalUrl: 'https://www.thebasemovement.org.gh/',
    ogTitle: 'The Base Movement | Ghana First, Jobs for the Youth',
    ogDescription:
      'Join citizens in Ghana and across the diaspora working together for youth employment and accountable leadership.',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/app',
    label: 'Download App',
    title: 'Download The Base Movement App | Official PWA for Mobile & Desktop',
    description:
      'Install the official app of The Base Movement on Android, iOS, and Desktop. Get instant access to member tools, regional updates, and youth job notifications.',
    focusKeyword: 'the base movement app',
    keywords: `${TOP_GSC_KEYWORDS}, install base movement app, progressive web app ghana`,
    canonicalUrl: 'https://www.thebasemovement.org.gh/app',
    ogTitle: 'Download The Base Movement App | Official PWA',
    ogDescription:
      'Install the official app of The Base Movement on your Android, iPhone, or Desktop device.',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/about',
    label: 'About Us',
    title: 'About Us | The Base Movement',
    description:
      'Discover The Base Movement — a grassroots movement uniting Ghanaians at home and across the diaspora behind youth empowerment and accountable governance.',
    focusKeyword: 'The Base Movement',
    keywords: `${TOP_GSC_KEYWORDS}, about the base movement`,
    canonicalUrl: 'https://www.thebasemovement.org.gh/about',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/our-agenda',
    label: 'Our Agenda (The Plan)',
    title: 'The Plan for Ghana | The Base Movement',
    description:
      "Explore The Base Movement's strategic agenda for Ghana. Read our actionable blueprint focusing on youth job creation, industry growth, and good governance.",
    focusKeyword: 'Plan for Ghana',
    keywords: `${TOP_GSC_KEYWORDS}, agenda for ghana`,
    canonicalUrl: 'https://www.thebasemovement.org.gh/our-agenda',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/chapters',
    label: 'Base Diaspora (Chapters)',
    title: 'Base Diaspora Communities | The Base Movement',
    description:
      "Connect with Base Diaspora communities globally. Join members in your country or city to share skills, build networks, and drive Ghana's economic development.",
    focusKeyword: 'Base Diaspora',
    keywords: `${TOP_GSC_KEYWORDS}, diaspora chapter ghana`,
    canonicalUrl: 'https://www.thebasemovement.org.gh/chapters',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/register',
    label: 'Member Registration',
    title: 'Official Member Registration | The Base Movement',
    description:
      'Join The Base Movement today. Complete your official Ghana or Diaspora registration online, download physical sign-up forms, and get verified.',
    focusKeyword: 'how to register for the base movement',
    keywords: `${TOP_GSC_KEYWORDS}, official member registration, how to register for the base movement, the base movement registration link, the base movement ghana registration online, the base movement registration form, the base ghana registration, join the base movement`,
    canonicalUrl: 'https://www.thebasemovement.org.gh/register',
    ogTitle: 'Official Member Registration | The Base Movement',
    ogDescription:
      'Join The Base Movement today. Complete your official Ghana or Diaspora registration online, download physical sign-up forms, and get verified.',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/blog',
    label: 'Updates & Articles (Blog)',
    title: 'Updates & Articles | The Base Movement',
    description:
      'Read the latest articles, policy briefs, and movement updates from The Base Movement on youth employment, governance, and national development in Ghana.',
    focusKeyword: 'The Base Movement updates',
    canonicalUrl: 'https://www.thebasemovement.org.gh/blog',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/jobs',
    label: 'Jobs Board',
    title: 'Youth Jobs Board | The Base Movement',
    description:
      'Browse youth employment and job opportunities across Ghana and the diaspora network. Apply directly for verified positions within The Base Movement.',
    focusKeyword: 'youth jobs Ghana',
    canonicalUrl: 'https://www.thebasemovement.org.gh/jobs',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/officers',
    label: 'National Leadership',
    title: 'National Leadership | The Base Movement',
    description:
      'Meet the national leadership and officers of The Base Movement. Dedicated leaders driving youth empowerment, job creation, and grassroots mobilization in Ghana.',
    focusKeyword: 'The Base Movement leadership',
    canonicalUrl: 'https://www.thebasemovement.org.gh/officers',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/donate',
    label: 'Donate & Support',
    title: 'Support the Movement | The Base Movement',
    description:
      'Support The Base Movement. Your contribution directly funds grassroots organizing, youth employment programs, and civic action in Ghana and the diaspora.',
    focusKeyword: 'Donate to The Base Movement',
    canonicalUrl: 'https://www.thebasemovement.org.gh/donate',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/contact',
    label: 'Contact Us',
    title: 'Get in Touch | The Base Movement',
    description:
      'Get in touch with The Base Movement in Ghana or across the diaspora. Contact our team to ask questions, share feedback, or find out how to get involved.',
    focusKeyword: 'Contact The Base Movement',
    canonicalUrl: 'https://www.thebasemovement.org.gh/contact',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/constituencies',
    label: 'Constituencies',
    title: 'Constituency Hubs | The Base Movement',
    description:
      'Explore The Base Movement across all 275 constituencies of Ghana. Find your local constituency hub, view member counts, and connect with your area coordinator.',
    focusKeyword: 'constituency hubs Ghana',
    canonicalUrl: 'https://www.thebasemovement.org.gh/constituencies',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/store',
    label: 'Movement Store',
    title: 'Official Store | The Base Movement',
    description:
      'Shop official gear at The Base Movement store. Wear the movement colors — 100% of merchandise proceeds directly support youth job programs across Ghana.',
    focusKeyword: 'The Base Movement store',
    canonicalUrl: 'https://www.thebasemovement.org.gh/store',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/polls',
    label: 'Polls & Feedback',
    title: 'Polls & Member Feedback | The Base Movement',
    description:
      'Participate in active opinion polls and civic feedback surveys within The Base Movement. Your voice directly shapes our national policy and campaign strategy.',
    focusKeyword: 'member feedback polls',
    canonicalUrl: 'https://www.thebasemovement.org.gh/polls',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/press',
    label: 'Press Center',
    title: 'Press Room & Official Media Updates | The Base Movement',
    description:
      "Access official press releases, downloadable media kits, policy updates, and brand assets from The Base Movement's national communications and media relations desk.",
    focusKeyword: 'press releases Ghana',
    keywords: `${TOP_GSC_KEYWORDS}, the base movement press releases, the base movement media kit, official statements Dr George Oti Bonsu, Ghana political press room`,
    canonicalUrl: 'https://www.thebasemovement.org.gh/press',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/faq',
    label: 'Frequently Asked Questions (FAQ)',
    title: 'Frequently Asked Questions (FAQ) | The Base Movement',
    description:
      'Find clear answers to key questions about The Base Movement, founder Dr. George Oti Bonsu, joining from the Diaspora, app download, and youth job plans.',
    focusKeyword: 'What is The Base Movement in Ghana',
    keywords: `${TOP_GSC_KEYWORDS}, what is the base movement in ghana, who is the founder of the base movement, dr george oti bonsu, how to join the base movement from diaspora, the base movement app download, the base movement faq`,
    canonicalUrl: 'https://www.thebasemovement.org.gh/faq',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/privacy',
    label: 'Privacy Policy',
    title: 'Privacy Policy | The Base Movement',
    description:
      "Our commitment to your data rights under Ghana's Data Protection Act 843. Learn how The Base Movement collects, uses, and protects your personal information.",
    focusKeyword: 'privacy policy',
    canonicalUrl: 'https://www.thebasemovement.org.gh/privacy',
    ogImage: '/branding/og-image.png',
  },
  {
    path: '/terms',
    label: 'Terms of Service',
    title: 'Terms of Service | The Base Movement',
    description:
      'Read the official Terms of Service and membership agreement for The Base Movement, outlining platform usage rules, code of conduct, and member rights.',
    focusKeyword: 'terms of service',
    canonicalUrl: 'https://www.thebasemovement.org.gh/terms',
    ogImage: '/branding/og-image.png',
  },
]
