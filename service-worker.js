const CACHE_NAME = 'garvit-card-v1';
const PRECACHE_URLS = [
  '/',
  'index.html',
  'offline.html',
  'manifest.json',
  'icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

// Basic cache-first strategy with offline fallback for navigation
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // navigation requests -> serve index.html from cache or offline.html
  if(req.mode === 'navigate'){
    event.respondWith(
      fetch(req).catch(()=> caches.match('index.html')).catch(()=> caches.match('offline.html'))
    );
    return;
  }

  // other requests: try cache first, then network, then fallback
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      // optionally cache fetched assets
      if(req.method === 'GET' && resp && resp.status === 200){
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return resp;
    }).catch(()=> {
      // fallback to offline page for HTML documents
      if(req.headers.get('accept') && req.headers.get('accept').includes('text/html')){
        return caches.match('offline.html');
      }
    }))
  );
});
