// sw.js — رحلة دراسية (PWA)
// الشبكة أولاً دايماً (عشان الطالب ياخد آخر نسخة)، والكاش بس لو النت قطع.
// مبيلمسش Firebase ولا أي طلب خارجي، ولا أي طلب غير GET.
var CACHE = 'studytrip-v1';
var PRECACHE = ['offline.html', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest'];

self.addEventListener('install', function (e) {
    e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET' || req.headers.has('range')) return;
    var url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    e.respondWith(
        fetch(req).then(function (res) {
            if (res && res.ok && res.type === 'basic') {
                var copy = res.clone();
                caches.open(CACHE).then(function (c) { c.put(req, copy); });
            }
            return res;
        }).catch(function () {
            return caches.match(req).then(function (hit) {
                if (hit) return hit;
                if (req.mode === 'navigate') return caches.match('offline.html');
                return Response.error();
            });
        })
    );
});
