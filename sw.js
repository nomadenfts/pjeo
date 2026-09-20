/* Service Worker — Calculadora de Rótulos V3
   Estratégia: network-first para navegação, stale-while-revalidate para o resto.
   Pré-cacheia o app shell e as libs de CDN (jsPDF) para funcionamento offline. */
const V = 'rotulos-v17.0';
const PRECACHE = [
  './',
  './index.html',
  './calculadora-mobile.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => Promise.allSettled(PRECACHE.map(u => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navegação: rede primeiro, cache como fallback offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => {
          const cp = r.clone();
          caches.open(V).then(c => c.put('./calculadora-mobile.html', cp));
          return r;
        })
        .catch(() => caches.match('./calculadora-mobile.html'))
    );
    return;
  }

  // Demais recursos: stale-while-revalidate
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(r => {
          if (r && (r.status === 200 || r.type === 'opaque')) {
            const cp = r.clone();
            caches.open(V).then(c => c.put(req, cp));
          }
          return r;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
