// sw.js — رحلة دراسية (PWA)
// القاعدة: مفيش أي صفحة أو حصة أو امتحان بيفتح من غير نت.
//  - الشبكة فقط. مفيش تخزين لأي صفحة أو ملف (الكاش القديم بيتمسح).
//  - لو النت قاطع وفتح صفحة: بتظهر offline.html بس.
//  - بيستقبل إشعارات الـ Push (FCM) ويعرضها، والضغط عليها بيفتح المنصة.
var CACHE = 'studytrip-shell-v3';
var PRECACHE = ['offline.html', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
    e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            // أي كاش قديم (كان بيخزّن الصفحات) بيتمسح
            return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;
    var url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    // الصفحات: شبكة فقط، ولو فشلت نعرض offline.html (من غير ما نخزّن أي صفحة)
    if (req.mode === 'navigate') {
        e.respondWith(
            // no-cache: بيتجاوز كاش المتصفح (HTTP cache) كمان، فمفيش صفحة بتفتح من غير نت حتى لو اتزارت قبل كده
            fetch(req, { cache: 'no-cache' }).catch(function () { return caches.match('offline.html'); })
        );
        return;
    }
    // باقي الملفات (JS/CSS/صور): شبكة عادية، من غير كاش. لو النت قطع بتفشل زي أي موقع.
});

/* ---------------------------- Push ---------------------------- */
self.addEventListener('push', function (e) {
    var p = {};
    try { p = e.data ? e.data.json() : {}; } catch (err) { try { p = { body: e.data.text() }; } catch (e2) {} }
    var n = p.notification || {};
    var d = p.data || {};
    var title = n.title || d.title || p.title || 'رحلة دراسية';
    var body = n.body || d.body || p.body || '';
    var link = d.url || n.click_action || p.url || 'main.html';
    e.waitUntil(self.registration.showNotification(title, {
        body: body,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        tag: d.tag || 'studytrip',
        data: { url: link }
    }));
});

self.addEventListener('notificationclick', function (e) {
    e.notification.close();
    var target = new URL((e.notification.data && e.notification.data.url) || 'main.html', self.location.origin).href;
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
            for (var i = 0; i < list.length; i++) {
                if ('focus' in list[i]) { list[i].navigate(target); return list[i].focus(); }
            }
            return self.clients.openWindow(target);
        })
    );
});
