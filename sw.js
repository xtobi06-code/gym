/* Hält die App-Dateien vor, damit sie im Studio auch ohne Netz startet.
   Mit Netz kommt immer die frische Fassung; dauert das länger als 2,5 s, springt der Vorrat ein. */
const VORRAT = 'gym-v9';
const BILDER = 'gym-bilder';
const DATEIEN = ['./', 'gym.css', 'manifest.json', 'icons/gym-180.png', 'icons/gym-512.png',
  'js/util.js', 'js/store.js', 'js/bibliothek.js', 'js/sync.js', 'js/blatt.js', 'js/satz.js', 'js/live.js', 'js/plan.js', 'js/studio.js', 'js/info.js', 'js/fortschritt.js', 'js/mehr.js', 'js/vorlage.js', 'js/wisch.js', 'js/main.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VORRAT).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('gym-') && k !== VORRAT && k !== BILDER).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  // Übungsbilder und Anleitungen: einmal geladen, danach aus dem Vorrat, auch ohne Netz
  if (e.request.method === 'GET' && u.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open(BILDER).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // GitHub-Abgleich geht immer direkt ins Netz
  e.respondWith((async () => {
    const c = await caches.open(VORRAT);
    const alt = await c.match(e.request, { ignoreSearch: true });
    const netz = fetch(e.request, { cache: 'no-cache' }).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; });
    if (!alt) return netz;
    const zeit = new Promise((ok) => setTimeout(() => ok(null), 2500));
    return (await Promise.race([netz.catch(() => null), zeit])) || alt;
  })());
});
