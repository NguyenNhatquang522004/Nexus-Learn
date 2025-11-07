/* eslint-disable no-restricted-globals */
// Learn Your Way - Service Worker
// Version: 1.0.0

const CACHE_VERSION = 'learn-your-way-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints that can be cached
const CACHEABLE_API_ROUTES = [
  '/api/content',
  '/api/topics',
  '/api/quizzes',
  '/api/achievements',
  '/api/user/profile'
];

// Maximum cache sizes
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;
const MAX_API_CACHE_SIZE = 30;

// Cache duration (in milliseconds)
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const IMAGE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('learn-your-way-v') && name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE && name !== IMAGE_CACHE && name !== API_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Old caches cleaned up');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(new URL(request.url).pathname);
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         STATIC_ASSETS.includes(url.pathname);
}

// Cache-first strategy for images
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cached image is still valid
      const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time'));
      const now = new Date();
      
      if (now - cachedTime < IMAGE_CACHE_DURATION) {
        return cachedResponse;
      }
    }

    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cached-time', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(request, modifiedResponse);
      limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    
    // Return cached version if available
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return placeholder image
    return new Response(
      '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" fill="#999">No Image</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Network-first strategy with cache fallback for API
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route));

  if (!isCacheable) {
    // Don't cache non-cacheable API requests
    try {
      return await fetch(request);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Network unavailable', offline: true }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  try {
    // Try network first
    const networkResponse = await fetch(request.clone());

    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(API_CACHE);
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cached-time', new Date().toISOString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(request, modifiedResponse);
      limitCacheSize(API_CACHE, MAX_API_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', error);
    
    // Fallback to cache
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cache is still valid
      const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time'));
      const now = new Date();
      
      // Return cached data with stale indicator
      const clonedResponse = cachedResponse.clone();
      const body = await clonedResponse.json();
      
      return new Response(
        JSON.stringify({ 
          ...body, 
          _cached: true, 
          _stale: (now - cachedTime) > API_CACHE_DURATION 
        }),
        {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: cachedResponse.headers
        }
      );
    }

    // No cache available
    return new Response(
      JSON.stringify({ error: 'Content not available offline', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Network-first strategy for dynamic content
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network unavailable, trying cache:', error);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.open(STATIC_CACHE);
      const offlinePage = await offlineCache.match('/offline.html');
      
      if (offlinePage) {
        return offlinePage;
      }
    }

    throw error;
  }
}

// Limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-quiz-results') {
    event.waitUntil(syncQuizResults());
  } else if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  } else if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

// Sync quiz results
async function syncQuizResults() {
  try {
    const cache = await caches.open('pending-requests');
    const requests = await cache.keys();
    const quizRequests = requests.filter(req => req.url.includes('/api/quiz/submit'));

    for (const request of quizRequests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
          console.log('[SW] Quiz result synced successfully');
        }
      } catch (error) {
        console.error('[SW] Failed to sync quiz result:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync quiz results failed:', error);
  }
}

// Sync notes
async function syncNotes() {
  try {
    const cache = await caches.open('pending-requests');
    const requests = await cache.keys();
    const noteRequests = requests.filter(req => req.url.includes('/api/notes'));

    for (const request of noteRequests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
          console.log('[SW] Note synced successfully');
        }
      } catch (error) {
        console.error('[SW] Failed to sync note:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync notes failed:', error);
  }
}

// Sync progress
async function syncProgress() {
  try {
    const cache = await caches.open('pending-requests');
    const requests = await cache.keys();
    const progressRequests = requests.filter(req => req.url.includes('/api/progress'));

    for (const request of progressRequests) {
      try {
        const response = await fetch(request.clone());
        if (response.ok) {
          await cache.delete(request);
          console.log('[SW] Progress synced successfully');
        }
      } catch (error) {
        console.error('[SW] Failed to sync progress:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync progress failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);

  const options = {
    badge: '/icons/icon-72x72.png',
    icon: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'learn-your-way-notification',
    requireInteraction: false
  };

  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Learn Your Way', {
        ...options,
        body: data.body || 'You have a new notification',
        data: data.data || {},
        actions: data.actions || []
      })
    );
  } else {
    event.waitUntil(
      self.registration.showNotification('Learn Your Way', {
        ...options,
        body: 'You have a new notification'
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.addAll(urls))
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          console.error('[SW] Failed to cache URLs:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          console.error('[SW] Failed to clear cache:', error);
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
  }
});

console.log('[SW] Service worker loaded successfully');
