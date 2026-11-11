// pwa.js — تسجيل الـ Service Worker + تجهيز زرار التثبيت.
// الشريط العائم اتشال من الرئيسية: التثبيت بقى من كارت «تثبيت التطبيق والإشعارات» في الملف الشخصي (push.js).
(function () {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () {});
        });
    }
    // كائن مشترك: الكارت في الملف الشخصي بيقرا منه حالة التثبيت
    var api = window.PSInstall = window.PSInstall || { deferred: null, installed: false };
    function changed() { try { window.dispatchEvent(new Event('ps-install-change')); } catch (e) {} }

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        api.deferred = e;
        api.installed = false;
        try { localStorage.removeItem('ps_installed'); } catch (x) {}   // المتصفح بيعرض التثبيت = التطبيق مش متثبت
        changed();
    });
    window.addEventListener('appinstalled', function () {
        api.installed = true;
        api.deferred = null;
        try { localStorage.setItem('ps_installed', '1'); } catch (x) {}
        changed();
    });
})();
