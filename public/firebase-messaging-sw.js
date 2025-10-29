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
    const title = data?.notification?.title || data?.title || 'Notifikasi';
    const body = data?.notification?.body || data?.body || '';
    const payloadData = data?.data || {};
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        data: payloadData,
        icon: '/vite.svg',
        badge: '/vite.svg',
      })
    );
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
