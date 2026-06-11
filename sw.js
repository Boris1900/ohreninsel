const CACHE_NAME = 'ohreninsel-v0.9.20';

const CACHE_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-1024.png',
  './berglandschaft_0.1.jpg',
  './meer_0.2.jpg',
  './nacht_meer_0.1.jpg',
  './wald_0.1.jpg',
  './bach_0.1.jpg',
  './regen_0.1.jpg',
  './cafe_0.1.jpg',
  './ohr3.png',
  './Sounds/Klangschale Morgenstern.mp3',
  './Sounds/Klangschale Mittagspause.mp3',
  './Sounds/Klangschale Abendrot.mp3',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Navigation (HTML-Seite): immer Netzwerk zuerst – so bekommt iOS stets die aktuelle index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Update-Check-Button: Netzwerk zuerst, dann Cache aktualisieren
  if (event.request.cache === 'reload') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Alle anderen Anfragen: Cache zuerst, Netzwerk als Fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

