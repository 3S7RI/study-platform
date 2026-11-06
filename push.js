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
    ok.onclick = async () => { ok.disabled = true; const r = await register(false); bar.remove(); if (r !== 'ok') try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} };
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
        if (!vapid) return 'novapid';                               // الأدمن لسه ما ضبطش المفتاح
        if (!silent) { const p = await Notification.requestPermission(); if (p !== 'granted') return 'denied'; }
        const { getMessaging, getToken } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js");
        const reg = await navigator.serviceWorker.ready;
        const token = await getToken(getMessaging(getApp()), { vapidKey: vapid, serviceWorkerRegistration: reg });
        if (!token) return 'fail';
        const email = String((window.PS && PS.email && PS.email()) || '').toLowerCase();
        if (!email) return 'noemail';
        await setDoc(doc(db, 'pushTokens', token), {
            token, email,
            studentId: String((window.PS && PS.studentId && PS.studentId()) || ''),
            ua: navigator.userAgent.slice(0, 120),
            updatedAt: Date.now()
        }, { merge: true });
        return 'ok';
    } catch (e) { console.warn('push register failed', e); return 'fail'; }
}


/* ---------------------- زر تفعيل الإشعارات الثابت ---------------------- */
const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
const MSG = {
    ok: '✅ تم تفعيل الإشعارات على جهازك',
    denied: 'الإشعارات مقفولة للموقع. دوس على القفل جنب الرابط ← الإشعارات ← سماح، وبعدها جرّب تاني.',
    novapid: 'الإشعارات لسه متجهزتش من الإدارة. جرّب بعد شوية.',
    noemail: 'سجّل دخولك الأول وبعدها فعّل الإشعارات.',
    fail: 'معرفناش نفعّل الإشعارات. اقفل الصفحة وافتحها تاني وجرّب.',
    ios: 'على الآيفون: دوس زرار المشاركة ← «إضافة إلى الشاشة الرئيسية»، وافتح المنصة من الأيقونة الجديدة، وبعدها فعّل الإشعارات.',
    nosupport: 'المتصفح ده مش بيدعم الإشعارات. جرّب Chrome.'
};

function paintBtn(btn) {
    const on = supported && Notification.permission === 'granted';
    btn.textContent = on ? '🔔 إشعارات الموبايل: مفعّلة ✅' : '🔔 فعّل إشعارات المنصة على جهازك';
    btn.style.opacity = on ? '.75' : '1';
}

function addButton() {
    if (/admin/.test(location.pathname) || document.getElementById('psPushBtn')) return;
    const anchor = document.querySelector('.welcome-section');
    if (!anchor) return;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;margin:6px 0 14px;direction:rtl';
    const btn = document.createElement('button');
    btn.id = 'psPushBtn';
    btn.style.cssText = 'background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:0;border-radius:12px;padding:10px 18px;font-weight:700;font-size:.95rem;cursor:pointer;font-family:inherit;box-shadow:0 6px 16px rgba(99,102,241,.35)';
    const note = document.createElement('div');
    note.style.cssText = 'font-size:.82rem;color:var(--text-muted,#94a3b8);text-align:center;line-height:1.6;max-width:420px';
    paintBtn(btn);
    btn.onclick = async () => {
        note.textContent = '';
        if (!supported) { note.textContent = (isIOS && !standalone) ? MSG.ios : MSG.nosupport; return; }
        if (Notification.permission === 'denied') { note.textContent = MSG.denied; return; }
        btn.disabled = true; btn.textContent = '... جاري التفعيل';
        const r = await register(false);
        btn.disabled = false; paintBtn(btn);
        note.textContent = MSG[r] || MSG.fail;
        if (r === 'ok') { const bar = document.getElementById('psPushBar'); if (bar) bar.remove(); }
    };
    wrap.append(btn, note);
    anchor.insertAdjacentElement('afterend', wrap);
}
addButton();
