// IAOSDopS 서비스워커 — 푸시 알림 수신 전용 (파일 캐시는 하지 않아 항상 최신 화면을 불러옴)
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(event){
  var d = {};
  try{ d = event.data ? event.data.json() : {}; }catch(e){ d = { title:'IAOSDopS', body: event.data ? event.data.text() : '' }; }
  var title = d.title || 'IAOSDopS';
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'favicon.png',
    tag: d.topic || 'iaosdops',
    data: { url: d.url || './index.html' }
  }));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
    for(var i=0;i<list.length;i++){ if('focus' in list[i]){ list[i].focus(); return; } }
    return clients.openWindow(url);
  }));
});
