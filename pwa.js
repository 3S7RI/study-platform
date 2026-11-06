// pwa.js — تسجيل الـ Service Worker + شريط «ثبّت التطبيق» (في الرئيسية بس)
(function () {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () {});
        });
    }
    var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
    if (standalone) return;
    if (!/main\.html$/.test(location.pathname)) return;

    var KEY = 'pwa_hint_dismissed_at', WEEK = 7 * 24 * 60 * 60 * 1000;
    function dismissed() { try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < WEEK; } catch (e) { return false; } }
    function remember() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }

    var bar = null;
    function hide() { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); bar = null; }
    function show(text, btnText, onBtn) {
        if (bar || dismissed()) return;
        bar = document.createElement('div');
        bar.setAttribute('role', 'dialog');
        bar.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;max-width:420px;margin:0 auto;z-index:9999;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--bg-card,#1e293b);color:var(--text-main,#f8fafc);border:1px solid var(--border-color,#334155);box-shadow:0 10px 25px rgba(0,0,0,.35);font-size:14px;direction:rtl';
        var t = document.createElement('span');
        t.style.cssText = 'flex:1;line-height:1.5';
        t.textContent = text;
        bar.appendChild(t);
        if (btnText) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = btnText;
            b.style.cssText = 'background:var(--primary,#6366f1);color:#fff;border:0;border-radius:10px;padding:8px 14px;min-height:40px;font-weight:bold;cursor:pointer;font-size:14px';
            b.onclick = onBtn;
            bar.appendChild(b);
        }
        var x = document.createElement('button');
        x.type = 'button';
        x.setAttribute('aria-label', 'إغلاق');
        x.textContent = '\u00d7';
        x.style.cssText = 'background:transparent;color:inherit;border:0;font-size:22px;min-width:40px;min-height:40px;cursor:pointer';
        x.onclick = function () { remember(); hide(); };
        bar.appendChild(x);
        document.body.appendChild(bar);
    }

    var deferred = null;
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferred = e;
        show('ثبّت رحلة دراسية على موبايلك وافتحها زي أي تطبيق', 'ثبّت', function () {
            if (!deferred) return;
            deferred.prompt();
            deferred.userChoice.then(function () { deferred = null; hide(); });
        });
    });
    window.addEventListener('appinstalled', hide);

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.addEventListener('load', function () {
            show('عشان تثبّت التطبيق: اضغط زر المشاركة في Safari وبعدين «إضافة إلى الشاشة الرئيسية»', null, null);
        });
    }
})();
