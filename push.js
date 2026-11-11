// push.js — الإشعارات (FCM) + كارت «تثبيت التطبيق والإشعارات» في الملف الشخصي.
// - الكارت بيظهر في profile.html بس، وبيفضل ظاهر دايماً (حتى لو الاتنين متفعلين بيبقى شكله أخضر).
// - مفتاح VAPID العام بيتقرا من Firestore (config/push.vapidKey) اللي الأدمن بيحطه من admin-push.html.
// - في باقي الصفحات: لو الإشعارات متفعلة بالفعل بيجدّد التوكن بهدوء من غير أي شريط أو زرار.
import { getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const isAdminPage = /admin/.test(location.pathname);
const isProfile = /profile\.html$/.test(location.pathname);

const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

if (supported && !isAdminPage) {
    try { if (Notification.permission === 'granted' && !userOff()) register(true); } catch (e) {}   // تجديد التوكن بهدوء (إلا لو الطالب لغّى التفعيل)
}

const OFF_KEY = 'ps_push_off', TOKEN_KEY = 'ps_push_token', INST_KEY = 'ps_installed';
function userOff() { try { return localStorage.getItem(OFF_KEY) === '1'; } catch (e) { return false; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

// إلغاء تفعيل الإشعارات على الجهاز ده: بنمسح التوكن من FCM ومن Firestore وبنعلّم الجهاز إنه مقفول
async function unregister() {
    try {
        const db = getFirestore(getApp());
        const { getMessaging, getToken, deleteToken } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js");
        const { deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const messaging = getMessaging(getApp());
        let token = lsGet(TOKEN_KEY);
        if (!token) {
            try {
                const cfg = await getDoc(doc(db, 'config', 'push'));
                const vapid = cfg.exists() ? String(cfg.data().vapidKey || '').trim() : '';
                const reg = await navigator.serviceWorker.ready;
                if (vapid) token = await getToken(messaging, { vapidKey: vapid, serviceWorkerRegistration: reg });
            } catch (e) {}
        }
        if (token) { try { await deleteDoc(doc(db, 'pushTokens', token)); } catch (e) { console.warn('push token doc delete failed', e); } }
        try { await deleteToken(messaging); } catch (e) { console.warn('push deleteToken failed', e); }
        lsDel(TOKEN_KEY);
        lsSet(OFF_KEY, '1');
        return 'ok';
    } catch (e) { console.warn('push unregister failed', e); return 'fail'; }
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
        lsSet(TOKEN_KEY, token);
        lsDel(OFF_KEY);
        return 'ok';
    } catch (e) { console.warn('push register failed', e); return 'fail'; }
}

/* ---------------------- كارت الملف الشخصي ---------------------- */
const MSG = {
    ok: 'تم تفعيل الإشعارات على جهازك بنجاح.',
    denied: 'الإشعارات مقفولة للموقع في المتصفح. دوس على أيقونة القفل جنب الرابط ← الإشعارات ← سماح، وبعدها ارجع اضغط «فعّل» تاني.',
    novapid: 'الإشعارات لسه متجهزتش من الإدارة. جرّب بعد شوية.',
    noemail: 'سجّل دخولك الأول وبعدها فعّل الإشعارات.',
    fail: 'معرفناش نفعّل الإشعارات. اقفل الصفحة وافتحها تاني وجرّب.',
    ios: 'على الآيفون الإشعارات بتشتغل بس بعد ما تضيف المنصة للشاشة الرئيسية (iOS 16.4 فما فوق): اضغط زرار المشاركة في Safari ← «إضافة إلى الشاشة الرئيسية»، وافتح المنصة من الأيقونة الجديدة، وبعدها فعّل الإشعارات.',
    nosupport: 'المتصفح ده مش بيدعم الإشعارات. جرّب Chrome أو Edge.',
    offfail: 'معرفناش نلغي التفعيل دلوقتي. اتأكد من النت وجرّب تاني.',
    offok: 'اتلغّى تفعيل الإشعارات على الجهاز ده. تقدر تفعّلها تاني في أي وقت.'
};

function buildCard() {
    if (document.getElementById('psAppCard')) return;
    const anchor = document.getElementById('profileCardMain');
    if (!anchor) return;

    const st = document.createElement('style');
    st.textContent =
        '#psAppCard{max-width:600px;margin:16px auto 0;padding:18px;border-radius:20px;direction:rtl;text-align:right;background:var(--card-bg,#1e293b);border:1px solid var(--border-color,#334155);color:var(--text-main,#f8fafc)}' +
        '#psAppCard h3{font-size:1rem;margin:0 0 4px;font-weight:800}' +
        '#psAppCard .pa-sub{font-size:.8rem;color:var(--text-secondary,#94a3b8);line-height:1.7;margin-bottom:12px}' +
        '#psAppCard .pa-row{display:flex;align-items:center;gap:12px;padding:12px;border-radius:14px;border:1px solid var(--border-color,#334155);background:rgba(255,255,255,.03);margin-top:10px;flex-wrap:wrap}' +
        '#psAppCard .pa-row.ok{border-color:rgba(16,185,129,.55);background:rgba(16,185,129,.08)}' +
        '#psAppCard .pa-row.todo{border-color:rgba(245,158,11,.55);background:rgba(245,158,11,.08)}' +
        '#psAppCard .pa-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(99,102,241,.15);color:#a5b4fc;flex-shrink:0}' +
        '#psAppCard .pa-row.ok .pa-ic{background:rgba(16,185,129,.18);color:#34d399}' +
        '#psAppCard .pa-row.todo .pa-ic{background:rgba(245,158,11,.18);color:#fbbf24}' +
        '#psAppCard .pa-txt{flex:1;min-width:150px}' +
        '#psAppCard .pa-txt b{display:block;font-size:.9rem}' +
        '#psAppCard .pa-txt span{display:block;font-size:.76rem;color:var(--text-secondary,#94a3b8);line-height:1.7;margin-top:2px}' +
        '#psAppCard .pa-btn{border:0;border-radius:10px;padding:9px 16px;font-weight:800;font-size:.84rem;cursor:pointer;color:#fff;background:linear-gradient(135deg,#6366f1,#8b5cf6);font-family:inherit}' +
        '#psAppCard .pa-btn:disabled{opacity:.6;cursor:not-allowed}' +
        '#psAppCard .pa-btn.off{background:transparent;color:#f87171;border:1px solid rgba(248,113,113,.55)}' +
        '#psAppCard .pa-act{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
        '#psAppCard .pa-done{font-size:.8rem;font-weight:800;color:#34d399}' +
        '#psAppCard .pa-note{flex-basis:100%;font-size:.78rem;line-height:1.8;color:var(--text-secondary,#94a3b8)}';
    document.head.appendChild(st);

    const card = document.createElement('div');
    card.id = 'psAppCard';
    card.innerHTML =
        '<h3>تثبيت التطبيق والإشعارات</h3>' +
        '<div class="pa-sub">ثبّت المنصة على جهازك وفعّل الإشعارات عشان توصلك تنبيهات الامتحانات والمنافسات حتى والتطبيق مقفول.</div>' +
        '<div class="pa-row" id="paInstall"></div>' +
        '<div class="pa-row" id="paNotif"></div>';
    anchor.insertAdjacentElement('afterend', card);

    const mk = (id, ok, title, desc, btnText, onClick, note, offText, onOff) => {
        const row = document.getElementById(id);
        row.className = 'pa-row ' + (ok ? 'ok' : 'todo');
        row.innerHTML = '<div class="pa-ic">' + (id === 'paInstall'
            ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>'
            : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>') + '</div>' +
            '<div class="pa-txt"><b></b><span></span></div>';
        row.querySelector('b').textContent = title;
        row.querySelector('span').textContent = desc;
        if (ok) {
            const act = document.createElement('div'); act.className = 'pa-act';
            const d = document.createElement('div'); d.className = 'pa-done'; d.textContent = '✓ شغّال'; act.appendChild(d);
            if (offText) {
                const ob = document.createElement('button'); ob.type = 'button'; ob.className = 'pa-btn off'; ob.textContent = offText;
                ob.onclick = () => onOff(ob, row);
                act.appendChild(ob);
            }
            row.appendChild(act);
        } else if (btnText) {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'pa-btn'; b.textContent = btnText;
            b.onclick = () => onClick(b, row);
            row.appendChild(b);
        }
        if (note) { const n = document.createElement('div'); n.className = 'pa-note'; n.textContent = note; row.appendChild(n); }
    };

    const paintInstall = () => {
        const api = window.PSInstall || {};
        if (standalone()) lsSet(INST_KEY, '1');
        if (standalone() || api.installed || lsGet(INST_KEY) === '1') {
            mk('paInstall', true, 'التطبيق مثبّت', 'بتفتح المنصة من أيقونتها زي أي تطبيق.', null, null, null, 'إلغاء التثبيت', (b, row) => {
                // المتصفح مش بيسمح لأي موقع يمسح التطبيق بنفسه، فبنعرض الخطوات حسب الجهاز
                let n = row.querySelector('.pa-note');
                if (!n) { n = document.createElement('div'); n.className = 'pa-note'; row.appendChild(n); }
                n.textContent = isIOS
                    ? 'على الآيفون: من الشاشة الرئيسية اضغط ضغطة طويلة على أيقونة المنصة ← «حذف التطبيق» ← «حذف من الشاشة الرئيسية».'
                    : (/Android/i.test(navigator.userAgent)
                        ? 'على أندرويد: اضغط ضغطة طويلة على أيقونة المنصة ← «إلغاء التثبيت» (أو «معلومات التطبيق» ← «إلغاء التثبيت»).'
                        : 'على الكمبيوتر: افتح التطبيق واضغط ⋮ (أعلى الشاشة) ← «Uninstall» (إلغاء التثبيت).');
                lsDel(INST_KEY);
            });
        } else if (api.deferred) {
            mk('paInstall', false, 'ثبّت التطبيق على جهازك', 'يفتح من أيقونة على الشاشة الرئيسية بدون متصفح.', 'ثبّت التطبيق', async (b) => {
                b.disabled = true;
                try { api.deferred.prompt(); await api.deferred.userChoice; } catch (e) {}
                api.deferred = null; paintInstall();
            });
        } else if (isIOS) {
            mk('paInstall', false, 'ثبّت التطبيق على جهازك', 'محتاج خطوتين بسيطتين من Safari.', null, null,
                'اضغط زرار المشاركة (المربع اللي فيه سهم لفوق) في أسفل Safari، وبعدين اختار «إضافة إلى الشاشة الرئيسية» وبعدها «إضافة».');
        } else {
            mk('paInstall', false, 'ثبّت التطبيق على جهازك', 'لو الزرار مش ظاهر، التثبيت بيتم من قائمة المتصفح.', null, null,
                'على أندرويد (Chrome): اضغط ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». على الكمبيوتر: اضغط أيقونة التثبيت في شريط العنوان، أو ⋮ ثم «Cast, save, and share» ثم «Install page as app».');
        }
    };

    const paintNotif = () => {
        const granted = supported && Notification.permission === 'granted' && !userOff();
        if (granted) {
            mk('paNotif', true, 'الإشعارات مفعّلة', 'هتوصلك تنبيهات الامتحانات والمنافسات.', null, null, null, 'إلغاء التفعيل', async (b, row) => {
                b.disabled = true; b.textContent = 'جاري الإلغاء...';
                const r = await unregister();
                if (r === 'ok') { paintNotif(); const n = document.querySelector('#paNotif .pa-note'); if (n) n.textContent = MSG.offok; return; }
                b.disabled = false; b.textContent = 'إلغاء التفعيل';
                let n = row.querySelector('.pa-note');
                if (!n) { n = document.createElement('div'); n.className = 'pa-note'; row.appendChild(n); }
                n.textContent = MSG.offfail;
            });
            return;
        }
        const denied = supported && Notification.permission === 'denied';
        mk('paNotif', false, 'فعّل إشعارات المنصة', 'عشان متفوتش امتحان أو منافسة جديدة.', 'فعّل الإشعارات', async (b, row) => {
            let note = row.querySelector('.pa-note');
            if (!note) { note = document.createElement('div'); note.className = 'pa-note'; row.appendChild(note); }
            note.textContent = '';
            if (!supported) { note.textContent = (isIOS && !standalone()) ? MSG.ios : MSG.nosupport; return; }
            if (Notification.permission === 'denied') { note.textContent = MSG.denied; return; }
            b.disabled = true; b.textContent = 'جاري التفعيل...';
            const r = await register(false);
            if (r === 'ok') { paintNotif(); return; }
            b.disabled = false; b.textContent = 'فعّل الإشعارات';
            note.textContent = MSG[r] || MSG.fail;
        }, denied ? MSG.denied : ((!supported && isIOS && !standalone()) ? MSG.ios : ''));
    };

    paintInstall(); paintNotif();
    window.addEventListener('ps-install-change', paintInstall);
}

if (isProfile) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildCard); else buildCard();
}
