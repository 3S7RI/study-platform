// push.js — تفعيل إشعارات المنصة للطالب (FCM). بيتحمّل في main.html.
// - بيظهر شريط صغير «فعّل التنبيهات» (مرة كل 7 أيام لو الطالب قفله). التفعيل لازم بضغطة الطالب.
// - مفتاح VAPID العام بيتقرا من Firestore (config/push.vapidKey) اللي الأدمن بيحطه من admin-push.html.
// - من غير نت: مفيش حاجة بتحصل (الإشعارات جاية من الإنترنت أصلاً).
import { getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const KEY = 'ps_push_dismissed_at', WEEK = 7 * 86400000;
const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
if (supported && !/admin/.test(location.pathname)) init();

function dismissed() { try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < WEEK; } catch (e) { return false; } }

async function init() {
    try {
        if (Notification.permission === 'denied') return;
        if (Notification.permission === 'granted') { register(true); return; }   // بيجدّد التوكن بهدوء
        if (dismissed()) return;
        setTimeout(showBar, 6000);
    } catch (e) {}
}

function showBar() {
    if (document.getElementById('psPushBar')) return;
    const bar = document.createElement('div');
    bar.id = 'psPushBar';
    bar.style.cssText = 'position:fixed;bottom:12px;left:12px;right:12px;max-width:420px;margin:0 auto;z-index:9998;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--bg-card,#1e293b);color:var(--text-main,#f8fafc);border:1px solid var(--border-color,#334155);box-shadow:0 10px 25px rgba(0,0,0,.35);font-size:14px;direction:rtl';
    bar.innerHTML = '<span style="flex:1;line-height:1.5">🔔 فعّل التنبيهات عشان توصلك المنافسات والامتحانات الجديدة</span>';
    const ok = document.createElement('button');
    ok.textContent = 'فعّل';
    ok.style.cssText = 'background:#6366f1;color:#fff;border:0;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer';
    ok.onclick = async () => { ok.disabled = true; const r = await register(false); bar.remove(); if (!r) try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} };
    const no = document.createElement('button');
    no.textContent = '✕';
    no.setAttribute('aria-label', 'إغلاق');
    no.style.cssText = 'background:transparent;border:0;color:inherit;font-size:16px;cursor:pointer';
    no.onclick = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} bar.remove(); };
    bar.append(ok, no);
    document.body.appendChild(bar);
}

async function register(silent) {
    try {
        const db = getFirestore(getApp());
        const cfg = await getDoc(doc(db, 'config', 'push'));
        const vapid = cfg.exists() ? String(cfg.data().vapidKey || '').trim() : '';
        if (!vapid) return false;                                   // الأدمن لسه ما ضبطش المفتاح
        if (!silent) { const p = await Notification.requestPermission(); if (p !== 'granted') return false; }
        const { getMessaging, getToken } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js");
        const reg = await navigator.serviceWorker.ready;
        const token = await getToken(getMessaging(getApp()), { vapidKey: vapid, serviceWorkerRegistration: reg });
        if (!token) return false;
        const email = String((window.PS && PS.email && PS.email()) || '').toLowerCase();
        if (!email) return false;
        await setDoc(doc(db, 'pushTokens', token), {
            token, email,
            studentId: String((window.PS && PS.studentId && PS.studentId()) || ''),
            ua: navigator.userAgent.slice(0, 120),
            updatedAt: Date.now()
        }, { merge: true });
        return true;
    } catch (e) { console.warn('push register failed', e); return false; }
}
