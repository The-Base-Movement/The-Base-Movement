self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch (e) {
    return
  }

  const title = String(data.title ?? 'The Base Movement')
  const body = String(data.body ?? '')
  let notificationUrl = data.url ?? '/'

  // Ensure target URL is local and matches self.location.origin
  if (notificationUrl.startsWith('http://') || notificationUrl.startsWith('https://') || notificationUrl.startsWith('//')) {
    try {
      const parsedUrl = new URL(notificationUrl, self.location.origin)
      if (parsedUrl.origin !== self.location.origin) {
        notificationUrl = '/'
      }
    } catch (e) {
      notificationUrl = '/'
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: data.icon ?? '/logo192.png',
      badge: data.badge ?? '/logo192.png',
      data: { url: notificationUrl },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      let url = event.notification.data?.url ?? '/'
      
      // Enforce same-origin target URL
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
        try {
          const parsedUrl = new URL(url, self.location.origin)
          if (parsedUrl.origin !== self.location.origin) {
            url = '/'
          }
        } catch (e) {
          url = '/'
        }
      }

      const fullUrl = new URL(url, self.location.origin).toString()
      for (const client of list) {
        if (client.url === fullUrl && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(fullUrl)
    })
  )
})
