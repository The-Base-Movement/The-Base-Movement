const CACHE = 'tbm-v1'

const PRECACHE = [
  '/',
  '/offline.html',
  '/branding/logo.png',
  '/branding/favicon.ico',
]

// Install: precache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// Activate: clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle http/https — chrome-extension:// and others will throw on cache.put
  if (!url.protocol.startsWith('http')) return

  // Never intercept Supabase API calls — always need fresh auth/data
  if (url.hostname.includes('supabase.co')) return

  // Static assets (JS, CSS, images, fonts) — cache first
  if (/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Navigation (HTML pages) — network first, fall back to cache then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match('/offline.html'))
        )
    )
  }
})
