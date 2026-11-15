// Recebe as notificações do Achei (enviadas pelo robô na nuvem) e abre o app no lugar certo ao tocar.
// Não guarda nada em cache: o app continua sempre carregando a versão mais nova.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Achei', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Achei', {
    body: d.body || '',
    icon: 'achei-192.png',
    badge: 'achei-192.png',
    tag: d.tag || undefined,
    data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const alvo = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abertas) {
      if (c.url.startsWith(self.registration.scope)) { await c.focus(); c.postMessage({ abrir: alvo }); return; }
    }
    await self.clients.openWindow(alvo);
  })());
});
