/* global importScripts, firebase */
// Firebase Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyD8E7RD6lE9jxTuCwuzeWonrMx6Wo14mrE',
  authDomain: 'neocentral-65f0c.firebaseapp.com',
  projectId: 'neocentral-65f0c',
  storageBucket: 'neocentral-65f0c.firebasestorage.app',
  messagingSenderId: '739558148061',
  appId: '1:739558148061:web:740622d15e4e4a57289834',
});

const messaging = firebase.messaging();
const recentMessageIds = new Set();

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function getPayloadData(payload) {
  return payload?.data || {};
}

function getNotificationContent(payload) {
  const data = getPayloadData(payload);
  const notification = payload?.notification || {};

  return {
    title: notification.title || data.title || payload?.title || 'Notifikasi',
    body: notification.body || data.body || payload?.body || '',
    data,
  };
}

function getMessageId(payload, title, body) {
  const data = getPayloadData(payload);
  return (
    payload?.messageId ||
    payload?.fcmMessageId ||
    data.messageId ||
    data.notificationId ||
    data.id ||
    `${data.type || 'notification'}:${title}:${body}`
  );
}

async function showAndForwardNotification(payload) {
  const { title, body, data } = getNotificationContent(payload);
  const messageId = getMessageId(payload, title, body);

  if (recentMessageIds.has(messageId)) return;
  recentMessageIds.add(messageId);
  setTimeout(() => recentMessageIds.delete(messageId), 5000);

  await self.registration.showNotification(title, {
    body,
    data,
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: data.notificationId || data.guidanceId || data.type || messageId,
    renotify: true,
  });

  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientList) {
    try {
      client.postMessage({ __from: 'fcm-sw', title, body, data });
    } catch (e) {
      // Ignore clients that cannot receive messages.
    }
  }
}

messaging.onBackgroundMessage((payload) => {
  return showAndForwardNotification(payload);
});

// Fallback for non-FCM Web Push payloads.
self.addEventListener('push', (event) => {
  try {
    const payload = event.data ? event.data.json() : {};
    event.waitUntil(showAndForwardNotification(payload));
  } catch (e) {
    // Ignore malformed push payloads.
  }
});

self.addEventListener('notificationclick', (event) => {
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
