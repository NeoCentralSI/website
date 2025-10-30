/* global importScripts, firebase */
// Firebase Messaging Service Worker
self.addEventListener('install', () => {
  // skip waiting for faster updates
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Note: with Firebase v9 modular SDK on the page, the SW can use the compat script if needed.
// Users need to ensure firebase-app-compat and firebase-messaging-compat are available if using compat.

// Handle push events (for generic web push)
self.addEventListener('push', (event) => {
  try {
    const data = event.data ? event.data.json() : {};
    // Support both notification and data-only payloads
    const title = data?.notification?.title || data?.data?.title || data?.title || 'Notifikasi';
    const body = data?.notification?.body || data?.data?.body || data?.body || '';
    const payloadData = data?.data || {};
    event.waitUntil(
      (async () => {
        // Show OS notification
        await self.registration.showNotification(title, {
          body,
          data: payloadData,
          icon: '/vite.svg',
          badge: '/vite.svg',
        });
        // Forward payload to all open clients (pages) so foreground can react
        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clientList) {
          try {
            client.postMessage({ __from: 'fcm-sw', title, body, data: payloadData });
          } catch (e) {}
        }
      })()
    );
    try { console.log('[SW] push received', { title, body, payloadData }); } catch (e) {}
  } catch (e) {
    // ignore
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = '/notifikasi';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
