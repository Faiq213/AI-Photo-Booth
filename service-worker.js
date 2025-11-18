const CACHE_NAME = 'ai-photo-booth-v1';
const urlsToCache = [
  '/',
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'services/geminiService.ts',
  'components/Header.tsx',
  'components/ImageUploader.tsx',
  'components/MultiImageUploader.tsx',
  'components/ResultDisplay.tsx',
  'components/IconComponents.tsx',
  'components/ImageCropperModal.tsx',
  'components/SuitDescriptionInput.tsx',
  'components/SceneDescriptionInput.tsx',
  'components/LogoDescriptionInput.tsx',
  'components/GenerativeSceneDescriptionInput.tsx',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react-image-crop/dist/ReactCrop.css',
  'https://aistudiocdn.com/@google/genai@^1.25.0',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0',
  'https://aistudiocdn.com/react-image-crop@^11.0.10',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Install event: open a cache and add the app shell files to it
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use a non-blocking approach to caching non-essential assets
        return cache.addAll(urlsToCache).catch(error => {
          console.warn('Failed to cache all assets during install:', error);
        });
      })
  );
});

// Fetch event: serve cached content when offline, with a network-first fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, and cache it for next time
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

// Activate event: remove old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});