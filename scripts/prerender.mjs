/**
 * Production Static Site Generation (SSG) Script
 * -------------------------------------------------------------
 * Performs static pre-rendering (prerendering) of public SEO routes in the build directory.
 * Mocking global document/navigator API context to support safe SSR execution.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { STATIC_ROUTES } from './public-routes.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

dotenv.config({ path: toAbsolute('../.env') })
dotenv.config({ path: toAbsolute('../.env.local'), override: true })

const routesToPrerender = STATIC_ROUTES.map((r) => r.path)

// Main function to run the production SSG build for specified static routes
async function prerender() {
  console.log('[PRERENDER] Starting production SSG process...')
  
  const templatePath = toAbsolute('../dist/index.html')
  if (!fs.existsSync(templatePath)) {
    console.error(`[PRERENDER] Client template not found at ${templatePath}. Run build:client first.`)
    process.exit(1)
  }
  
  const template = fs.readFileSync(templatePath, 'utf-8')
  
  const serverEntryPath = toAbsolute('../dist/server/entry-server.js')
  if (!fs.existsSync(serverEntryPath)) {
    console.error(`[PRERENDER] Server bundle not found at ${serverEntryPath}. Run build:server first.`)
    process.exit(1)
  }

  // Define minimal globals ONLY if they are missing and causing crashes during module initialization.
  // We avoid setting a full 'window' to allow the app's own SSR-safety checks to work correctly.
  const noop = () => {}
  const elementMock = { 
    style: {}, 
    appendChild: noop, 
    removeChild: noop, 
    setAttribute: noop,
    getAttribute: () => null,
    classList: { add: noop, remove: noop }
  }

  // Some libraries check for global 'document' or 'navigator' at the top level.
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
      createElement: () => ({ ...elementMock }),
      createTextNode: (text) => ({ text, ...elementMock }),
      getElementsByTagName: () => [elementMock],
      querySelector: () => elementMock,
      documentElement: elementMock,
      head: elementMock,
      body: elementMock,
      addEventListener: noop,
      removeEventListener: noop,
    }
  }

  if (typeof globalThis.navigator === 'undefined') {
    try {
      Object.defineProperty(globalThis, 'navigator', {
        value: { userAgent: 'node' },
        configurable: true,
        enumerable: true,
        writable: true
      })
    } catch (e) {}
  }

  // Import the built SSR bundle
  const { render } = await import(`file://${serverEntryPath}`)

  try {
    for (const url of routesToPrerender) {
      console.log(`[PRERENDER] Rendering route: ${url}`)
      
      let { appHtml, head } = await render(url)

      // Regex to extract SEO tags from appHtml if they ended up there (common in React 18 streaming)
      // Matches <title>...</title>, <meta...>, <link...>, and <script type="application/ld+json">...</script>
      const seoTagsRegex = /<(title|script)[^>]*>.*?<\/\1>|<(meta|link)[^>]*\/?>/gi
      const extractedTags = []
      
      appHtml = appHtml.replace(seoTagsRegex, (match) => {
        // Only move tags that are typical for the head or SEO
        if (match.includes('<title') || match.includes('<meta') || match.includes('<link') || match.includes('application/ld+json')) {
          extractedTags.push(match)
          return ''
        }
        return match
      })

      const finalHead = (head || '') + extractedTags.join('\n')

      const html = template
        .replace('<!--app-head-->', finalHead)
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

      const filePath = path.join(toAbsolute('../dist'), url === '/' ? 'index.html' : `${url}/index.html`)
      const dirPath = path.dirname(filePath)
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
      
      fs.writeFileSync(filePath, html)
      console.log(`[PRERENDER] Saved: ${url} (${html.length} bytes)`)
    }

    console.log('[PRERENDER] SSG completed successfully!')
  } catch (e) {
    console.error('[PRERENDER] SSG failed:', e)
    process.exit(1)
  }
}

prerender()

