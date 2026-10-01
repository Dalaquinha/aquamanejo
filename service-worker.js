// Service worker: guarda todos os arquivos no aparelho (cache-first).
// Ao alterar qualquer arquivo, aumente CACHE para forçar atualização.
const CACHE = 'aquamanejo-v3';
const ARQUIVOS = ['./','index.html','style.css','app.js','manifest.json','icon.svg','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png',
  'data/especies.js','data/racao.js','data/agua.js','data/doencas.js','data/biblioteca.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('index.html'))));
});
