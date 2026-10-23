// Mode hors ligne de Hexa Sort Multi.
// Même domaine que la version classique (beboxos.github.io) : le cache est donc préfixé « hexamulti- »
// (et non « hexa-sort- ») pour que les deux versions ne s'effacent jamais leurs caches.
// La page passe d'abord par le réseau (nouvelles versions dès qu'on est connecté), sinon la copie en cache.
// CACHE est réécrit par publish.ps1 avec la version du jeu.
const CACHE = 'hexamulti-1.3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('hexamulti-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Seulement les fichiers du site : les appels aux classements (Supabase) ne sont jamais mis en cache
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
