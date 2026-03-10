// KOFA Service Worker — handles push notifications
// This file must be in /public/ to be accessible at root scope

const CACHE_NAME = 'kofa-v1'

// Listen for push events from the server
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {}

    const options = {
        body: data.body || 'New activity on KOFA',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'kofa-notification',
        data: {
            url: data.url || '/dashboard',
            type: data.type || 'general'
        },
        actions: data.actions || []
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'KOFA', options)
    )
})

// Handle notification click — open the relevant page
self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    const url = event.notification.data?.url || '/dashboard'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Try to focus existing tab
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url)
                    return client.focus()
                }
            }
            // Open new tab if no existing one
            if (clients.openWindow) {
                return clients.openWindow(url)
            }
        })
    )
})

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim())
})
