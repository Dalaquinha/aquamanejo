// Service worker: guarda todos os arquivos no aparelho (cache-first).
// Ao alterar qualquer arquivo, aumente CACHE para forçar atualização.
const CACHE = 'aquamanejo-v5';
const ARQUIVOS = ['./','index.html','style.css','app.js','manifest.json','icon.svg','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png',
  'dados-especies.js','dados-racao.js','dados-agua.js','dados-doencas.js','dados-biblioteca.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(ARQUIVOS.map(a => c.add(a).catch(() => {}))))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// Rede primeiro (sempre pega a versão nova quando há internet; espera no máximo 4 s); sem internet usa o que está guardado.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Mostra o que está guardado (rápido, funciona offline) e atualiza o cache em segundo plano: a próxima abertura já vem atualizada.
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(guardado => {
    const rede = fetch(e.request).then(res => { if (res.ok && new URL(e.request.url).origin === location.origin) c.put(e.request, res.clone()); return res; });
    return guardado || rede.catch(() => c.match('index.html'));
  })));
});
